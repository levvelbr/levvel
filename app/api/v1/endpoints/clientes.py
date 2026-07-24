from datetime import datetime
from uuid import uuid4
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import json
from app.schemas.cliente import ClienteCreate, ClientePerfilResponse, ClienteResponse, ClienteUpdate
from app.core.config import supabase_client
from postgrest.exceptions import APIError
from app.core.security import gerar_hash_senha
from app.core.security import get_usuario_logado

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
async def obter_perfil_cliente(cliente_id: str, usuario_logado: dict = Depends(get_usuario_logado)):
    """
    Busca os dados de perfil de um cliente específico pelo ID.
    """

    if cliente_id =="me":
        cliente_id = usuario_logado.get("sub")  # Obtém o ID do cliente autenticado do token JWT
    
    resposta = supabase_client.table("clientes").select("*").eq("id", cliente_id).execute()
    
    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado."
        )
        
    return resposta.data[0]

@router.get("/me", response_model=ClientePerfilResponse)
async def obter_perfil_cliente_autenticado(usuario_logado: dict = Depends(get_usuario_logado)):
    """
    Retorna os dados do perfil do cliente autenticado.
    """
    cliente_id = usuario_logado.get("id") or usuario_logado.get("sub")
    
    if not cliente_id or str(cliente_id) == "None":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID do cliente não fornecido ou inválido."
        )
    
    resposta = supabase_client.table("clientes").select("*").eq("id", cliente_id).execute()
    
    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado."
        )
        
    return resposta.data[0]


@router.patch("/me", response_model=ClientePerfilResponse)
async def atualizar_perfil_cliente(
    cliente_atualizado: ClienteUpdate, 
    usuario_logado: dict = Depends(get_usuario_logado)
):
    """
    Atualiza os dados do perfil do cliente autenticado.
    """
    cliente_id = usuario_logado.get("sub") or usuario_logado.get("id")

    if not cliente_id or str(cliente_id) == "None":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID do cliente não fornecido ou inválido."
        )
    
    update_data = cliente_atualizado.model_dump(exclude_unset=True, mode="json")
        
    resposta = supabase_client.table("clientes").update(update_data).eq("id", cliente_id).execute()
    
    if not resposta.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erro ao atualizar o perfil do cliente."
        )
        
    return resposta.data[0]


@router.post("/me/foto-perfil", response_model=ClientePerfilResponse)
async def upload_foto_perfil_cliente(
    file: UploadFile = File(...),
    usuario_logado: dict = Depends(get_usuario_logado)
):
    """
    Endpoint para upload da foto de perfil do cliente autenticado.
    """
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo inválido. Apenas JPEG, PNG e WEBP são permitidos."
        )

    file_bytes = await file.read()
    cliente_id = usuario_logado.get("sub") or usuario_logado.get("id")
    file_ext = file.filename.split(".")[-1]
    
    # Caminho do arquivo dentro do bucket
    file_path = f"clientes/{cliente_id}/foto_perfil.{file_ext}"

    try:
        # 1. Upload para o Storage ("x-upsert": "true" garante a substituição sem erro 409)
        supabase_client.storage.from_("avatars").upload(
            file_path,
            file_bytes,
            file_options={
                "content-type": file.content_type, 
                "x-upsert": "true"
            }
        )

        # 2. Obter URL Pública base
        public_url_res = supabase_client.storage.from_("avatars").get_public_url(file_path)
        
        # Trata variações de retorno das versões da biblioteca
        if isinstance(public_url_res, dict):
            raw_url = public_url_res.get("publicUrl") or public_url_res.get("public_url")
        elif hasattr(public_url_res, "public_url"):
            raw_url = public_url_res.public_url
        else:
            raw_url = str(public_url_res)

        # 3. Adiciona query param com timestamp para matar o cache de imagem do navegador
        timestamp = int(datetime.now().timestamp())
        foto_perfil_url = f"{raw_url}?v={timestamp}"

        # 4. Atualizar registro no banco
        resposta = (
            supabase_client.table("clientes")
            .update({"foto_perfil_url": foto_perfil_url})
            .eq("id", cliente_id)
            .execute()
        )

        if not resposta.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao atualizar a foto de perfil no banco de dados."
            )

        return resposta.data[0]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload da foto de perfil: {str(e)}"
        )