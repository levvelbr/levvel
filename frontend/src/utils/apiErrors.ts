interface ValidationErrorItem {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
  ctx?: Record<string, unknown>;
}

const FIELD_LABELS: Record<string, string> = {
  identificador: "E-mail ou CPF/CNPJ",
  senha: "Senha",
  senha_hash: "Senha",
  confirmar_senha: "Confirmação de senha",
  email: "E-mail",
  cpf: "CPF",
  cnpj: "CNPJ",
  role: "Tipo de conta",
  nome_usuario: "Nome de usuário",
  nome_tratamento: "Nome de tratamento",
  data_nascimento: "Data de nascimento",
  genero: "Gênero",
  forma_pagamento_preferida: "Forma de pagamento preferida",
  localizacao_inicial: "Localização inicial",
  nome_estabelecimento: "Nome do estabelecimento",
  responsavel: "Responsável",
  telefone: "Telefone",
  localizacao: "Localização",
  razao_social: "Razão social",
};

const getFieldLabel = (loc?: (string | number)[]) => {
  const fieldName = loc?.[loc.length - 1];
  if (typeof fieldName !== "string") {
    return "Campo";
  }
  return FIELD_LABELS[fieldName] ?? fieldName;
};

const DUPLICATE_KEY_LABELS: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "e-mail",
  telefone: "telefone",
};

/** Maps a raw Postgres "duplicate key value violates unique constraint" message to friendly text. */
const describeDuplicateKeyError = (detail: string) => {
  const match = detail.match(
    /duplicate key value violates unique constraint "?(\w+)"?/i,
  );
  if (!match) {
    return null;
  }

  const constraintName = match[1].toLowerCase();
  const fieldKey = Object.keys(DUPLICATE_KEY_LABELS).find((key) =>
    constraintName.includes(key),
  );
  const fieldLabel = fieldKey ? DUPLICATE_KEY_LABELS[fieldKey] : null;

  return fieldLabel
    ? `Já existe um cadastro com este ${fieldLabel}.`
    : "Já existe um cadastro com esses dados.";
};

const describeValidationError = (item: ValidationErrorItem) => {
  const label = getFieldLabel(item.loc);
  const minLength = item.ctx?.min_length;
  const maxLength = item.ctx?.max_length;

  if (item.type === "string_too_short" && typeof minLength === "number") {
    return `${label} deve ter pelo menos ${minLength} caracteres.`;
  }

  if (item.type === "string_too_long" && typeof maxLength === "number") {
    return `${label} deve ter no máximo ${maxLength} caracteres.`;
  }

  if (item.type === "missing") {
    return `${label} é obrigatório.`;
  }

  if (item.type === "value_error" || item.type?.startsWith("enum")) {
    return `${label} inválido.`;
  }

  return item.msg ? `${label}: ${item.msg}` : `${label} inválido.`;
};

/** Translates FastAPI validation/error responses into a user-friendly message. */
export const getApiErrorMessage = (
  error: unknown,
  fallback = "Ocorreu um erro inesperado. Tente novamente.",
) => {
  const responseData =
    typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined;

  if (
    responseData &&
    typeof responseData === "object" &&
    "detail" in responseData
  ) {
    const detail = (responseData as { detail: unknown }).detail;

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => describeValidationError(item as ValidationErrorItem))
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    if (typeof detail === "string") {
      return describeDuplicateKeyError(detail) ?? detail;
    }
  }

  if (typeof responseData === "string") {
    return describeDuplicateKeyError(responseData) ?? responseData;
  }

  return error instanceof Error ? error.message : fallback;
};
