# EduNova Learning Platform

An enterprise-ready, full-stack, AI-powered online learning platform combining the best features of Udemy and Google Classroom.

## 🏗️ Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v3, Material-UI, Redux Toolkit, React Router v6, Axios, Zod.
- **Backend API**: Java 17, Spring Boot 3.1.x, Spring Security 6 (JWT), Spring Data JPA, Spring Data MongoDB, WebSocket (STOMP).
- **Databases**: 
  - MySQL 8.0 (Core Engine: Users, Roles, Course Content, Relational Mappings).
  - MongoDB 6.0 (Document Engine: Quiz Submissions, Course Progress, Persistent Chat).
- **Infrastructure**: Docker & Docker Compose.

## 🚀 Getting Started

To launch the full stack environment automatically, simply run:

```bash
chmod +x start.sh
./start.sh
```

### Manual Startup (Service by Service)
If you prefer running the containers separately:

**1. Infrastructure**
```bash
docker-compose up -d
```

**2. Backend API**
```bash
cd backend
mvn clean spring-boot:run
```

**3. Frontend Client**
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Built-in Security Architecture
All non-GET endpoints are locked by `JwtAuthenticationFilter`. The stateless system issues:
- `accessToken` (15m expiry) 
- `refreshToken` (7d expiry, stored in `localStorage` mapping seamlessly to the HTTP interceptor).

Roles map strictly to **STUDENT** vs **STAFF** definitions dynamically altering layouts.
