from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

StatusAgendamento = Literal["pendente", "confirmado", "em_andamento", "concluido", "cancelado"]

class AgendamentoBase(BaseModel):
    estabelecimento_id: str = Field(..., description="ID do estabelecimento (UUID)")
    cliente_id: str = Field(..., description="ID do cliente (UUID)")
    profissional_envolvido: str = Field(..., description="Nome do profissional que fará o atendimento")
    tratamento: str = Field(..., description="Nome do tratamento/serviço solicitado")
    tecnica: Optional[str] = Field(None, description="Técnica aplicada")
    produto: Optional[str] = Field(None, description="Produto aplicado")
    data_hora_inicio: datetime = Field(..., description="Data e hora marcadas para o início")
    duracao_estimada_minutos: int = Field(default=30, description="Duração estimada em minutos")

class AgendamentoCreate(AgendamentoBase):
    pass

class AgendamentoStatusUpdate(BaseModel):
    status: StatusAgendamento

# Estrutura para a avaliação final mútua exigida no encerramento
class AvaliacaoEncerramento(BaseModel):
    # Avaliação do cliente sobre o estabelecimento
    avaliacao_estabelecimento_nota: Optional[int] = Field(None, ge=1, le=5, description="Nota de 1 a 5")
    comentario_cliente: Optional[str] = None
    
    # Avaliação do estabelecimento sobre o cliente (educação, pontualidade)
    avaliacao_cliente_nota: Optional[int] = Field(None, ge=1, le=5, description="Nota de 1 a 5")
    comentario_estabelecimento: Optional[str] = None

class AgendamentoResponse(BaseModel):
    id: str
    estabelecimento_id: str
    cliente_id: str
    profissional_envolvido: str
    tratamento: str
    tecnica: Optional[str]
    produto: Optional[str]
    data_hora_inicio: datetime
    duracao_estimada_minutos: int
    status: StatusAgendamento
    custo_final: float = 0.0
    criado_em: datetime

    class Config:
        from_attributes = True