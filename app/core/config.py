from pydantic_settings import BaseSettings, SettingsConfigDict
from supabase import create_client, Client

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Mapeia automaticamente o arquivo .env
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()

# Instância global do cliente Supabase para o Backend
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)