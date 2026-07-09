from fastapi import APIRouter, HTTPException, status
from app.schemas.estabelecimento import EstabelecimentoCreate, EstabelecimentoResponse
from app.core.config import supabase_client
from postgrest.exceptions import APIError
from typing import List, Optional

router = APIRouter()

@router.post("/", response_model=EstabelecimentoResponse, status_code=status.HTTP_201_CREATED)
async def cadastrar_estabelecimento(estabelecimento: EstabelecimentoCreate):
    """
    Cadastra um novo estabelecimento ou profissional autônomo no ecossistema Levvel.
    """
    try:
        dados_estabelecimento = estabelecimento.model_dump()
        
        # Insere os dados na tabela 'estabelecimentos' do Supabase
        resposta = supabase_client.table("estabelecimentos").insert(dados_estabelecimento).execute()
        
        if not resposta.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao inserir o estabelecimento no banco de dados."
            )
            
        return resposta.data[0]
        
    except APIError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no Supabase: {error.message}"
        )

@router.get("/", response_model=List[EstabelecimentoResponse])
async def listar_estabelecimentos(categoria: Optional[str] = None):
    """
    Lista todos os estabelecimentos. Permite filtros futuros por categoria ou localização.
    """
    try:
        # Busca básica no Supabase
        query = supabase_client.table("estabelecimentos").select("*")
        
        # Exemplo de filtro caso o front-end envie parâmetros
        if categoria:
            query = query.contains("servicos_oferecidos", [categoria])
            
        resposta = query.execute()
        return resposta.data
        
    except APIError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar estabelecimentos: {error.message}"
        )