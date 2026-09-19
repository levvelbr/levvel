# LevveL Frontend

Frontend da plataforma **LevveL**, desenvolvido para conectar clientes a estabelecimentos e profissionais de serviços, permitindo descoberta de estabelecimentos, autenticação, gerenciamento de perfil e realização de agendamentos.

O projeto foi desenvolvido utilizando **React**, **TypeScript** e **Vite**, consumindo uma API REST responsável pelas regras de negócio, autenticação e persistência dos dados.

---

## 🚀 Tecnologias utilizadas

O projeto utiliza as seguintes tecnologias:

* **React 19**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **React Router DOM**
* **Axios**
* **React Hook Form**
* **Zod**
* **Lucide React**
* **Vercel Analytics**
* **OpenStreetMap / Nominatim**
* **ESLint**

---

## 📋 Funcionalidades

Entre as funcionalidades atualmente implementadas no frontend estão:

* Cadastro de clientes
* Cadastro de estabelecimentos
* Suporte a estabelecimento como pessoa jurídica ou profissional autônomo
* Login utilizando:

  * e-mail;
  * CPF;
  * CNPJ.
* Diferenciação entre perfis:

  * `cliente`;
  * `estabelecimento`.
* Persistência da sessão do usuário
* Autenticação utilizando Bearer Token
* Rotas protegidas
* Controle de acesso por perfil
* Listagem de estabelecimentos
* Filtro de estabelecimentos por categoria
* Pesquisa por:

  * nome;
  * categoria;
  * localização;
  * serviço.
* Visualização pública de estabelecimentos
* Gerenciamento de perfil
* Upload de foto de perfil
* Criação de agendamentos
* Gerenciamento de status dos agendamentos
* Encerramento de atendimentos
* Consulta da agenda de estabelecimentos
* Geolocalização pelo navegador
* Conversão de coordenadas em localização utilizando OpenStreetMap/Nominatim
* Página de termos de uso e política de privacidade
* Integração com Vercel Analytics

---

## 🏗️ Estrutura do projeto

```text
frontend/
│
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   └── TERMOS DE USO E POLÍTICA DE PRIVACIDADE.pdf
│   │
│   ├── components/
│   │   ├── ApiTest.tsx
│   │   ├── AuthModal.tsx
│   │   ├── BookingForm.tsx
│   │   ├── BookingModal.tsx
│   │   ├── Button.tsx
│   │   ├── CategoryIcon.tsx
│   │   ├── ClientForm.tsx
│   │   ├── EstablishmentCard.tsx
│   │   ├── EstablishmentList.tsx
│   │   ├── EstablishmentModal.tsx
│   │   ├── EstablishmentNavigation.tsx
│   │   ├── Footer.tsx
│   │   ├── Form.tsx
│   │   ├── Header.tsx
│   │   ├── Input.tsx
│   │   ├── LoginForm.tsx
│   │   ├── SearchBar.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx
│   │
│   ├── hooks/
│   │   ├── useBodyScrollLock.ts
│   │   └── useEscapeKey.ts
│   │
│   ├── layouts/
│   │   ├── AppLayout.tsx
│   │   └── DashboardLayout.tsx
│   │
│   ├── pages/
│   │   ├── AppHomePage.tsx
│   │   ├── ClientBookingPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── EstablishmentAgendaPage.tsx
│   │   ├── EstablishmentPublicPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── ServicesPage.tsx
│   │   ├── TermsPrivacyPage.tsx
│   │   └── UnauthorizedPage.tsx
│   │
│   ├── routes/
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleRoute.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   └── authStorage.ts
│   │
│   ├── styles/
│   │   └── index.css
│   │
│   ├── types/
│   │   └── auth.ts
│   │
│   ├── utils/
│   │   ├── apiErrors.ts
│   │   ├── categoryIcons.tsx
│   │   ├── documentMasks.ts
│   │   └── geolocation.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
```

---

## 🔐 Autenticação

A aplicação trabalha atualmente com dois tipos de usuário:

```ts
type UserRole = "cliente" | "estabelecimento";
```

Para estabelecimentos também existe a diferenciação entre:

```ts
type EstablishmentPersonType = "autonomo" | "juridica";
```

A autenticação é realizada através do endpoint:

```http
POST /v1/auth/login
```

O login recebe:

