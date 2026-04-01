# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build Backend ---
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-build
WORKDIR /app/backend
# Copy the frontend build output to backend static resources
# This allows Spring Boot to serve the React app
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static/
COPY backend/pom.xml ./
# Only download dependencies if pom.xml hasn't changed
RUN mvn dependency:go-offline
COPY backend/src ./src
RUN mvn clean package -DskipTests

# --- Stage 3: Final Runtime ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/target/*.jar app.jar

# Expose the API and Frontend port (Spring Boot default)
EXPOSE 8080

# Run with memory optimization for 256MB RAM environment
# -Xmx128m limits heap to 128MB, leaving room for metaspace and OS
ENTRYPOINT ["java", "-Xmx128m", "-Xms128m", "-jar", "app.jar"]
