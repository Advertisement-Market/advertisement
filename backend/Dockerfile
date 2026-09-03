# Stage 1: Build stage with Maven and Java 25 JDK
FROM eclipse-temurin:25-jdk AS builder

WORKDIR /app

# Install Maven package manager
RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

# Copy Maven POM descriptor and resolve dependencies
COPY pom.xml ./
RUN mvn dependency:go-offline -B || true

# Copy backend source code and build production JAR executable
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal runtime stage with Java 25 JRE
FROM eclipse-temurin:25-jre

WORKDIR /app

# Install curl for container health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy packaged Spring Boot JAR from builder stage
COPY --from=builder /app/target/*.jar /app/app.jar

EXPOSE 8080

# Run Spring Boot application with production profile
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-Dspring.profiles.active=prod", "-jar", "/app/app.jar"]