```json
{
  "identificador": "email, CPF ou CNPJ",
  "senha": "senha-do-usuario",
  "role": "cliente"
}
```

ou:

```json
{
  "identificador": "email, CPF ou CNPJ",
  "senha": "senha-do-usuario",
  "role": "estabelecimento"
}
```

Quando um CNPJ é identificado no formulário, o frontend seleciona automaticamente o perfil de estabelecimento.

---

## 🔑 Sessão do usuário

Após o login, a sessão é armazenada no `localStorage` utilizando a chave:

```text
authSession
```

A sessão possui uma estrutura semelhante a:

```ts
interface UserSession {
  id: string;
  role: "cliente" | "estabelecimento";
  nome: string;
  email_ou_cpf: string;
  access_token: string;
  token_type?: string;
  foto_perfil_url?: string | null;
  tipo_pessoa?: "autonomo" | "juridica";
}
```

O Axios adiciona automaticamente o token às requisições:

```http
Authorization: Bearer <access_token>
```

Caso a API retorne `401 Unauthorized`, a sessão armazenada localmente é removida.

---

## 🌐 Comunicação com a API

A comunicação com o backend é centralizada em:

```text
src/services/api.ts
```

A URL da API é obtida através da variável:

```env
VITE_API_URL
```

Exemplo para desenvolvimento local:

```env
VITE_API_URL=http://localhost:8000
```

Em produção, utilize a URL correspondente ao backend publicado.

---

## 📡 Principais endpoints utilizados

O frontend atualmente possui integração com endpoints como:

### Autenticação

```http
POST /v1/auth/login
```

### Clientes

```http
POST  /v1/clientes
GET   /v1/clientes/me
GET   /v1/clientes/{id}
PATCH /v1/clientes/me/update
POST  /v1/clientes/me/foto-perfil
```

### Estabelecimentos

```http
POST /v1/estabelecimentos/
GET  /v1/estabelecimentos/me
GET  /v1/estabelecimentos/listar_estabelecimentos
POST /v1/estabelecimentos/me/foto-perfil
```

### Agendamentos

```http
POST  /v1/agendamentos/
GET   /v1/agendamentos/estabelecimento/{id}
PATCH /v1/agendamentos/{id}/status
POST  /v1/agendamentos/{id}/encerrar
```

> Os endpoints dependem do backend da LevveL estar disponível e devidamente configurado.

---

## 🗺️ Geolocalização

A plataforma utiliza a API de geolocalização do navegador:

```js
navigator.geolocation
```

Após obter latitude e longitude, o frontend realiza uma tentativa de **reverse geocoding** utilizando o serviço público Nominatim, baseado no OpenStreetMap.

Isso permite transformar coordenadas em informações como:

```text
Bairro, Cidade, Estado
```

Caso o reverse geocoding não esteja disponível, são utilizadas as coordenadas diretamente.

---

## 🛣️ Rotas

Entre as rotas atualmente registradas pela aplicação estão:

| Rota                    | Descrição                         |
| ----------------------- | --------------------------------- |
| `/`                     | Página principal                  |
| `/servicos`             | Serviços                          |
| `/contato`              | Contato                           |
| `/estabelecimentos/:id` | Página pública do estabelecimento |
| `/termos-e-privacidade` | Termos e política de privacidade  |
| `/perfil`               | Perfil do usuário autenticado     |
| `/nao-autorizado`       | Página de acesso não autorizado   |

A rota `/perfil` é protegida e exige autenticação.

Rotas inexistentes são redirecionadas para:

```text
/
```

---

## 🔒 Proteção de rotas

A aplicação possui dois mecanismos para controle de acesso.

### ProtectedRoute

Verifica se existe uma sessão autenticada.

Caso o usuário não esteja autenticado, ele é redirecionado para a página principal e o frontend pode abrir o modal de login.

### RoleRoute

Permite restringir determinadas páginas por perfil.

Exemplo conceitual:

```tsx
<RoleRoute allowedRoles={["estabelecimento"]} />
```

Assim, apenas estabelecimentos poderiam acessar determinada rota.

---

## ⚙️ Pré-requisitos

Antes de executar o projeto, tenha instalado:

* Node.js
* npm
* Git

Recomenda-se utilizar uma versão recente LTS do Node.js.

---

## 📥 Instalação

Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta do frontend:

