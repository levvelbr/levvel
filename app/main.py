from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import clientes, estabelecimentos, agendamentos  # Adicionado estabelecimentos

app = FastAPI(
    title="Levvel API",
    description="Backend assíncrono para o sistema de agendamentos Levvel",
    version="1.0.0",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas da API v1
app.include_router(clientes.router, prefix="/v1/clientes", tags=["Clientes"])
app.include_router(estabelecimentos.router, prefix="/v1/estabelecimentos", tags=["Estabelecimentos"])
app.include_router(agendamentos.router, prefix="/v1/agendamentos", tags=["Agendamentos"])

@app.get("/", tags=["Root"])
async def root():
    return {
        "status": "online",
        "message": "API Levvel Operacional e conexão bem sucessida.",
    }