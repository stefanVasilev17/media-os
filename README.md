# Media OS

Director-first production operating system for **Architectural Thinking**.

## v0.1 goal

From an iPhone, the creator can open EP001, chat with the Spline Agent, review a proposal, approve or request changes, and persist the decision. Spline execution is mocked in the first vertical slice; the production-worker contract is already modeled so the real Windows + Spline MCP worker can replace it without redesigning the product flow.

## Stack

- Frontend: React + TypeScript + Vite, mobile-first PWA
- Backend: Java 21 + Spring Boot + PostgreSQL + Flyway
- Production execution: separate Windows worker (later Spline MCP / DaVinci)
- Deployment: Docker-first

## Local development

1. Start PostgreSQL: `docker compose up -d db`
2. Backend: `cd backend && ./mvnw spring-boot:run` (or `mvn spring-boot:run`)
3. Frontend: `cd frontend && npm install && npm run dev`

Frontend defaults to `http://localhost:5173`; backend to `http://localhost:8080`.

## Product rule

**Creator-directed, agent-executed.** The creator defines intent, reviews, corrects and approves. Every correction becomes production knowledge.
