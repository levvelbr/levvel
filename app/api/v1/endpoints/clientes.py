from fastapi import APIRouter, HTTPException, status
from pydantic import json
from app.schemas.cliente import ClienteCreate, ClienteResponse
from app.core.config import supabase_client
from postgrest.exceptions import APIError
from app.core.security import gerar_hash_senha

router = APIRouter()

# 1. Mapeia tanto "" quanto "/" para evitar 404 por divergência de barra no final
@router.post("", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def cadastrar_cliente(cliente: ClienteCreate):
    """
    Cadastra um novo cliente no sistema e envia os dados diretamente para o Supabase.
    """
    try:
        # Converte o schema em dicionário
        dados_cliente = cliente.model_dump(mode="json")
        
        # 2. Remove a senha em texto puro do dicionário antes de enviar ao Supabase!
        senha_pura = dados_cliente.pop("senha") 
        dados_cliente["senha_hash"] = gerar_hash_senha(senha_pura)
        
        # Insere na tabela 'clientes' do Supabase
        resposta = supabase_client.table("clientes").insert(dados_cliente).execute()
        
        if not resposta.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao inserir o cliente no banco de dados."
            )
            
        return resposta.data[0]
        
    except APIError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro no banco de dados: {error.message}"
        )

@router.get("/{cliente_id}", response_model=ClienteResponse)
async def obter_perfil_cliente(cliente_id: str):
    """
    Busca os dados de perfil de um cliente específico pelo ID.
    """
    resposta = supabase_client.table("clientes").select("*").eq("id", cliente_id).execute()
    
    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado."
        )
        
    return resposta.data[0]