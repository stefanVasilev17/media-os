FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS render-worker-build
WORKDIR /render-worker
COPY render-worker/package*.json ./
RUN npm install --omit=dev
COPY render-worker/ ./

FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /backend
COPY backend/pom.xml ./
COPY backend/src ./src
COPY --from=frontend-build /frontend/dist ./src/main/resources/static
RUN date -u +"%Y-%m-%dT%H:%M:%SZ" > src/main/resources/media-os-build-time.txt
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache nodejs chromium ffmpeg xvfb nss freetype harfbuzz ttf-freefont ca-certificates
COPY --from=backend-build /backend/target/media-os-0.1.0-SNAPSHOT.jar app.jar
COPY --from=render-worker-build /render-worker /app/render-worker
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]