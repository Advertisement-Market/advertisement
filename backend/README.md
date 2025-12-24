# Billboard Marketplace - Backend

Spring Boot backend API for the Billboard Marketplace platform.

## Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- PostgreSQL (for production)

### Installation

```bash
mvn clean install
```

### Running the Application

#### Development Mode
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Production Mode
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

The API will run on [http://localhost:8080](http://localhost:8080)

### Running Tests

```bash
mvn test
```

### Building for Production

```bash
mvn clean package
java -jar target/marketplace-0.0.1-SNAPSHOT.jar
```

## API Documentation

### Health Check
- **GET** `/api/health` - Check API status

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/billboard/marketplace/
│   │   │   ├── controller/     # REST controllers
│   │   │   ├── service/        # Business logic
│   │   │   ├── repository/     # Data access layer
│   │   │   ├── model/          # Entity models
│   │   │   ├── dto/            # Data transfer objects
│   │   │   ├── config/         # Configuration classes
│   │   │   └── MarketplaceApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       └── application-prod.properties
│   └── test/                   # Test files
└── pom.xml                     # Maven dependencies
```

## Database

### H2 Console (Development)
Access H2 console at: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`
- Password: (leave empty)
