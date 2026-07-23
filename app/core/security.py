import bcrypt

def gerar_hash_senha(senha_texto_puro: str) -> str:
    """
    Gera um hash seguro para a senha fornecida usando bcrypt diretamente.
    """
    # Converte para bytes e trunca nos primeiros 72 bytes
    senha_bytes = senha_texto_puro.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(senha_bytes, salt)
    return hash_bytes.decode('utf-8')

def verificar_senha(senha_texto_puro: str, hash_senha: str) -> bool:
    """
    Verifica se a senha em texto puro corresponde ao hash fornecido.
    """
    senha_bytes = senha_texto_puro.encode('utf-8')[:72]
    return bcrypt.checkpw(senha_bytes, hash_senha.encode('utf-8'))