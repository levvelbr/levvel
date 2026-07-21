# Levvel API 🚀

Este é o backend assíncrono para o sistema de anúncio e agendamento de serviços de saúde, beleza e bem-estar do projeto **Levvel**. A API foi construída utilizando **FastAPI** e integrada diretamente ao **Supabase** como provedor de banco de dados (PostgreSQL).

A aplicação foi totalmente configurada com políticas de **CORS** para permitir o consumo nativo e seguro por aplicações construídas em **Vite/Vue.js** rodando localmente.

---

## 🛠️ Tecnologias Utilizadas

* **Python 3.10+**
* **FastAPI** (Framework web de alta performance)
* **Uvicorn** (Servidor ASGI para execução da aplicação)
* **Pydantic v2** (Validação de dados e tipagem de schemas)
* **Supabase Python SDK** (Abstração e comunicação direta com o banco de dados)

---

## 📂 Estrutura do Projeto

```text
levvel-backend/
├── app/
│   ├── main.py                 # Inicialização da API, middlewares de CORS e roteadores
│   ├── core/
│   │   └── config.py           # Gerenciamento de variáveis de ambiente e cliente Supabase
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/      # Controladores de rotas divididos por regras de negócio
│   │           ├── clientes.py
│   │           ├── estabelecimentos.py
│   │           └── agendamentos.py
│   └── schemas/                # Modelos Pydantic (Contratos de Entrada/Saída de JSON)
│       ├── cliente.py
│       ├── estabelecimento.py
│       ├── agendamento.py
│       └── role.py
├── .env                        # Arquivo local com credenciais do Supabase (ignorado no Git)
├── requirements.txt            # Dependências Python do projeto
└── README.md

```

## 🚀 Como Executar o Projeto Localmente

### Clone o repositório e acesse a pasta do projeto:

```text
cd levvel-backend
```

### Crie e ative um ambiente virtual (venv):

```
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/macOS
python3 -m venv .venv
source .venv/bin/activate
```

### Instale as dependências obrigatórias:

```
pip install -r requirements.txt
```

### Configure o arquivo .env na raiz do projeto:
Crie um arquivo chamado .env e adicione as chaves fornecidas pelo desenvolvedor do banco:

```
SUPABASE_URL="[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)"

SUPABASE_KEY="sua-chave-anon-publica"
```

### Inicie o servidor de desenvolvimento:
```
uvicorn app.main:app --reload
```

## 📖 Documentação para o Front-end (Vite / Vue)
O FastAPI gera a documentação dos endpoints automaticamente. Com o servidor rodando, acesse a interface interativa para visualizar todos os payloads (JSON) de entrada e saída esperados:

Swagger UI (Recomendado): http://localhost:8000/docs

## 🔒 Configurações de CORS Ativas
A API está explicitamente configurada para aceitar requisições originadas de:

http://localhost:5173 (Porta padrão do Vite)

http://127.0.0.1:5173