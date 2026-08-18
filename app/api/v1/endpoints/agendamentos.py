from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Query
import logging
# from ultralytics import settings
from app.api.v1.endpoints.google_calendar import criar_agendamento
from app.schemas.agendamento import (
    AgendamentoCreate, 
    AgendamentoResponse, 
    AgendamentoStatusUpdate, 
    AvaliacaoEncerramento
)
from app.core.config import supabase_client, settings
from postgrest.exceptions import APIError
from typing import List, Optional

router = APIRouter()

logger = logging.getLogger(__name__)

async def sincronizar_google_calendar(
    agendamento_id: str,
    agendamento: dict,
) -> None:
    try:
        agendamento_detalhado = (
            supabase_client
            .table("agendamentos")
            .select(
                """
                *,
                clientes(
                    email,
                    nome_usuario
                ),
                estabelecimentos(
                    email,
                    nome_estabelecimento,
                    localizacao,
                    google_refresh_token,
                    google_calendar_conectado
                )
                """
            )
            .eq("id", agendamento_id)
            .single()
            .execute()
        )

        dados_relacionados = agendamento_detalhado.data

        if not dados_relacionados:
            raise ValueError(
                "Dados do agendamento não foram encontrados."
            )

        cliente = dados_relacionados.get("clientes")
        estabelecimento = dados_relacionados.get("estabelecimentos")

        if not cliente:
            raise ValueError(
                "Cliente relacionado ao agendamento não encontrado."
            )

        if not estabelecimento:
            raise ValueError(
                "Estabelecimento relacionado não encontrado."
            )

        refresh_token = estabelecimento.get(
            "google_refresh_token"
        )

        if not refresh_token:
            logger.warning(
                "O estabelecimento do agendamento %s ainda não "
                "conectou o Google Calendar.",
                agendamento_id,
            )

            (
                supabase_client
                .table("agendamentos")
                .update({
                    "google_calendar_status": "nao_conectado",
                    "google_calendar_error": (
                        "O estabelecimento não conectou "
                        "o Google Calendar."
                    ),
                })
                .eq("id", agendamento_id)
                .execute()
            )

            return

        email_cliente = cliente.get("email")

        if not email_cliente:
            raise ValueError(
                "O cliente não possui e-mail cadastrado."
            )

        valor_data_inicio = agendamento.get(
            "data_hora_inicio"
        )

        if not valor_data_inicio:
            raise ValueError(
                "O agendamento não possui data_hora_inicio."
            )

        data_inicio = converter_data_inicio(
            valor_data_inicio
        )

        evento_google = criar_agendamento(
            refresh_token=refresh_token,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            resumo=(
                f"{agendamento['tratamento']} - "
                f"{estabelecimento['nome_estabelecimento']}"
            ),
            descricao=(
                "Agendamento confirmado via Levvel.\n"
                f"Cliente: "
                f"{cliente.get('nome_usuario', 'Não informado')}\n"
                f"Profissional: "
                f"{agendamento.get('profissional_envolvido', 'N/A')}"
            ),
            localizacao=estabelecimento.get(
                "localizacao",
                "",
            ),
            data_inicio=data_inicio,
            duracao_minutos=agendamento.get(
                "duracao_estimada_minutos",
                45,
            ),
            email_cliente=email_cliente,
        )

        (
            supabase_client
            .table("agendamentos")
            .update({
                "google_event_id": evento_google["id"],
                "google_event_link": evento_google.get(
                    "html_link"
                ),
                "google_calendar_status": "sincronizado",
                "google_calendar_error": None,
            })
            .eq("id", agendamento_id)
            .execute()
        )

        logger.info(
            "Agendamento %s sincronizado com o Google Calendar. "
            "Evento: %s",
            agendamento_id,
            evento_google["id"],
        )

    except Exception as calendar_err:
        logger.exception(
            "Erro na sincronização do Google Calendar "
            "para o agendamento %s: %s",
            agendamento_id,
            calendar_err,
        )

        try:
            (
                supabase_client
                .table("agendamentos")
                .update({
                    "google_calendar_status": "erro",
                    "google_calendar_error": str(calendar_err),
                })
                .eq("id", agendamento_id)
                .execute()
            )
        except Exception:
            logger.exception(
                "Também ocorreu um erro ao salvar o estado "
                "da sincronização no agendamento %s.",
                agendamento_id,
            )

