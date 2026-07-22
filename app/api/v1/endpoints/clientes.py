from fastapi import APIRouter, HTTPException, status
from app.schemas.cliente import ClienteCreate, ClienteResponse
from app.core.config import supabase_client
from postgrest.exceptions import APIError
from app.core.security import gerar_hash_senha

router = APIRouter()

@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
async def cadastrar_cliente(cliente: ClienteCreate):
    """
    Cadastra um novo cliente no sistema e envia os dados diretamente para o Supabase.
    """
    try:
        # Converte o schema Pydantic em um dicionário Python pronto para o banco
        dados_cliente = cliente.model_dump()
        
        # Gera o hash da senha
        dados_cliente["senha"] = gerar_hash_senha(dados_cliente["senha"])
        
        # Insere na tabela 'clientes' do Supabase
        resposta = supabase_client.table("clientes").insert(dados_cliente).execute()
        
        # Verifica se o banco retornou os dados inseridos
        if not resposta.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao inserir o cliente no banco de dados."
            )
            
        return resposta.data[0]
        
    except APIError as error:
        # Trata erros enviados diretamente pelo PostgreSQL (ex: CPF duplicado)
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