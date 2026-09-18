export type UserRole = "cliente" | "estabelecimento";
export type EstablishmentPersonType = "autonomo" | "juridica";

export interface UserSession {
  id: string;
  role: UserRole;
  nome: string;
  email_ou_cpf: string;
  access_token: string;
  token_type?: string;
  foto_perfil_url?: string | null;
  tipo_pessoa?: EstablishmentPersonType;
}
