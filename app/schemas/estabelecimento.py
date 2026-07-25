from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class HorarioFuncionamento(BaseModel):
    # Permite flexibilidade no JSONB ou validação por dia da semana
    segunda: Optional[Dict[str, str]] = None
    terca: Optional[Dict[str, str]] = None
    quarta: Optional[Dict[str, str]] = None
    quinta: Optional[Dict[str, str]] = None
    sexta: Optional[Dict[str, str]] = None
    sabado: Optional[Dict[str, str]] = None
    domingo: Optional[Dict[str, str]] = None

class EstabelecimentoBase(BaseModel):
    nome_estabelecimento: str = Field(..., min_length=2, description="Nome Fantasia")
    responsavel: str = Field(..., min_length=2)
    telefone: str
    email: EmailStr
    localizacao: str
    foto_estabelecimento_url: Optional[str] = Field(None, description="URL pública da foto do estabelecimento")
    
    # Novos campos úteis
    cnpj: Optional[str] = None
    razao_social: Optional[str] = None
    categoria: str = "Geral"
    instagram: Optional[str] = None
    
    # Listas/Arrays no Postgres
    servicos_oferecidos: List[str] = []
    tecnicas_utilizadas: List[str] = []
    produtos_aplicados: List[str] = []
    profissionais_envolvidos: List[str] = []
    
    # JSONB
    horario_funcionamento: Dict[str, Any] = {}

class EstabelecimentoCreate(EstabelecimentoBase):
    senha_hash: str = Field(..., min_length=6, description="Senha para login do estabelecimento")
    pass

class EstabelecimentoUpdate(BaseModel):
    nome_estabelecimento: Optional[str] = Field(None, min_length=2, description="Nome Fantasia")
    responsavel: Optional[str] = Field(None, min_length=2)
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    localizacao: Optional[str] = None
    foto_estabelecimento_url: Optional[str] = Field(None, description="URL pública da foto do estabelecimento")
    
    # Novos campos úteis
    cnpj: Optional[str] = None
    razao_social: Optional[str] = None
    categoria: Optional[str] = None
    instagram: Optional[str] = None
    
    # Listas/Arrays no Postgres
    servicos_oferecidos: Optional[List[str]] = None
    tecnicas_utilizadas: Optional[List[str]] = None
    produtos_aplicados: Optional[List[str]] = None
    profissionais_envolvidos: Optional[List[str]] = None
    
    # JSONB
    horario_funcionamento: Optional[Dict[str, Any]] = None
    
    @field_validator('*', mode='before')
    def empty_string_to_none(cls, v):
        """
        Converte strings vazias para None antes da validação.
        Isso é útil para campos opcionais que podem ser enviados como "".
        """
        if isinstance(v, str) and v.strip() == "":
            return None
        return v

class EstabelecimentoResponse(EstabelecimentoBase):
    id: UUID
    ativo: bool = True
    criado_em: datetime

    class Config:
        from_attributes = True