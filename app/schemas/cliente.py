from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, Literal
from datetime import date

# Define as formas de pagamento aceitas pelo sistema de acordo com a regra de negócio
FormaPagamento = Literal["dinheiro", "cartao_debito", "cartao_credito", "pix"]

class ClienteBase(BaseModel):
    nome_usuario: str = Field(..., min_length=3, description="Nome completo do usuário")
    nome_tratamento: Optional[str] = Field(None, description="Como o cliente prefere ser chamado")
    cpf: str = Field(..., min_length=11, max_length=14, description="Documento CPF do cliente")
    data_nascimento: date = Field(..., description="Data de nascimento do usuário (formato YYYY-MM-DD)")
    genero: Optional[str] = Field(None, description="Gênero do usuário")
    forma_pagamento_preferida: FormaPagamento = Field(..., description="Forma de pagamento padrão")
    localizacao_inicial: str = Field(..., description="Localização inicial informada no cadastro")

    @field_validator("data_nascimento")
    @classmethod
    def validar_idade_minima(cls, data_nasc: date) -> date:
        hoje = date.today()
        # Calcula a idade exata considerando dia/mês/ano
        idade = hoje.year - data_nasc.year - ((hoje.month, hoje.day) < (data_nasc.month, data_nasc.day))

        # Regra de negócio / segurança: Idade mínima (ex: 18 anos)
        if idade < 18:
            raise ValueError("O usuário deve ter pelo menos 18 anos para se cadastrar.")
        
        # Evita datas absurdas ou no futuro
        if idade > 120 or data_nasc > hoje:
            raise ValueError("Data de nascimento inválida.")

        return data_nasc

# Schema para quando o desenvolvedor do Front-end for criar um novo cliente (POST)
class ClienteCreate(ClienteBase):
    senha: str = Field(..., min_length=6, description="Senha para login do cliente")

# Schema de resposta que a API devolve para o Front-end (inclui dados gerados pelo Supabase)
class ClienteResponse(ClienteBase):
    id: str = Field(..., description="ID gerado automaticamente pelo banco (UUID)")
    criado_em: str = Field(..., description="Timestamp de criação do registro")

    class Config:
        from_attributes = True