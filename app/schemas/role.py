from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class UserRole(str, Enum):
    CLIENTE = "cliente"
    ESTABELECIMENTO = "estabelecimento"
    
class LoginSchema(BaseModel):
    identificador: str = Field(..., description="Email ou CPF do usuário")
    senha: str = Field(..., description="Senha do usuário")
    
class UserSessionResponse(BaseModel):
    id: str
    role: UserRole
    nome: str
    email_ou_cpf: str
    access_token: str
    token_type: str = "bearer"