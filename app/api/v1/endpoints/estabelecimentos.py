from fastapi import APIRouter, HTTPException, status
from app.schemas.estabelecimento import EstabelecimentoCreate, EstabelecimentoResponse
from app.core.config import supabase_client
from postgrest.exceptions import APIError
from typing import List, Optional
from app.core.security import gerar_hash_senha

router = APIRouter()

@router.post("/", response_model=EstabelecimentoResponse, status_code=status.HTTP_201_CREATED)
async def cadastrar_estabelecimento(estabelecimento: EstabelecimentoCreate):
    """
    Cadastra um novo estabelecimento ou profissional autônomo no ecossistema Levvel.
    """
    try:
        dados_estabelecimento = estabelecimento.model_dump()
        
        # Gera o hash da senha
        dados_estabelecimento["senha_hash"] = gerar_hash_senha(dados_estabelecimento["senha"])
        
        # Insere os dados na tabela 'estabelecimentos' do Supabase
        resposta = supabase_client.table("estabelecimentos").insert(dados_estabelecimento).execute()
        
        if not resposta.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao inserir o estabelecimento no banco de dados."
            )
            
        return resposta.data[0]
        
    except APIError as error:
        # Tratamento do erro Postgres 23505 (Unique Violation) -> E-mail ou CNPJ já cadastrado
        if error.code == "23505":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um estabelecimento cadastrado com este e-mail ou CNPJ."
            )
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no Supabase: {error.message}"
        )

@router.get("/", response_model=List[EstabelecimentoResponse])
async def listar_estabelecimentos(categoria: Optional[str] = None):
    """
    Lista todos os estabelecimentos. Permite filtros por categoria ou serviço.
    """
    try:
        query = supabase_client.table("estabelecimentos").select("*")
        
        if categoria:
            # Busca filtrando se o termo existe no array de serviços oferecidos
            query = query.contains("servicos_oferecidos", [categoria])
            
        resposta = query.execute()
        return resposta.data
        
    except APIError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar estabelecimentos: {error.message}"
        )