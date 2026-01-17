# Habixa 🧘‍♂️🚀

> **The Identity-First Decision Engine for Busy Professionals.**

Habixa is not just a fitness tracker; it's a decision infrastructure. It helps users build the identity of a healthy person by making decisions for them when they are tired, busy, or stressed.

## 🏗 Architecture

Habixa follows a **Modular Monolith** architecture for the backend and a **Managed Expo** workflow for the frontend.

- **`apps/api`**: NestJS (Node.js) Backend.
  - **Pattern**: Domain-Driven Design (DDD) with Bounded Contexts.
  - **Key Modules**: Identity, Planning (Decision Engine), Habits, Knowledge (RAG).
- **`apps/mobile`**: React Native (Expo) Application.
  - **Focus**: Zero-input UX, offline-first capabilities, native integrations (HealthKit).
- **Infrastructure**: Dockerized services for local development.

## 🛠 Tech Stack

- **Backend**: NestJS, TypeScript, Prisma (ORM), PostgreSQL (DB), Redis (Queue/Cache).
- **Frontend**: React Native, Expo, Expo Router.
- **AI/RAG**: `pgvector` for Knowledge Base, LLM for Decision Logic.
- **DevOps**: Docker Compose.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- Expo CLI

### 1. Start Infrastructure

```bash
docker-compose up -d
```

### 2. Run Backend (API)

```bash
cd apps/api
npm install
npx prisma generate
npm run start:dev
```

_API will be available at `http://localhost:3000` (Swagger at `/api`)._

### 3. Run Frontend (Mobile)

```bash
cd apps/mobile
npm install
npm run start
```

_Scan the QR code with Expo Go or run on Simulator._

## 🌟 Key Features (Roadmap)

1.  **Identity-First Onboarding**: "Who do you want to become?"
2.  **Zero-Input Dashboard**: 3 actionable cards daily.
3.  **Crisis Mode**: Panic button for bad days.
4.  **Knowledge Base**: Science-backed protocols (RAG).

## 📄 License

Proprietary Software.

## 💾 Memory Management Scripts

To save RAM and disk space, use the following scripts to manage the development environment. These scripts automatically install dependencies when starting and delete them when stopping.

> **Note:** These scripts use `pnpm` for efficiency.

### Start Development

- **`./dev-start.sh`**: Installs dependencies (if missing) and starts both API and Mobile in the background.
- **`./dev-start-api.sh`**: Starts only the API.
- **`./dev-start-mobile.sh`**: Starts only the Mobile app.

### Stop & Cleanup

- **`./dev-stop.sh`**: Stops all processes (API & Mobile) and **deletes** `node_modules` to free up space.
- **`./dev-stop-api.sh`**: Stops API and deletes its `node_modules`.
- **`./dev-stop-mobile.sh`**: Stops Mobile and deletes its `node_modules`.
- **`./cleanup-all.sh`**: Manually deletes `node_modules` and cleans logs/PIDs without stopping processes (use with caution).

### Logs & PIDs

- Logs are saved to `api.log` and `mobile.log` in the root directory.
- Process IDs are stored in `api.pid` and `mobile.pid`.
