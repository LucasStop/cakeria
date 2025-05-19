# Cakeria

Cakeria é uma plataforma online para gerenciamento de uma confeitaria. O projeto está estruturado como um monorepo, contendo **backend** (Node.js/Express, com Sequelize) e **frontend** (arquivos estáticos ou framework JS). Também há um arquivo `script.sql` para criação ou configuração inicial do banco de dados.

---

## Índice

- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias Principais](#tecnologias-principais)
- [Instalação e Configuração](#instalação-e-configuração)
  - [1. Banco de Dados](#1-banco-de-dados)
  - [2. Configuração de Variáveis de Ambiente](#2-configuração-de-variáveis-de-ambiente)
  - [3. Backend](#3-backend)
  - [4. Frontend](#4-frontend)
  - [5. Executando com Workspaces (Yarn)](#5-executando-com-workspaces-yarn)
- [Uso de NPM e Yarn](#uso-de-npm-e-yarn)
- [Scripts Úteis](#scripts-úteis)
  - [No Backend](#no-backend)
  - [No Frontend](#no-frontend)
- [Uso](#uso)
- [Contribuição](#contribuição)
- [Licença](#licença)
- [Contato](#contato)

---

## Estrutura do Projeto

A estrutura de diretórios está organizada em monorepo, com **backend** e **frontend** separados, além de um `script.sql` na raiz:

```plaintext
Cakeria/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── seeders/
│   ├── .env                # Variáveis de ambiente do backend
│   ├── app.js              # Ponto de entrada do servidor
│   ├── package.json
│   └── yarn.lock (opcional, se usar Yarn)
├── frontend/
│   ├── public/
│   ├── assets/
│   ├── components/
│   ├── css/
│   ├── imgs/
│   ├── js/
│   ├── index.html
│   ├── .env                # Variáveis de ambiente do frontend (se necessário)
│   ├── app.js              # Script principal do frontend (ou ponto de entrada)
│   ├── package.json
│   └── yarn.lock (opcional, se usar Yarn)
├── script.sql              # Script SQL para criação/configuração inicial do banco
├── package.json            # Arquivo principal com configuração de workspaces
├── yarn.lock (opcional)    # Lockfile do monorepo, se usar Yarn
├── .gitignore
└── README.md
```

### Descrição das Pastas Principais

- **backend/**: Contém o código do servidor (Node.js + Express), incluindo:

  - Configurações (pasta `config/`), rotas (`routes/`), controladores (`controllers/`), modelos (`models/`), migrações (`migrations/`), seeders (`seeders/`) e scripts auxiliares (`scripts/`).
  - Arquivo `.env` para variáveis de ambiente (ex.: credenciais de banco de dados, porta do servidor).
  - `app.js` como ponto de entrada do servidor.

- **frontend/**: Contém o código do cliente, que pode ser:

  - Arquivos HTML, CSS e JS simples.
  - Ou um framework (React, Vue, Angular).  
    Aqui há um `app.js` (ou outro arquivo principal) e um possível `.env` para configurações do frontend.

- **script.sql**: Script para criação inicial das tabelas e inserção de dados básicos no banco de dados (opcional, dependendo se você prefere usar migrations/seeders do Sequelize ou um script SQL manual).

---

## Tecnologias Principais

- **Node.js + Express**: Servidor e APIs REST.
- **Sequelize**: ORM (Object-Relational Mapping) para interagir com o banco de dados.
- **MySQL / PostgreSQL / etc.**: Banco de dados relacional (a escolha depende da configuração no Sequelize).
- **HTML, CSS, JavaScript** (ou framework JS) para o frontend.
- **dotenv**: Carregar variáveis de ambiente.
- **Yarn Workspaces** (opcional): Para gerenciar as dependências de frontend e backend em um único repositório.

---

## Instalação e Configuração

### 1. Banco de Dados

1. Instale e configure o SGBD (MySQL, PostgreSQL, etc.) de sua preferência.
2. Crie um banco de dados (por exemplo, `cakeria_db`).
3. (Opcional) Rode o `script.sql` para criar tabelas/configurações iniciais:
   ```bash
   mysql -u seu_usuario -p cakeria_db < script.sql
   ```
4. Se for usar o **Sequelize** para gerenciar o banco, você pode utilizar:
   ```bash
   npx sequelize db:migrate
   npx sequelize db:seed:all
   ```
   _(Verifique na seção [Scripts Úteis](#scripts-úteis) como rodar via npm ou yarn.)_

### 2. Configuração de Variáveis de Ambiente

No **backend** (arquivo `.env`), configure variáveis como:

```
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASS=sua_senha
DB_NAME=cakeria_db
DB_DIALECT=mysql
PORT=8080
```

_(Ajuste conforme seu ambiente. Ex.: se usar PostgreSQL, `DB_DIALECT=postgres`.)_

No **frontend** (arquivo `.env`, se necessário), você pode definir chaves para endpoints da API, por exemplo:

```
REACT_APP_API_URL=http://localhost:8080
```

_(Se estiver usando React ou outro framework que suporte `.env`.)_

### 3. Backend

Para instalar as dependências do backend e iniciar o servidor manualmente:

```bash
cd backend
# Se usar npm:
npm install
npm run dev  # ou npm start

# Se usar Yarn:
yarn
yarn dev     # ou yarn start
```

- **`npm run dev`** (ou **`yarn dev`**) normalmente inicia em modo de desenvolvimento (usando `nodemon`).
- **`npm start`** (ou **`yarn start`**) inicia em modo de produção (executando `node app.js` diretamente).

### 4. Frontend

Para instalar as dependências do frontend e iniciar o servidor local de desenvolvimento:

```bash
cd frontend
# Se usar npm:
npm install
npm run dev  # ou npm start

# Se usar Yarn:
yarn
yarn dev     # ou yarn start
```

Dependendo da sua configuração, o frontend pode ser acessado em `http://localhost:3000` (ou a porta que seu framework define).

### 5. Executando com Workspaces (Yarn)

Este repositório possui um `package.json` na raiz configurado para **Workspaces** do Yarn. Assim, você pode instalar tudo de uma só vez:

```bash
# Na raiz do projeto
yarn
```

E há um script para rodar **concurrently** o backend e o frontend:

```bash
# Na raiz do projeto
yarn dev
```

Isso executará, ao mesmo tempo, os scripts `dev` de `backend` e `frontend`, conforme definido em:

```json
"scripts": {
  "dev": "concurrently \"yarn workspace cakeria-backend dev\" \"yarn workspace cakeria-frontend dev\""
}
```

> **Observação**: Esse script supõe que no `backend/package.json` o nome seja `"cakeria-backend"` e no `frontend/package.json` o nome seja `"cakeria-frontend"`. Ajuste se necessário.

---

## Uso de NPM e Yarn

Você pode utilizar **npm** ou **yarn** para gerenciar as dependências. Para evitar conflitos, **escolha um** gerenciador e use-o consistentemente:

- **Se estiver usando npm**:
  ```bash
  npm install
  npm run dev
  npm start
  npm run build
  ```
- **Se estiver usando Yarn**:
  ```bash
  yarn
  yarn dev
  yarn start
  yarn build
  ```

Se você encontrar dois arquivos de lock (`package-lock.json` e `yarn.lock`), opte por remover um deles e manter apenas o gerenciador correspondente.

---

## Scripts Úteis

### No Backend

Exemplo de scripts no `backend/package.json`:

```json
"scripts": {
  "start": "node app.js",
  "dev": "nodemon app.js",
  "migrate": "sequelize db:migrate",
  "seed": "sequelize db:seed:all",
  "db:reset": "sequelize db:migrate:undo:all && sequelize db:migrate",
  "db:clear-data": "node scripts/truncate-data.js",
  "db:drop-tables": "node scripts/clean-database.js",
  "db:rebuild": "npm run db:drop-tables && npm run migrate && npm run seed",
  "db:refresh": "npm run db:clear-data && npm run seed"
}
```

- **`start`**: Inicia em produção (`node app.js`).
- **`dev`**: Inicia em desenvolvimento, usando `nodemon`.
- **`migrate`**: Executa as migrações (`sequelize db:migrate`).
- **`seed`**: Popula o banco com seeds (`sequelize db:seed:all`). Utilize este comando para popular o banco com dados de exemplo de usuários, categorias, produtos, endereços, receitas, comentários, pedidos e itens de pedidos.
- **`seed:run`**: Executa os seeders na ordem correta usando o script personalizado em `scripts/run-seeders.js`.
- **`db:reset`**: Desfaz todas as migrações e as reaplica.
- **`db:clear-data`**: Executa um script que limpa todos os dados das tabelas, sem removê-las.
- **`db:drop-tables`**: Executa um script que remove as tabelas do banco.
- **`db:rebuild`**: Remove as tabelas, roda as migrações e aplica as seeds.
- **`db:refresh`**: Limpa os dados atuais e reaplica as seeds (mantendo as tabelas).

### No Frontend

Exemplo de scripts no `frontend/package.json`:

```json
"scripts": {
  "start": "node app.js",
  "dev": "nodemon app.js"
}
```

- **`start`**: Pode iniciar um servidor de produção (dependendo da sua config).
- **`dev`**: Inicia em modo de desenvolvimento (se você usa algo como `nodemon` ou `webpack-dev-server`, etc.).

> Ajuste conforme o framework ou a estrutura de build do frontend.

---

## Uso

1. **Configure o banco de dados** (crie o banco, rode migrações ou `script.sql`, etc.).
2. **Inicie o backend**:
   ```bash
   # Usando npm
   cd backend
   npm run dev
   # ou
   # Usando Yarn
   yarn dev
   ```
3. **Inicie o frontend** (em outro terminal):
   ```bash
   # Usando npm
   cd frontend
   npm run dev
   # ou
   # Usando Yarn
   yarn dev
   ```
4. Acesse o frontend em `http://localhost:3000` (ou porta configurada).
5. O backend estará rodando em `http://localhost:8080` (ou porta definida no `.env`).

> **Dica**: Se usar Yarn Workspaces, você pode simplesmente rodar `yarn dev` na raiz para iniciar tudo simultaneamente.

---

## Contribuição

Contribuições são bem-vindas! Para colaborar:

1. Faça um **fork** deste repositório.
2. Crie uma nova **branch**:
   ```bash
   git checkout -b minha-feature
   ```
3. Faça commits das suas alterações:
   ```bash
   git commit -m "Implementa nova feature X"
   ```
4. Envie para o seu fork:
   ```bash
   git push origin minha-feature
   ```
5. Abra um **Pull Request** descrevendo suas mudanças.

---

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).  
Sinta-se livre para usar, modificar e distribuir conforme os termos da licença.

---

## Contato

**Autores**:

- Lucas Stopinski da Silva ([GitHub](https://github.com/LucasStop), [Email](mailto:lucasstopinskidasilva@gmail.com))
- Eduardo Henrique Fabri ([GitHub](https://github.com/eduardofabrii), [Email](mailto:eduardohfabri@gmail.com))
- João Victor Carvalho de Freitas ([GitHub](https://github.com/jvecodev), [Email](mailto:jvitor.oliveira1803@gmail.com))
- Renan Americo Herculano ([GitHub](https://github.com/RenanH19), [Email](mailto:Renan.kaspermaya19americo@gmail.com))
