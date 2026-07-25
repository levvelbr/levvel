export type UserRole = "cliente" | "estabelecimento";

export interface UserSession {
  id: string;
  role: UserRole;
  nome: string;
  email_ou_cpf: string;
  access_token: string;
  token_type?: string;
}
