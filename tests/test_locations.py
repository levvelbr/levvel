import os
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

for key, value in {
    'SUPABASE_URL': 'https://example.supabase.co', 'SUPABASE_KEY': 'test-key',
    'SECRET_KEY': 'unit-tests-only', 'GOOGLE_CLIENT_ID': 'test',
    'GOOGLE_CLIENT_SECRET': 'test', 'GOOGLE_REDIRECT_URI': 'https://example.test/callback',
}.items():
    os.environ.setdefault(key, value)

with patch("supabase.create_client", return_value=MagicMock()):
    from app.api.v1.endpoints import estabelecimentos as endpoints
from app.core.security import get_usuario_logado
from app.schemas.estabelecimento import EnderecoEstabelecimentoCreate, EstabelecimentoCreate
from app.services.locations import distance_km, nearby_establishments


def address(lat=0, lon=0):
    return {'id': str(uuid4()), 'endereco_texto': 'Endereço atual', 'latitude': lat, 'longitude': lon}


def establishment(endereco=None, **overrides):
    return {
        'id': str(uuid4()), 'nome_estabelecimento': 'Teste', 'responsavel': 'Pessoa',
        'telefone': '123', 'email': 'test@example.com', 'localizacao': 'Endereço antigo',
        'tipo_pessoa': 'juridica', 'ativo': True, 'criado_em': '2026-10-30T12:00:00Z',
        'endereco': endereco, **overrides,
    }


@pytest.fixture
def context(monkeypatch):
    db = MagicMock()
    q = db.table.return_value
    for method in ('select', 'eq', 'order', 'range', 'contains', 'upsert', 'insert', 'update', 'delete'):
        getattr(q, method).return_value = q
    q.execute.return_value = SimpleNamespace(data=[])
    monkeypatch.setattr(endpoints, 'supabase_client', db)
    app = FastAPI()
    app.include_router(endpoints.router, prefix='/v1/estabelecimentos')
    app.dependency_overrides[get_usuario_logado] = lambda: {'sub': 'est-1', 'role': 'estabelecimento'}
    return TestClient(app), db, q, app


def test_distance_known_reference_and_zero():
    assert distance_km(0, 0, 0, 0) == 0
    assert distance_km(0, 0, 0, 1) == pytest.approx(111.195, abs=0.01)
    assert distance_km(0, 179.9, 0, -179.9) == pytest.approx(22.239, abs=0.01)
    assert distance_km(0, 0, 0, 180) == pytest.approx(20015.114, abs=0.01)


def test_canonical_source_and_unknown_positions():
    unknown = establishment(None, latitude=0, longitude=0)
    near = establishment(address(0, 0))
    far = establishment(address(0, 1))
    rows = [far, unknown, near]
    assert len(nearby_establishments(rows)) == 3
    result = nearby_establishments(rows, 0, 0)
    assert [x['id'] for x in result] == [near['id'], far['id'], unknown['id']]
    assert result[0]['localizacao'] == 'Endereço atual'
    assert result[2]['distancia_km'] is None
    assert [x['id'] for x in nearby_establishments(rows, 0, 0, 10)] == [near['id']]
    assert nearby_establishments([unknown], 0, 0, 10) == []


@pytest.mark.parametrize('payload', [
    {'latitude': 1}, {'longitude': 1}, {'latitude': 91, 'longitude': 0},
    {'latitude': 0, 'longitude': 181}, {'latitude': float('nan'), 'longitude': 0},
    {'latitude': 0, 'longitude': float('inf')},
])
def test_address_rejects_invalid_pair(payload):
    with pytest.raises(ValidationError):
        EnderecoEstabelecimentoCreate(endereco_texto='Rua teste', **payload)


def test_address_accepts_zero_and_clear():
    assert EnderecoEstabelecimentoCreate(endereco_texto='Rua teste', latitude=0, longitude=0).latitude == 0
    assert EnderecoEstabelecimentoCreate(endereco_texto='Rua teste').latitude is None


