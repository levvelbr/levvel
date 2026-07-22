from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def gerar_hash_senha(senha_texto_puro: str) -> str:
    """
    Gera um hash seguro para a senha fornecida.
    """
    return pwd_context.hash(senha_texto_puro)

def verificar_senha(senha_texto_puro: str, hash_senha: str) -> bool:
    """
    Verifica se a senha em texto puro corresponde ao hash fornecido.
    """
    return pwd_context.verify(senha_texto_puro, hash_senha)