def converter_data_inicio(valor: str | datetime) -> datetime:
    if isinstance(valor, datetime):
        return valor

    if not isinstance(valor, str):
        raise TypeError(
            "data_hora_inicio deve ser uma string ISO ou datetime."
        )

    try:
        return datetime.fromisoformat(
            valor.replace("Z", "+00:00")
        )
    except ValueError as error:
        raise ValueError(
            f"Formato inválido para data_hora_inicio: {valor}"
        ) from error

@router.post("/", response_model=AgendamentoResponse, status_code=status.HTTP_201_CREATED)
async def criar_solicitacao_agendamento(agendamento: AgendamentoCreate):
    """
    Cliente solicita um horário na agenda de um estabelecimento.
    Inicialmente entra com status 'pendente' aguardando aprovação.
    """
    try:
        dados = agendamento.model_dump(mode="json")
        dados["status"] = "pendente"
        
        resposta = supabase_client.table("agendamentos").insert(dados).execute()
        
        if not resposta.data:
            raise HTTPException(status_code=400, detail="Não foi possível processar o agendamento.")
            
        return resposta.data[0]
    except APIError as error:
        raise HTTPException(status_code=400, detail=f"Erro no Supabase: {error.message}")


@router.patch(
    "/{agendamento_id}/status",
    response_model=AgendamentoResponse,
)
async def atualizar_status_agendamento(
    agendamento_id: str,
    status_update: AgendamentoStatusUpdate,
):
    """
    Atualiza o estado do agendamento e sincroniza com o Google Calendar
    quando o estabelecimento confirma a solicitação.
    """
    try:
        dados_atualizacao = {
            "status": status_update.status,
        }

        if status_update.motivo_recusa:
            dados_atualizacao["motivo_recusa"] = (
                status_update.motivo_recusa
            )

        resposta = (
            supabase_client
            .table("agendamentos")
            .update(dados_atualizacao)
            .eq("id", agendamento_id)
            .execute()
        )

        if not resposta.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agendamento não encontrado.",
            )

        agendamento = resposta.data[0]

        if status_update.status == "confirmado":
            await sincronizar_google_calendar(
                agendamento_id=agendamento_id,
                agendamento=agendamento,
            )

            # Busca novamente para retornar o google_event_id atualizado.
            resposta_atualizada = (
                supabase_client
                .table("agendamentos")
                .select("*")
                .eq("id", agendamento_id)
                .single()
                .execute()
            )

            if resposta_atualizada.data:
                agendamento = resposta_atualizada.data

        return agendamento

    except HTTPException:
        raise

    except APIError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no Supabase: {error.message}",
        )

@router.post("/{agendamento_id}/encerrar", response_model=AgendamentoResponse)
async def encerrar_tratamento(
    agendamento_id: str, 
    avaliacao: AvaliacaoEncerramento,
    custo_final: float = Query(..., description="Custo final cobrado do atendimento")
):
    """
    Registra as avaliações mútuas, computa o custo final e encerra definitivamente o tratamento.
    """
    try:
        dados_encerramento = {
            "status": "concluido",
            "custo_final": custo_final,
            "avaliacao_estabelecimento_nota": avaliacao.avaliacao_estabelecimento_nota,
            "comentario_cliente": avaliacao.comentario_cliente,
            "avaliacao_cliente_nota": avaliacao.avaliacao_cliente_nota,
            "comentario_estabelecimento": avaliacao.comentario_estabelecimento
        }
        
        resposta = supabase_client.table("agendamentos")\
            .update(dados_encerramento)\
            .eq("id", agendamento_id).execute()
            
        if not resposta.data:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
            
        return resposta.data[0]
    except APIError as error:
        raise HTTPException(status_code=400, detail=f"Erro no Supabase: {error.message}")


@router.get("/estabelecimento/{estabelecimento_id}", response_model=List[AgendamentoResponse])
async def listar_agenda_estabelecimento(
    estabelecimento_id: str,
    status_filtro: Optional[str] = Query(None, alias="status", description="Filtrar por status ex: 'pendente', 'confirmado'")
):
    """
    Retorna os compromissos agendados do estabelecimento. 
    Permite filtrar por status via query params: /estabelecimento/UUID?status=pendente
    """
    query = supabase_client.table("agendamentos").select("*").eq("estabelecimento_id", estabelecimento_id)
    
    if status_filtro:
        query = query.eq("status", status_filtro)
        
    resposta = query.execute()
    return resposta.data


@router.get("/cliente/{cliente_id}", response_model=List[AgendamentoResponse])
async def listar_historico_cliente(cliente_id: str):
    """Retorna o histórico de atendimentos solicitados/realizados por um cliente."""
    resposta = supabase_client.table("agendamentos").select("*").eq("cliente_id", cliente_id).execute()
    return resposta.data