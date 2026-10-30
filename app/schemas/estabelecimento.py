from pydantic import (
    AliasChoices,
    BaseModel,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime
from uuid import UUID


class HorarioFuncionamento(BaseModel):
    segunda: Optional[Dict[str, str]] = None
    terca: Optional[Dict[str, str]] = None
    quarta: Optional[Dict[str, str]] = None
    quinta: Optional[Dict[str, str]] = None
    sexta: Optional[Dict[str, str]] = None
    sabado: Optional[Dict[str, str]] = None
    domingo: Optional[Dict[str, str]] = None


class EstabelecimentoBase(BaseModel):
    nome_estabelecimento: str = Field(
        ...,
        min_length=2,
        description="Nome Fantasia"
    )

    responsavel: str = Field(..., min_length=2)
    telefone: str
    email: EmailStr
    localizacao: str

    foto_estabelecimento_url: Optional[str] = None

    tipo_pessoa: Literal["juridica", "autonomo"] = "juridica"

    cpf: Optional[str] = None
    cnpj: Optional[str] = None

    razao_social: Optional[str] = None
    categoria: str = "Geral"
    instagram: Optional[str] = None

    servicos_oferecidos: List[str] = Field(default_factory=list)
    tecnicas_utilizadas: List[str] = Field(default_factory=list)
    produtos_aplicados: List[str] = Field(default_factory=list)
    profissionais_envolvidos: List[str] = Field(default_factory=list)

    horario_funcionamento: Dict[str, Any] = Field(
        default_factory=dict
    )


class EnderecoEstabelecimentoCreate(BaseModel):
    """Endereço cadastral opcional recebido no cadastro do estabelecimento."""

    endereco_texto: Optional[str] = None
    cep: Optional[str] = Field(
        None,
        pattern=r"^\d{8}$",
        description="CEP com oito dígitos, sem pontuação",
    )
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = Field(
        None,
        pattern=r"^[A-Z]{2}$",
        description="Sigla do estado com duas letras maiúsculas",
    )
    latitude: Optional[float] = Field(None, ge=-90, le=90, allow_inf_nan=False)
    longitude: Optional[float] = Field(None, ge=-180, le=180, allow_inf_nan=False)


    @model_validator(mode="after")
    def validar_coordenadas(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Informe latitude e longitude juntas.")
        if not any((self.endereco_texto, self.logradouro, self.cidade)):
            raise ValueError("Informe o endereço do estabelecimento.")
        return self


class EnderecoEstabelecimentoResponse(EnderecoEstabelecimentoCreate):
    id: UUID
    atualizado_em: Optional[datetime] = None


class EstabelecimentoCreate(EstabelecimentoBase):
    senha_hash: str = Field(
        ...,
        min_length=6,
        description="Senha para login do estabelecimento"
    )

    aceitou_termos: bool = Field(
        ...,
        description="Confirmação de aceite dos termos"
    )
    endereco: Optional[EnderecoEstabelecimentoCreate] = None

    @model_validator(mode="after")
    def validar_tipo_documento(self):

        if self.tipo_pessoa == "autonomo":

            if not self.cpf:
                raise ValueError(
                    "CPF é obrigatório para estabelecimento autônomo."
                )

            if self.cnpj:
                raise ValueError(
                    "Estabelecimento autônomo não deve informar CNPJ."
                )

        elif self.tipo_pessoa == "juridica":

            if not self.cnpj:
                raise ValueError(
                    "CNPJ é obrigatório para pessoa jurídica."
                )

            if self.cpf:
                raise ValueError(
                    "Pessoa jurídica não deve informar CPF."
                )

        return self


class EstabelecimentoUpdate(BaseModel):
    nome_estabelecimento: Optional[str] = Field(
        None,
        min_length=2,
        description="Nome Fantasia"
    )

    responsavel: Optional[str] = Field(None, min_length=2)
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    localizacao: Optional[str] = None

    foto_estabelecimento_url: Optional[str] = Field(
        None,
        description="URL pública da foto do estabelecimento"
    )

    tipo_pessoa: Optional[
        Literal["juridica", "autonomo"]
    ] = None

    cpf: Optional[str] = None
    cnpj: Optional[str] = None

    razao_social: Optional[str] = None
    categoria: Optional[str] = None
    instagram: Optional[str] = None

    servicos_oferecidos: Optional[List[str]] = None
    tecnicas_utilizadas: Optional[List[str]] = None
    produtos_aplicados: Optional[List[str]] = None
    profissionais_envolvidos: Optional[List[str]] = None

    horario_funcionamento: Optional[Dict[str, Any]] = None


class EstabelecimentoPerfilResponse(EstabelecimentoBase):
    endereco: Optional[EnderecoEstabelecimentoResponse] = None

    id: str = Field(
        ...,
        description="ID do estabelecimento (UUID)"
    )

    nome_estabelecimento: str = Field(
        ...,
        description="Nome completo do estabelecimento"
    )

    responsavel: str = Field(
        ...,
        description="Nome do responsável pelo estabelecimento"
    )

    telefone: str = Field(
        ...,
        description="Telefone do estabelecimento"
    )

    email: EmailStr = Field(
        ...,
        description="Email do estabelecimento para login e comunicação"
    )

    localizacao: str = Field(
        ...,
        description="Localização do estabelecimento"
    )

    tipo_pessoa: Literal["juridica", "autonomo"]
    cpf: Optional[str] = None
    cnpj: Optional[str] = None

    foto_estabelecimento_url: Optional[str] = Field(
        None,
        description="URL pública da foto do estabelecimento"
    )

    criado_em: str = Field(
        ...,
        description="Timestamp de criação do registro"
    )

    class Config:
        from_attributes = True


class EstabelecimentoResponse(EstabelecimentoBase):
    endereco: Optional[EnderecoEstabelecimentoResponse] = None
    distancia_km: Optional[float] = None

    id: UUID
    ativo: bool = True
    criado_em: datetime

    class Config:
        from_attributes = True
