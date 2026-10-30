from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Query
# from supabase_auth import datetime
from app.schemas import estabelecimento
from app.schemas.estabelecimento import EstabelecimentoCreate, EstabelecimentoResponse, EstabelecimentoUpdate, EstabelecimentoPerfilResponse, EnderecoEstabelecimentoCreate, EnderecoEstabelecimentoResponse
from app.core.config import supabase_client, settings
from postgrest.exceptions import APIError
from typing import List, Optional
from app.core.security import gerar_hash_senha, get_usuario_logado
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

import secrets

from app.services.locations import (
    ESTABLISHMENT_SELECT, project_address, nearby_establishments,
)

router = APIRouter()


def require_establishment(usuario_logado):
    if usuario_logado.get("role") != "estabelecimento":
        raise HTTPException(status_code=403, detail="Acesso exclusivo para estabelecimentos.")
    user_id = usuario_logado.get("sub") or usuario_logado.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Estabelecimento não identificado.")
    return user_id


@router.post(
    "/",
    response_model=EstabelecimentoResponse,
    status_code=status.HTTP_201_CREATED
)
async def cadastrar_estabelecimento(
    estabelecimento: EstabelecimentoCreate
):
    """
    Cadastra um novo estabelecimento ou profissional autônomo
    no ecossistema Levvel.
    """
    try:
        dados_estabelecimento = estabelecimento.model_dump(
            mode="json",
            exclude={"endereco"},
        )
        dados_endereco = (
            estabelecimento.endereco.model_dump(
                mode="json",
                exclude_none=True,
            )
            if estabelecimento.endereco
            else {}
        )
        dados_endereco = {
            campo: valor
            for campo, valor in dados_endereco.items()
            if valor is not None
            and (not isinstance(valor, str) or valor.strip())
        }

        # Verifica documento já cadastrado
        if estabelecimento.tipo_pessoa == "autonomo":

            cpf_existente = (
                supabase_client
                .table("estabelecimentos")
                .select("id")
                .eq("cpf", estabelecimento.cpf)
                .execute()
            )

            if cpf_existente.data:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Já existe um estabelecimento cadastrado com este CPF."
                )

            # Garante que autônomo não salve CNPJ
            dados_estabelecimento["cnpj"] = None

        elif estabelecimento.tipo_pessoa == "juridica":

            cnpj_existente = (
                supabase_client
                .table("estabelecimentos")
                .select("id")
                .eq("cnpj", estabelecimento.cnpj)
                .execute()
            )

            if cnpj_existente.data:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Já existe um estabelecimento cadastrado com este CNPJ."
                )

            # Garante que empresa não salve CPF
            dados_estabelecimento["cpf"] = None

        # Verifica e-mail duplicado
        email_existente = (
            supabase_client
            .table("estabelecimentos")
            .select("id")
            .eq("email", estabelecimento.email)
            .execute()
        )

        if email_existente.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um estabelecimento cadastrado com este e-mail."
            )

        # Gera hash da senha
        dados_estabelecimento["senha_hash"] = gerar_hash_senha(
            dados_estabelecimento["senha_hash"]
        )

        # Insere no Supabase
        resposta = (
            supabase_client
            .table("estabelecimentos")
            .insert(dados_estabelecimento)
            .execute()
        )

        if not resposta.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao inserir o estabelecimento no banco de dados."
            )

        estabelecimento_criado = resposta.data[0]

        # Endereços são mantidos na tabela própria e vinculados pelo UUID.
        # Cadastro sem endereço fixo não cria registro em public.enderecos.
        if dados_endereco:
            endereco_payload = {
                **dados_endereco,
                "estabelecimento_id": estabelecimento_criado["id"],
            }

            try:
                endereco_salvo = (
                    supabase_client
                    .table("enderecos")
                    .insert(endereco_payload)
                    .execute()
                )
                if not endereco_salvo.data:
                    raise RuntimeError("Supabase não retornou o endereço salvo.")
            except Exception as error:
                # Evita deixar o estabelecimento parcialmente cadastrado.
                try:
                    (
                        supabase_client
                        .table("estabelecimentos")
                        .delete()
                        .eq("id", estabelecimento_criado["id"])
                        .execute()
                    )
                except Exception:
                    pass

                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Não foi possível salvar o endereço do estabelecimento."
                ) from error

        estabelecimento_criado["endereco"] = endereco_salvo.data[0] if dados_endereco else None
        return project_address(estabelecimento_criado)

    except HTTPException:
        raise

    except APIError as error:

        if error.code == "23505":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um cadastro utilizando estes dados."
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no Supabase: {error.message}"
        )