```bash
cd levvel-frontend/frontend
```

Instale as dependências:

```bash
npm install
```

---

## 🔧 Configuração das variáveis de ambiente

Crie um arquivo `.env` dentro da pasta `frontend`.

Exemplo:

```env
VITE_API_URL=http://localhost:8000
```

Para utilizar o backend hospedado, substitua pela URL correspondente.

Exemplo:

```env
VITE_API_URL=https://seu-backend.com
```

> Arquivos `.env` não devem ser enviados ao GitHub caso possuam informações sensíveis.

---

## ▶️ Executando o projeto

Para iniciar o ambiente de desenvolvimento:

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local da aplicação.

Normalmente:

```text
http://localhost:5173
```

---

## 🏗️ Build de produção

Para gerar o build:

```bash
npm run build
```

Os arquivos serão gerados em:

```text
dist/
```

Para visualizar localmente o build:

```bash
npm run preview
```

---

## 🔍 ESLint

Para verificar o código:

```bash
npm run lint
```

---

## 📜 Scripts disponíveis

| Script            | Função                                     |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Inicia o servidor de desenvolvimento       |
| `npm run build`   | Compila TypeScript e gera o build com Vite |
| `npm run lint`    | Executa o ESLint                           |
| `npm run preview` | Visualiza localmente o build de produção   |

---

## ☁️ Deploy

O projeto possui configuração para deploy na **Vercel**.

O arquivo:

```text
vercel.json
```

possui regras de rewrite para permitir o funcionamento correto das rotas de uma SPA React.

Também existe atualmente um rewrite de API para:

```text
https://levvel.onrender.com
```

O frontend também possui integração com:

```text
@vercel/analytics
```

para coleta de métricas da aplicação.

---

## 🔄 Arquitetura simplificada

```text
Usuário
   │
   ▼
React / TypeScript
   │
   ├── Components
   ├── Pages
   ├── AuthContext
   ├── React Router
   │
   ▼
Axios
   │
   │ Authorization: Bearer Token
   ▼
LevveL API
   │
   ▼
Banco de Dados / Serviços externos
```

---

## 🧩 Organização da aplicação

### `components`

Componentes reutilizáveis da interface, formulários, cards, modais e elementos de navegação.

### `pages`

Páginas completas da aplicação.

### `layouts`

Estruturas utilizadas para organizar páginas e elementos comuns da interface.

### `contexts`

Estados globais da aplicação.

Atualmente contém principalmente o contexto de autenticação.

### `services`

Responsável pela integração com serviços externos e gerenciamento da sessão.

### `routes`

Controle de rotas privadas e autorização baseada no perfil do usuário.

### `utils`

Funções auxiliares, como:

* máscaras de CPF/CNPJ;
* tratamento de erros da API;
* geolocalização;
* ícones de categorias.

### `types`

Interfaces e tipos TypeScript compartilhados entre diferentes partes da aplicação.

---

## 🚧 Estado atual

O projeto encontra-se em desenvolvimento.

Alguns componentes e páginas já existem no código, mas ainda não estão registrados diretamente no roteamento principal da aplicação, indicando funcionalidades em desenvolvimento ou preparadas para integração futura.

Entre elas estão páginas relacionadas especificamente a:

* agenda de estabelecimento;
* agendamento de cliente;
* home interna da aplicação.

---

## 🔗 Backend

Este repositório representa o **frontend da LevveL**.

Para funcionamento completo da plataforma é necessário executar ou possuir acesso à API backend da LevveL.

A comunicação é definida através de:

```env
VITE_API_URL
```

---

## 📄 Termos e privacidade

A aplicação possui uma página dedicada a:

* Termos de Uso;
* Política de Privacidade.

O documento correspondente também está presente nos assets do projeto.

---

## 📌 Projeto LevveL

A LevveL tem como objetivo simplificar a conexão entre clientes e estabelecimentos/profissionais, centralizando descoberta de serviços, perfis e agendamentos em uma única plataforma.

---

## 📄 Licença

Defina nesta seção a licença aplicável ao projeto.

Caso o projeto seja proprietário e não permita redistribuição ou utilização por terceiros, pode ser utilizado, por exemplo:

```text
Copyright © LevveL. Todos os direitos reservados.

Este código é proprietário e não pode ser copiado, modificado,
distribuído ou utilizado sem autorização.
```
