from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal

# Define as formas de pagamento aceitas pelo sistema de acordo com a regra de negócio
FormaPagamento = Literal["dinheiro", "cartao_debito", "cartao_credito", "pix"]

class ClienteBase(BaseModel):
    nome_usuario: str = Field(..., min_length=3, description="Nome completo do usuário")
    nome_tratamento: Optional[str] = Field(None, description="Como o cliente prefere ser chamado")
    cpf: str = Field(..., min_length=11, max_length=14, description="Documento CPF do cliente")
    idade: int = Field(..., ge=0, description="Idade do usuário")
    genero: Optional[str] = Field(None, description="Gênero do usuário")
    forma_pagamento_preferida: FormaPagamento = Field(..., description="Forma de pagamento padrão")
    localizacao_inicial: str = Field(..., description="Localização inicial informada no cadastro")

# Schema para quando o desenvolvedor do Front-end for criar um novo cliente (POST)
class ClienteCreate(ClienteBase):
    senha: str = Field(..., min_length=6, description="Senha para login do cliente")
    pass

# Schema de resposta que a API devolve para o Front-end (inclui dados gerados pelo Supabase)
class ClienteResponse(ClienteBase):
    id: str = Field(..., description="ID gerado automaticamente pelo banco (UUID)")
    criado_em: str = Field(..., description="Timestamp de criação do registro")

    class Config:
        from_attributes = True