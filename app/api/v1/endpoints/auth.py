from fastapi import APIRouter, HTTPException, status
from app.core.security import verificar_senha
from app.schemas.role import UserRole, LoginSchema, UserSessionResponse
from app.core.config import supabase_client
from postgrest.exceptions import APIError

router = APIRouter()

@router.post("/login", response_model=UserSessionResponse)
async def login(payload: LoginSchema):
    """
    Identifica dinamicamente se o acesso é de um Cliente ou Estabelecimento,
    retornando os dados de perfil e papel (role) do usuário.
    """
    identificador = payload.identificador.strip()

    try:
        # 1. Tenta encontrar em Estabelecimentos (por e-mail ou CNPJ)
        est_query = supabase_client.table("estabelecimentos")\
            .select("*")\
            .or_(f"email.eq.{identificador},cnpj.eq.{identificador}")\
            .execute()

        if est_query.data:
            est = est_query.data[0]
            
            if not verificar_senha(payload.senha, est.get("senha_hash")):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Senha incorreta para o estabelecimento."
                )
            
            return UserSessionResponse(
                id=est["id"],
                role=UserRole.ESTABELECIMENTO,
                nome=est["nome_estabelecimento"],
                email_ou_cpf=est["email"],
                access_token=f"fake-jwt-token-{est['id']}" # Token para integração no front
            )

        # 2. Se não achou, tenta encontrar em Clientes (por CPF ou Nome)
        cli_query = supabase_client.table("clientes")\
            .select("*")\
            .or_(f"cpf.eq.{identificador},nome_usuario.eq.{identificador}")\
            .execute()

        if cli_query.data:
            cli = cli_query.data[0]
            return UserSessionResponse(
                id=cli["id"],
                role=UserRole.CLIENTE,
                nome=cli.get("nome_tratamento") or cli["nome_usuario"],
                email_ou_cpf=cli["cpf"],
                access_token=f"fake-jwt-token-{cli['id']}"
            )

        # 3. Não encontrou em nenhuma tabela
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada. Verifique os dados digitados."
        )

    except APIError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Erro na verificação de conta: {error.message}"
        )