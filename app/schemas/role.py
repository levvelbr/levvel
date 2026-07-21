from enum import Enum

class UserRole(str, Enum):
    CLIENTE = "cliente"
    ESTABELECIMENTO = "estabelecimento"