@pytest.mark.parametrize('query', [
    '?latitude=0', '?longitude=0', '?raio_km=10', '?latitude=91&longitude=0',
    '?latitude=0&longitude=181', '?latitude=nan&longitude=0',
    '?latitude=0&longitude=0&raio_km=0', '?latitude=0&longitude=0&raio_km=501',
])
def test_listing_validation(context, query):
    client, db, _, _ = context
    assert client.get('/v1/estabelecimentos/listar_estabelecimentos' + query).status_code == 422
    db.table.assert_not_called()


def test_listing_response_joins_address_and_hides_secrets(context):
    client, _, q, _ = context
    q.execute.return_value = SimpleNamespace(data=[establishment(address(0, 0), senha_hash='hidden', google_refresh_token='hidden')])
    response = client.get('/v1/estabelecimentos/listar_estabelecimentos?latitude=0&longitude=0&raio_km=1')
    assert response.status_code == 200, response.text
    item = response.json()[0]
    assert item['endereco']['latitude'] == 0
    assert item['distancia_km'] == 0
    assert 'senha_hash' not in item and 'google_refresh_token' not in item
    assert 'enderecos!' in q.select.call_args.args[0]
    q.eq.assert_any_call('ativo', True)


def test_address_save_is_scoped_to_authenticated_establishment(context):
    client, db, q, _ = context
    q.execute.return_value = SimpleNamespace(data=[address(0, 0)])
    response = client.patch('/v1/estabelecimentos/me/endereco', json={'endereco_texto': 'Rua teste', 'latitude': 0, 'longitude': 0, 'estabelecimento_id': 'outro'})
    assert response.status_code == 200, response.text
    db.table.assert_called_with('enderecos')
    payload = q.upsert.call_args.args[0]
    assert payload['estabelecimento_id'] == 'est-1'
    assert payload['latitude'] == 0 and payload['longitude'] == 0
    assert payload['atualizado_em']


def test_changing_address_without_position_clears_old_coordinates(context):
    client, _, q, _ = context
    q.execute.return_value = SimpleNamespace(data=[address(None, None)])
    assert client.patch('/v1/estabelecimentos/me/endereco', json={'endereco_texto': 'Novo endereço'}).status_code == 200
    payload = q.upsert.call_args.args[0]
    assert payload['latitude'] is None and payload['longitude'] is None


def test_client_cannot_update_establishment_address(context):
    client, db, _, app = context
    app.dependency_overrides[get_usuario_logado] = lambda: {'sub': 'client-1', 'role': 'cliente'}
    assert client.patch('/v1/estabelecimentos/me/endereco', json={'endereco_texto': 'Rua teste'}).status_code == 403
    db.table.assert_not_called()


def test_me_route_returns_canonical_address(context):
    client, _, q, _ = context
    q.execute.return_value = SimpleNamespace(data=[establishment(address(0, 0))])
    response = client.get('/v1/estabelecimentos/me')
    assert response.status_code == 200, response.text
    assert response.json()['endereco']['latitude'] == 0
    assert response.json()['localizacao'] == 'Endereço atual'
    assert 'servicos_oferecidos' in response.json()
    assert 'horario_funcionamento' in response.json()


def test_fixed_address_signup_requires_position_but_mobile_signup_does_not():
    payload = dict(nome_estabelecimento="Teste", responsavel="Pessoa", telefone="123",
                   email="teste@example.com", localizacao="Rua teste", cnpj="12345678901234",
                   senha_hash="test-only-password", aceitou_termos=True)
    with pytest.raises(ValidationError, match="Confirme a posição"):
        EstabelecimentoCreate(**payload, endereco={"endereco_texto": "Rua teste"})
    assert EstabelecimentoCreate(**payload, endereco={"endereco_texto": "Rua teste", "latitude": 0, "longitude": 0}).endereco.latitude == 0
    with pytest.raises(ValidationError, match="Confirme a posição"):
        EstabelecimentoCreate(**payload)
    mobile = EstabelecimentoCreate(**payload, sem_endereco_fixo=True, endereco=None)
    assert mobile.endereco is None
    assert "sem_endereco_fixo" not in mobile.model_dump()
    with pytest.raises(ValidationError, match="sem endereço fixo"):
        EstabelecimentoCreate(**payload, sem_endereco_fixo=True, endereco={"endereco_texto": "Rua teste", "latitude": 0, "longitude": 0})
