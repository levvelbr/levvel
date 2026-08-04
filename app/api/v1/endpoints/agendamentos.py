from fastapi import APIRouter, HTTPException, logger, status, Query
from ultralytics import settings
from app.api.v1.endpoints.google_calendar import criar_agendamento
from app.schemas.agendamento import (
    AgendamentoCreate, 
    AgendamentoResponse, 
    AgendamentoStatusUpdate, 
    AvaliacaoEncerramento
)
from app.core.config import supabase_client
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


@router.patch("/{agendamento_id}/status", response_model=AgendamentoResponse)
async def atualizar_status_agendamento(agendamento_id: str, status_update: AgendamentoStatusUpdate):
    """
    Atualiza o estado do agendamento (Ex: Aceitar -> 'confirmado', Recusar -> 'recusado', 
    Iniciar -> 'em_andamento', Cancelar -> 'cancelado').
    """
    try:
        # 1. Prepara os dados de atualização incluindo motivo_recusa se fornecido
        dados_atualizacao = {"status": status_update.status}
        if status_update.motivo_recusa:
            dados_atualizacao["motivo_recusa"] = status_update.motivo_recusa

        # 2. Atualiza e retorna o agendamento no Supabase
        resposta = supabase_client.table("agendamentos")\
            .update(dados_atualizacao)\
            .eq("id", agendamento_id)\
            .execute()
            
        if not resposta.data:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")

        agendamento = resposta.data[0]

        # 3. Dispara a criação no Google Calendar apenas se for 'confirmado'
        if status_update.status == "confirmado":
            try:
                # Busca informações estendidas do cliente e estabelecimento usando o Supabase
                agendamento_detalhado = supabase_client.table("agendamentos")\
                    .select("*, clientes(email, nome_usuario), estabelecimentos(email, nome_estabelecimento, google_refresh_token)")\
                    .eq("id", agendamento_id)\
                    .single()\
                    .execute()

                dados_relacionados = agendamento_detalhado.data
                cliente = dados_relacionados.get("clientes")
                estabelecimento = dados_relacionados.get("estabelecimentos")

                # Se o estabelecimento tiver a conta do Google conectada (Refresh Token salvo)
                if estabelecimento and estabelecimento.get("google_refresh_token"):
                    google_event_id = criar_agendamento(
                        refresh_token=estabelecimento["google_refresh_token"],
                        client_id=settings.GOOGLE_CLIENT_ID,
                        client_secret=settings.GOOGLE_CLIENT_SECRET,
                        resumo=f"{agendamento['tratamento']} - {estabelecimento['nome_estabelecimento']}",
                        descricao=f"Agendamento confirmado via Levvel.\nProfissional: {agendamento.get('profissional_envolvido', 'N/A')}",
                        data_hora_inicio=agendamento["data_hora_inicio"],
                        duracao_minutos=agendamento.get("duracao_estimada_minutos", 45),
                        email_cliente=cliente["email"],
                        email_estabelecimento=estabelecimento["email"]
                    )

                    # Salva o google_event_id retornado na tabela de agendamentos para controle futuro
                    supabase_client.table("agendamentos")\
                        .update({"google_event_id": google_event_id})\
                        .eq("id", agendamento_id)\
                        .execute()

            except Exception as calendar_err:
                # Trata a exceção em log sem interromper a resposta da API ao frontend
                logger.error(f"Erro na sincronização do Google Calendar: {str(calendar_err)}")

        return agendamento

    except APIError as error:
        raise HTTPException(status_code=400, detail=f"Erro no Supabase: {error.message}")

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