@router.get("/listar_estabelecimentos", response_model=List[EstabelecimentoResponse])
async def listar_estabelecimentos(
    categoria: Optional[str] = None,
    latitude: Optional[float] = Query(None, ge=-90, le=90, allow_inf_nan=False),
    longitude: Optional[float] = Query(None, ge=-180, le=180, allow_inf_nan=False),
    raio_km: Optional[float] = Query(None, gt=0, le=500, allow_inf_nan=False),
):
    """Lista ativos; com posição, ordena por distância em linha reta.

    Com raio, exclui estabelecimentos sem coordenadas. Sem posição, preserva
    a listagem geral. O endereço e as coordenadas vêm somente de enderecos.
    """
    if (latitude is None) != (longitude is None):
        raise HTTPException(status_code=422, detail="Informe latitude e longitude juntas.")
    if raio_km is not None and latitude is None:
        raise HTTPException(status_code=422, detail="Informe sua posição para filtrar por raio.")
    try:
        # Pagina para não truncar silenciosamente no limite padrão do PostgREST.
        rows, offset = [], 0
        while True:
            query = supabase_client.table("estabelecimentos").select(ESTABLISHMENT_SELECT).eq("ativo", True).order("id")
            if categoria:
                query = query.contains("servicos_oferecidos", [categoria])
            page = query.range(offset, offset + 499).execute().data or []
            rows.extend(page)
            if len(page) < 500:
                break
            offset += 500
        return nearby_establishments(rows, latitude, longitude, raio_km)
    except APIError as error:
        raise HTTPException(status_code=500, detail="Erro ao buscar estabelecimentos.") from error


@router.patch("/me/endereco", response_model=EnderecoEstabelecimentoResponse)
async def atualizar_endereco_estabelecimento(
    endereco: EnderecoEstabelecimentoCreate,
    usuario_logado: dict = Depends(get_usuario_logado),
):
    """Substitui o endereço cadastral; omitir coordenadas remove a posição antiga."""
    estabelecimento_id = require_establishment(usuario_logado)
    payload = endereco.model_dump(mode="json")
    payload.update({
        "estabelecimento_id": estabelecimento_id,
        "atualizado_em": datetime.now(timezone.utc).isoformat(),
    })
    try:
        response = supabase_client.table("enderecos").upsert(
            payload, on_conflict="estabelecimento_id"
        ).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Não foi possível salvar o endereço.")
        return response.data[0]
    except APIError as error:
        raise HTTPException(status_code=400, detail="Não foi possível salvar o endereço.") from error


SCOPES = [
    "https://www.googleapis.com/auth/calendar.events"
]


def criar_google_flow():
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )


@router.get("/google-calendar/conectar")
async def conectar_google_calendar(
    usuario_logado: dict = Depends(get_usuario_logado)
):
    estabelecimento_id = (
        usuario_logado.get("sub")
        or usuario_logado.get("id")
    )

    role = usuario_logado.get("role")

    if role != "estabelecimento":
        raise HTTPException(
            status_code=403,
            detail="Apenas estabelecimentos podem conectar o Google Calendar."
        )

    if not estabelecimento_id:
        raise HTTPException(
            status_code=401,
            detail="Estabelecimento não identificado."
        )

    state = secrets.token_urlsafe(32)

    # PKCE
    code_verifier = secrets.token_urlsafe(64)

    flow = criar_google_flow()

    flow.code_verifier = code_verifier

    supabase_client.table(
        "estabelecimentos"
    ).update({
        "google_oauth_state": state,
        "google_code_verifier": code_verifier
    }).eq(
        "id",
        estabelecimento_id
    ).execute()

    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state
    )

    print("URL GOOGLE:")
    print(authorization_url)

    return {
        "authorization_url": authorization_url
    }


@router.get("/google-calendar/callback")
async def google_calendar_callback(
    code: str,
    state: str
):
    resposta = (
        supabase_client
        .table("estabelecimentos")
        .select(
            "id, email, google_oauth_state, google_code_verifier"
        )
        .eq("google_oauth_state", state)
        .execute()
    )

    if not resposta.data:
        raise HTTPException(
            status_code=400,
            detail="State OAuth inválido ou expirado."
        )

    estabelecimento = resposta.data[0]

    estabelecimento_id = estabelecimento["id"]

    code_verifier = estabelecimento.get(
        "google_code_verifier"
    )

    if not code_verifier:
        raise HTTPException(
            status_code=400,
            detail="Code verifier OAuth não encontrado."
        )

    flow = criar_google_flow()

    flow.code_verifier = code_verifier

    try:
        flow.fetch_token(
            code=code
        )

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=(
                "Erro ao obter autorização Google: "
                f"{str(error)}"
            )
        )

    credentials = flow.credentials

    if not credentials.refresh_token:
        raise HTTPException(
            status_code=400,
            detail="Google não retornou refresh_token."
        )

    # Não precisamos consultar calendars().get().
    # Para o MVP usamos o e-mail do estabelecimento.
    google_calendar_email = estabelecimento["email"]

    resposta_update = (
        supabase_client
        .table("estabelecimentos")
        .update({
            "google_refresh_token":
                credentials.refresh_token,

            "google_calendar_conectado":
                True,

            "google_calendar_email":
                google_calendar_email,

            "google_oauth_state":
                None,

            "google_code_verifier":
                None,
        })
        .eq(
            "id",
            estabelecimento_id
        )
        .execute()
    )

    if not resposta_update.data:
        raise HTTPException(
            status_code=500,
            detail=(
                "Autorização Google obtida, "
                "mas não foi possível salvar a conexão."
            )
        )

    return {
        "message":
            "Google Calendar conectado com sucesso.",

        "google_calendar_email":
            google_calendar_email
    }
        
@router.get("/me", response_model=EstabelecimentoPerfilResponse)
async def obter_perfil_estabelecimento_autenticado(usuario_logado: dict = Depends(get_usuario_logado)):
    """
    Retorna os dados do perfil do estabelecimento autenticado.
    """
    estabelecimento_id = usuario_logado.get("id") or usuario_logado.get("sub")
    
    if not estabelecimento_id or str(estabelecimento_id) == "None":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID do estabelecimento não fornecido ou inválido."
        )
    
    resposta = supabase_client.table("estabelecimentos").select(ESTABLISHMENT_SELECT).eq("id", estabelecimento_id).execute()
    
    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estabelecimento não encontrado."
        )
        
    return project_address(resposta.data[0])


@router.get("/{estabelecimento_id}", response_model=EstabelecimentoResponse)
async def obter_perfil_estabelecimento(estabelecimento_id: str, usuario_logado: dict = Depends(get_usuario_logado)):
    """
    Busca os dados de perfil de um estabelecimento específico pelo ID.
    """

    if estabelecimento_id =="me":
        estabelecimento_id = usuario_logado.get("sub")  # Obtém o ID do estabelecimento autenticado do token JWT
    
    resposta = supabase_client.table("estabelecimentos").select(ESTABLISHMENT_SELECT).eq("id", estabelecimento_id).execute()
    
    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estabelecimento não encontrado."
        )
        
    return project_address(resposta.data[0])


