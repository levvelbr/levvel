import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional
from dotenv import load_dotenv
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import Settings
import os

load_dotenv()  # Carrega variáveis de ambiente do arquivo .env

# Chave secreta para assinatura dos tokens JWT
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # Tempo de expiração do token em minutos

security = HTTPBearer()

def gerar_hash_senha(senha_texto_puro: str) -> str:
    """
    Gera um hash seguro para a senha fornecida usando bcrypt diretamente.
    """
    # Converte para bytes e trunca nos primeiros 72 bytes
    senha_bytes = senha_texto_puro.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(senha_bytes, salt)
    return hash_bytes.decode('utf-8')

def verificar_senha(senha_texto_puro: str, hash_senha: str) -> bool:
    """
    Verifica se a senha em texto puro corresponde ao hash fornecido.
    """
    senha_bytes = senha_texto_puro.encode('utf-8')[:72]
    return bcrypt.checkpw(senha_bytes, hash_senha.encode('utf-8'))

def criar_token_acesso(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um token JWT de acesso com os dados fornecidos e tempo de expiração.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_usuario_logado(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Decodifica o token JWT e retorna os dados do usuário logado.
    """
    token = credentials.credentials
    # exception_unauthorized = HTTPException(
    #     status_code=status.HTTP_401_UNAUTHORIZED,
    #     detail="Token inválido ou expirado.",
    #     headers={"WWW-Authenticate": "Bearer"},
    # )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )