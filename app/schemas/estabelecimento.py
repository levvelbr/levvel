from pydantic import BaseModel, EmailStr, Field
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
    senha: str = Field(..., min_length=6, description="Senha para login do estabelecimento")
    pass

class EstabelecimentoResponse(EstabelecimentoBase):
    id: UUID
    ativo: bool = True
    criado_em: datetime

    class Config:
        from_attributes = True