@router.patch("/me/update", response_model=EstabelecimentoPerfilResponse)
async def atualizar_perfil_estabelecimento(
    estabelecimento_atualizado: EstabelecimentoUpdate, 
    usuario_logado: dict = Depends(get_usuario_logado)
):
    """
    Atualiza os dados do perfil do estabelecimento autenticado.
    """
    estabelecimento_id = usuario_logado.get("sub") or usuario_logado.get("id")

    if not estabelecimento_id or str(estabelecimento_id) == "None":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID do estabelecimento não fornecido ou inválido."
        )
    
    if "localizacao" in estabelecimento_atualizado.model_fields_set:
        raise HTTPException(status_code=422, detail="Atualize o endereço em /me/endereco.")

    update_data = estabelecimento_atualizado.model_dump(exclude_unset=True, mode="json")
    update_data = {k: v for k, v in update_data.items() if v is not None}  # Remove campos com valor None
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum dado válido fornecido para atualização."
        )
    
    try:
        resposta = supabase_client.table("estabelecimentos").update(update_data).eq("id", estabelecimento_id).execute()
        
        if not resposta.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao atualizar o perfil do estabelecimento."
            )
            
        perfil = supabase_client.table("estabelecimentos").select(ESTABLISHMENT_SELECT).eq("id", estabelecimento_id).execute()
        return project_address(perfil.data[0])
        
    except APIError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao atualizar o perfil do estabelecimento: {error.message}"
        )


@router.post("/me/foto-perfil", response_model=EstabelecimentoPerfilResponse)
async def upload_foto_perfil_estabelecimento(
    file: UploadFile = File(...),
    usuario_logado: dict = Depends(get_usuario_logado)
):
    """
    Endpoint para upload da foto de perfil do estabelecimento autenticado.
    """
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo inválido. Apenas JPEG, PNG e WEBP são permitidos."
        )

    file_bytes = await file.read()
    estabelecimento_id = usuario_logado.get("sub") or usuario_logado.get("id")
    file_ext = file.filename.split(".")[-1]
    
    # Caminho do arquivo dentro do bucket
    file_path = f"estabelecimentos/{estabelecimento_id}/foto_perfil.{file_ext}"

    try:
        # 1. Upload para o Storage ("x-upsert": "true" garante a substituição sem erro 409)
        supabase_client.storage.from_("avatars_est").upload(
            file_path,
            file_bytes,
            file_options={
                "content-type": file.content_type, 
                "x-upsert": "true"
            }
        )

        # 2. Obter URL Pública base
        public_url_res = supabase_client.storage.from_("avatars_est").get_public_url(file_path)
        
        # Trata variações de retorno das versões da biblioteca
        if isinstance(public_url_res, dict):
            raw_url = public_url_res.get("publicUrl") or public_url_res.get("public_url")
        elif hasattr(public_url_res, "public_url"):
            raw_url = public_url_res.public_url
        else:
            raw_url = str(public_url_res)

        # 3. Adiciona query param com timestamp para matar o cache de imagem do navegador
        timestamp = int(datetime.now().timestamp())
        foto_estabelecimento_url = f"{raw_url}?v={timestamp}"

        # 4. Atualizar registro no banco
        resposta = (
            supabase_client.table("estabelecimentos")
            .update({"foto_estabelecimento_url": foto_estabelecimento_url})
            .eq("id", estabelecimento_id)
            .execute()
        )

        if not resposta.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao atualizar a foto de perfil no banco de dados."
            )

        perfil = supabase_client.table("estabelecimentos").select(ESTABLISHMENT_SELECT).eq("id", estabelecimento_id).execute()
        return project_address(perfil.data[0])

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload da foto de perfil: {str(e)}"
        )
