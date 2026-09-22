from fastapi import APIRouter, HTTPException, logger, status, Query
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
    response_model=AgendamentoResponse
)
async def atualizar_status_agendamento(
    agendamento_id: str,
    status_update: AgendamentoStatusUpdate
):
    """
    Atualiza o status do agendamento.

    Ao confirmar:
    - verifica conexão com Google Calendar;
    - cria o evento;
    - salva google_event_id;
    - confirma o agendamento.
    """

    try:

        # =====================================================
        # CONFIRMAÇÃO
        # =====================================================

        if status_update.status == "confirmado":

            resposta = (
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

            if not resposta.data:
                raise HTTPException(
                    status_code=404,
                    detail="Agendamento não encontrado."
                )

            agendamento = resposta.data

            cliente = agendamento.get("clientes")
            estabelecimento = agendamento.get(
                "estabelecimentos"
            )

            if not cliente:
                raise HTTPException(
                    status_code=400,
                    detail="Cliente do agendamento não encontrado."
                )

            if not estabelecimento:
                raise HTTPException(
                    status_code=400,
                    detail="Estabelecimento do agendamento não encontrado."
                )

            # =================================================
            # GOOGLE CALENDAR
            # =================================================

            if (
                not estabelecimento.get(
                    "google_calendar_conectado"
                )
                or not estabelecimento.get(
                    "google_refresh_token"
                )
            ):
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "GOOGLE_CALENDAR_NOT_CONNECTED",
                        "message": (
                            "Conecte sua conta Google "
                            "antes de confirmar o agendamento."
                        )
                    }
                )

            # =================================================
            # CONVERTE DATA
            # =================================================

            from datetime import datetime

            data_inicio = agendamento[
                "data_hora_inicio"
            ]

            if isinstance(data_inicio, str):
                data_inicio = datetime.fromisoformat(
                    data_inicio.replace(
                        "Z",
                        "+00:00"
                    )
                )

            # =================================================
            # CRIA EVENTO GOOGLE
            # =================================================

            try:

                evento_google = criar_agendamento(
                    refresh_token=estabelecimento[
                        "google_refresh_token"
                    ],

                    client_id=settings.GOOGLE_CLIENT_ID,
                    client_secret=settings.GOOGLE_CLIENT_SECRET,

                    resumo=(
                        f"{agendamento['tratamento']} - "
                        f"{estabelecimento['nome_estabelecimento']}"
                    ),

                    descricao=(
                        "Agendamento confirmado via Levvel.\n"
                        f"Cliente: {cliente['nome_usuario']}\n"
                        f"Profissional: "
                        f"{agendamento.get('profissional_envolvido', 'N/A')}"
                    ),

                    localizacao=estabelecimento[
                        "localizacao"
                    ],

                    data_inicio=data_inicio,

                    duracao_minutos=agendamento.get(
                        "duracao_estimada_minutos",
                        45
                    ),

                    email_cliente=cliente["email"],

                    email_estabelecimento=estabelecimento[
                        "email"
                    ],
                )

            except Exception as calendar_error:

                logger.error(
                    "Erro Google Calendar: %s",
                    str(calendar_error)
                )

                raise HTTPException(
                    status_code=502,
                    detail={
                        "code": "GOOGLE_CALENDAR_ERROR",
                        "message": (
                            "Não foi possível registrar o "
                            "agendamento no Google Calendar."
                        )
                    }
                )

            # =================================================
            # GOOGLE OK → CONFIRMA
            # =================================================

            dados_atualizacao = {
                "status": "confirmado",
                "google_event_id": evento_google["id"],
            }

            resposta_update = (
                supabase_client
                .table("agendamentos")
                .update(dados_atualizacao)
                .eq("id", agendamento_id)
                .execute()
            )

            if not resposta_update.data:
                raise HTTPException(
                    status_code=400,
                    detail="Erro ao confirmar agendamento."
                )

            return resposta_update.data[0]

        # =====================================================
        # OUTROS STATUS
        # =====================================================

        dados_atualizacao = {
            "status": status_update.status
        }

        if status_update.motivo_recusa:
            dados_atualizacao[
                "motivo_recusa"
            ] = status_update.motivo_recusa

        resposta = (
            supabase_client
            .table("agendamentos")
            .update(dados_atualizacao)
            .eq("id", agendamento_id)
            .execute()
        )

        if not resposta.data:
            raise HTTPException(
                status_code=404,
                detail="Agendamento não encontrado."
            )

        return resposta.data[0]

    except HTTPException:
        raise

    except APIError as error:
        raise HTTPException(
            status_code=400,
            detail=f"Erro no Supabase: {error.message}"
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