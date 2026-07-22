from fastapi import APIRouter, HTTPException, status, Query
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
        # Prepara os dados de atualização incluindo motivo_recusa se fornecido
        dados_atualizacao = {"status": status_update.status}
        if status_update.motivo_recusa:
            dados_atualizacao["motivo_recusa"] = status_update.motivo_recusa

        resposta = supabase_client.table("agendamentos")\
            .update(dados_atualizacao)\
            .eq("id", agendamento_id).execute()
            
        if not resposta.data:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")
            
        return resposta.data[0]
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