from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

class EstabelecimentoBase(BaseModel):
    nome_estabelecimento: str = Field(..., min_length=3, description="Nome comercial do estabelecimento ou autônomo")
    responsavel: str = Field(..., description="Nome do responsável legal")
    telefone: str = Field(..., description="Telefone de contato")
    email: EmailStr = Field(..., description="E-mail de contato")
    localizacao: str = Field(..., description="Endereço ou coordenadas para locomoção")
    
    # Listas simples de strings para categorizar o que o estabelecimento atende inicialmente
    servicos_oferecidos: List[str] = Field(default=[], description="Ex: Corte, Barbearia, Manicure")
    tecnicas_utilizadas: List[str] = Field(default=[], description="Ex: Luzes, Degradê, Massagem Terapêutica")
    produtos_aplicados: List[str] = Field(default=[], description="Ex: Marcas ou tipos de produtos químicos/cosméticos")
    profissionais_envolvidos: List[str] = Field(default=[], description="Nome dos funcionários/colaboradores")
    
    # Configuração de dias e horários de funcionamento
    horario_funcionamento: dict = Field(..., description="JSON mapeando dias e horas (ex: {'seg-sex': '09:00-18:00'})")

class EstabelecimentoCreate(EstabelecimentoBase):
    pass

class EstabelecimentoResponse(EstabelecimentoBase):
    id: str = Field(..., description="ID gerado automaticamente pelo Supabase (UUID)")
    criado_em: str = Field(..., description="Timestamp de criação do registro")

    class Config:
        from_attributes = True