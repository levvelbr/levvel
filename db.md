# 📑 DOCUMENTO DE ESPECIFICAÇÃO DE BANCO DE DADOS (POSTGRESQL / SUPABASE)
### Projeto: LevvelObjetivo: 
### Sistema de anúncio e agendamento para a prestação de serviços de beleza, bem-estar e saúde.  
### Integração: Backend em FastAPI (Python) & Frontend em Vite (Vue/React).
---

## 1. TIPOS CUSTOMIZADOS (ENUMS):
Para garantir a integridade dos dados informados pela API e pelo Frontend, devem ser criados os seguintes tipos enumerados diretamente no banco de dados:

### Formas de pagamento aceitas pelo Módulo Cliente
```
CREATE TYPE forma_pagamento AS ENUM ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix');
```

### Controle do ciclo de estados de um agendamento
```
CREATE TYPE status_agendamento AS ENUM ('pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado');
```
---
## 2. DICIONÁRIO DE DADOS E TABELAS (DDL):
### Todas as chaves primárias devem utilizar o formato UUID com geração automática pelo PostgreSQL (gen_random_uuid()).
### 2.1. Tabela clientes:
Armazena as informações de perfil e preferências dos usuários do Módulo Cliente.  
```
 CREATE TABLE clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_usuario TEXT NOT NULL,
    nome_tratamento TEXT,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    idade INT NOT NULL,
    genero TEXT,
    forma_pagamento_preferida forma_pagamento NOT NULL,
    localizacao_inicial TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
---
### 2.2. Tabela estabelecimentos:
Armazena os dados dos estabelecimentos comerciais e profissionais autônomos.
```
CREATE TABLE estabelecimentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_estabelecimento TEXT NOT NULL,
    responsavel TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    localizacao TEXT NOT NULL,
    servicos_oferecidos TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    tecnicas_utilizadas TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    produtos_aplicados TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    profissionais_envolvidos TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    horario_funcionamento JSONB NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
### 2.3. Tabela agendamentos:
Responsável pela gestão de horários e pelo fluxo do tratamento de forma síncrona.  
```
CREATE TABLE agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    estabelecimento_id UUID REFERENCES estabelecimentos(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
    profissional_envolvido TEXT NOT NULL,
    tratamento TEXT NOT NULL,
    tecnica TEXT,
    produto TEXT,
    data_hora_inicio TIMESTAMPTZ NOT NULL,
    duracao_estimada_minutos INT DEFAULT 30 NOT NULL,
    status status_agendamento DEFAULT 'pendente'::status_agendamento NOT NULL,
    custo_final NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    avaliacao_estabelecimento_nota INT CHECK (avaliacao_estabelecimento_nota BETWEEN 1 AND 5),
    comentario_cliente TEXT,
    avaliacao_cliente_nota INT CHECK (avaliacao_cliente_nota BETWEEN 1 AND 5),
    comentario_estabelecimento TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
## 3. OTIMIZAÇÃO E PERFORMANCE (ÍNDICES)

Para garantir que as buscas por localidade , filtragem de serviços e renderização de históricos em tempo real  não causem lentidão no backend assíncrono, devem ser aplicados os seguintes índices no PostgreSQL:  

### Otimização para indexação de arrays de serviços (Busca rápida por categorias na cercania):
```
CREATE INDEX idx_estabelecimentos_servicos ON estabelecimentos USING gin (servicos_oferecidos);
```

### Otimização para buscas frequentes de histórico e agendas
```
CREATE INDEX idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_estabelecimento ON agendamentos(estabelecimento_id);
```
## 4. DIRETRIZES DE SEGURANÇA E ACESSO (SUPABASE RLS)
Como a API FastAPI atuará como uma camada intermediária de validação de negócios, o acesso pode ser configurado de duas formas no painel do Supabase:

## Fase de Desenvolvimento (Sandbox): 
Desativar o Row Level Security (RLS) diretamente nas tabelas clientes, estabelecimentos e agendamentos para permitir inserções imediatas de teste a partir do cliente de desenvolvimento do backend.

## Fase de Homologação/Produção: 
Habilitar as políticas do RLS permitindo requisições públicas autenticadas através da chave anon fornecida no ambiente do projeto.