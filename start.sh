#!/bin/bash
echo "🚀 Starting EduNova Learning Platform..."

# 1. Start databases
echo "📦 1. Starting MySQL & MongoDB through Docker Compose..."
docker compose up -d

# Wait for databases to initialize
echo "⏳ Waiting 15 seconds for databases to initialize..."
sleep 15

# 2. Start Backend
echo "⚙️  2. Starting Spring Boot Backend API..."
cd backend
mvn clean spring-boot:run &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting 20 seconds for Spring Boot application to start..."
sleep 20

# 3. Start Frontend
echo "💻 3. Starting React Frontend Development Server..."
cd ../frontend
npm run dev -- --open &
FRONTEND_PID=$!

echo "========================================================="
echo "🎉 EduNova Platform is running!"
echo "🌍 Frontend Client: http://localhost:5173"
echo "🔌 Backend API Base:  http://localhost:8080/api/v1"
echo "========================================================="
echo "Press [CTRL+C] to gently shutdown all services."

trap "echo 'Shutting down...'; kill $BACKEND_PID; kill $FRONTEND_PID; docker compose stop; exit" SIGINT SIGTERM

# Wait for user interrupt
wait
