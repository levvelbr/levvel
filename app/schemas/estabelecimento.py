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

    foto_estabelecimento_url: Optional[str] = Field(
        None,
        description="URL pública da foto do estabelecimento"
    )

    # Tipo do estabelecimento
    tipo_pessoa: Literal["juridica", "autonomo"] = "juridica"

    # Documentos
    cpf: Optional[str] = None
    cnpj: Optional[str] = None

    razao_social: Optional[str] = None
    categoria: str = "Geral"
    instagram: Optional[str] = None

    servicos_oferecidos: List[str] = []
    tecnicas_utilizadas: List[str] = []
    produtos_aplicados: List[str] = []
    profissionais_envolvidos: List[str] = []

    horario_funcionamento: Dict[str, Any] = {}

    @field_validator("cpf", "cnpj", mode="before")
    @classmethod
    def limpar_documentos(cls, valor):
        if valor is None:
            return None

        if isinstance(valor, str):
            valor = "".join(filter(str.isalnum, valor))

            if not valor:
                return None

        return valor

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


class EstabelecimentoCreate(EstabelecimentoBase):
    senha_hash: str = Field(
        ...,
        min_length=6,
        description="Senha para login do estabelecimento"
    )

    aceitou_termos: bool = Field(
        ...,
        description=(
            "Confirmação de que o usuário aceitou os termos de uso "
            "e política de privacidade"
        )
    )


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

    @field_validator("*", mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if isinstance(v, str) and v.strip() == "":
            return None

        return v


class EstabelecimentoPerfilResponse(BaseModel):
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
    id: UUID
    ativo: bool = True
    criado_em: datetime

    class Config:
        from_attributes = True