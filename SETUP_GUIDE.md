# Billboard Marketplace - Setup & Commands Guide

Complete guide for building, running, and testing the Billboard Marketplace application.

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Testing](#testing)
- [Authentication](#authentication)
- [Available APIs](#available-apis)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Backend Requirements
- **Java:** Version 17 or higher
- **Maven:** Version 3.6 or higher

Check versions:
```bash
java -version
mvn -version
```

### Frontend Requirements
- **Node.js:** Version 16 or higher
- **npm:** Version 8 or higher

Check versions:
```bash
node -version
npm -version
```

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
mvn clean install
```

### 3. Run the Backend

#### Option A: Using Maven (Development Mode)
```bash
mvn spring-boot:run
```

With specific profile:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Option B: Build JAR and Run
```bash
# Build the JAR file
mvn clean package

# Run the JAR
java -jar target/marketplace-0.0.1-SNAPSHOT.jar
```

#### Option C: Using IDE
1. Open `backend/src/main/java/com/billboard/marketplace/MarketplaceApplication.java`
2. Right-click and select "Run" or "Debug"

### 4. Verify Backend is Running
- **Base URL:** http://localhost:8080
- **Health Check:** http://localhost:8080/api/health

### 5. Run Backend Tests
```bash
# Run all tests
mvn test

# Run tests with coverage
mvn clean test jacoco:report

# Run specific test class
mvn test -Dtest=MarketplaceApplicationTests
```

### 6. Build for Production
```bash
# Create production JAR
mvn clean package -DskipTests

# Run production build
java -jar target/marketplace-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

---

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Frontend

#### Development Mode
```bash
npm start
```
Application will open at: http://localhost:3000

#### Production Build
```bash
# Create optimized production build
npm run build

# Serve production build (requires serve package)
npx serve -s build
```

### 4. Run Frontend Tests
```bash
# Run tests in interactive watch mode
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests once (CI mode)
npm test -- --watchAll=false
```

### 5. Other Useful Commands
```bash
# Check for linting issues
npm run build

# Eject from Create React App (irreversible)
npm run eject
```

---

## Testing

### Frontend Test Suite

#### 1. Run All Tests
```bash
cd frontend

# Run tests in interactive watch mode
npm test

# Run tests once (CI mode)
npm test -- --watchAll=false

# Run tests with verbose output
npm test -- --watchAll=false --verbose
```

#### 2. Run Tests with Coverage Report
```bash
# Generate coverage report
npm test -- --watchAll=false --coverage

# View coverage summary in console
npm test -- --coverage --watchAll=false
```

#### 3. Run Specific Test Files
```bash
# Test Header component
npm test -- --watchAll=false src/__tests__/components/Header.test.js

# Test Footer component
npm test -- --watchAll=false src/__tests__/components/Footer.test.js

# Test LandingPage component
npm test -- --watchAll=false src/__tests__/components/LandingPage.test.js

# Test App integration
npm test -- --watchAll=false src/__tests__/App.test.js
```

#### 4. Run Tests with Specific Pattern
```bash
# Run only Header tests
npm test -- --watchAll=false --testNamePattern="Header Component"

# Run only Footer tests
npm test -- --watchAll=false --testNamePattern="Footer Component"

# Run only LandingPage tests
npm test -- --watchAll=false --testNamePattern="LandingPage Component"

# Run only rendering tests
npm test -- --watchAll=false --testNamePattern="Rendering"
```

#### 5. Watch Mode for Development
```bash
# Start test watcher (auto-runs on file changes)
npm test

# In watch mode, press:
# - 'a' to run all tests
# - 'p' to filter by filename
# - 't' to filter by test name
# - 'q' to quit
```

#### 6. Test Coverage Thresholds
The test suite includes:
- **84 total tests** across all components
- **73+ passing tests** with high code coverage
- **Component tests:** Header, Footer, LandingPage
- **Integration tests:** App component
- **Accessibility tests:** ARIA labels, semantic HTML
- **Responsive design tests:** CSS classes and layouts

#### 7. Debugging Tests
```bash
# Run tests with debugging enabled
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test with debugging
node --inspect-brk node_modules/.bin/jest --runInBand src/__tests__/components/Header.test.js
```

#### 8. Test Categories

**Rendering Tests:**
- Component visibility and structure
- Text content and elements
- SVG icons and visual elements

**Functionality Tests:**
- Search input and form submission
- Mobile menu toggle
- Navigation interactions
- Button clicks and state changes

**Accessibility Tests:**
- ARIA labels and roles
- Keyboard navigation
- Semantic HTML structure
- Color contrast and readability

**Responsive Design Tests:**
- CSS class application
- Grid and layout structures
- Mobile menu behavior
- Breakpoint handling

**Content Tests:**
- Heading hierarchy
- Link structure
- Form validation
- Newsletter signup

### Backend Test Suite

#### 1. Run All Tests
```bash
cd backend

# Run all tests
mvn test

# Run tests with output
mvn test -X
```

#### 2. Run Tests with Coverage
```bash
# Generate coverage report with JaCoCo
mvn clean test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

#### 3. Run Specific Test Class
```bash
# Run specific test
mvn test -Dtest=MarketplaceApplicationTests

# Run multiple tests
mvn test -Dtest=MarketplaceApplicationTests,HealthControllerTests
```

#### 4. Skip Tests During Build
```bash
# Build without running tests
mvn clean package -DskipTests

# Install without tests
mvn clean install -DskipTests
```

### Running Tests Together

#### Terminal 1 - Frontend Tests
```bash
cd frontend
npm test -- --watchAll=false --coverage
```

#### Terminal 2 - Backend Tests
```bash
cd backend
mvn test
```

### Continuous Integration (CI) Mode

For automated testing in CI/CD pipelines:

**Frontend:**
```bash
cd frontend
npm test -- --watchAll=false --coverage --passWithNoTests
```

**Backend:**
```bash
cd backend
mvn clean test -B
```

### Test Results Interpretation

**Passing Tests:**
- ✓ All assertions passed
- Component renders correctly
- Functionality works as expected

**Failing Tests:**
- ✗ Assertion failed
- Check error message for details
- Review component implementation

**Coverage Report:**
- **Statements:** Percentage of code executed
- **Branches:** Percentage of conditional paths tested
- **Functions:** Percentage of functions called
- **Lines:** Percentage of lines executed

### Common Test Commands Quick Reference

```bash
# Frontend
npm test                                    # Interactive watch mode
npm test -- --watchAll=false               # Run once
npm test -- --watchAll=false --coverage    # With coverage
npm test -- --watchAll=false --verbose     # Verbose output

# Backend
mvn test                                    # Run all tests
mvn clean test jacoco:report               # With coverage
mvn test -Dtest=ClassName                  # Specific test
```

---

## Authentication

### Spring Security Credentials

The backend has Spring Security enabled. When you start the application:

#### Finding Username and Password

**Method 1: Check Console Output**
When the backend starts, look for this line in the console:
```
Using generated security password: <random-password-here>
```

**Default Credentials:**
- **Username:** `user`
- **Password:** Check the startup console logs for the generated password

#### Example Console Output:
```
2024-12-24 22:00:00.000  INFO 12345 --- [main] .s.s.UserDetailsServiceAutoConfiguration : 

Using generated security password: a1b2c3d4-e5f6-7890-abcd-ef1234567890

This generated password is for development use only. Your security configuration must be updated before running your application in production.
```

### H2 Database Console Credentials

Access H2 Console at: http://localhost:8080/h2-console

**Credentials:**
- **JDBC URL:** `jdbc:h2:mem:testdb`
- **Username:** `sa`
- **Password:** (leave empty)

---

## Available APIs

### Current API Endpoints

#### 1. Health Check API
- **Endpoint:** `GET /api/health`
- **Description:** Check if the backend API is running
- **Authentication:** Required (Spring Security)
- **Request:** None
- **Response:**
  ```json
  {
    "status": "UP",
    "message": "Billboard Marketplace API is running"
  }
  ```
- **Usage Example:**
  ```bash
  curl -u user:<password> http://localhost:8080/api/health
  ```

### API Testing with cURL

#### With Authentication:
```bash
# Replace <password> with the generated password from console
curl -u user:<password> http://localhost:8080/api/health
```

#### Example Response:
```json
{
  "status": "UP",
  "message": "Billboard Marketplace API is running"
}
```

---

## Running Both Applications Together

### Terminal 1 - Backend:
```bash
cd backend
mvn spring-boot:run
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- H2 Console: http://localhost:8080/h2-console

---

## Environment Variables

### Backend Environment Variables

Copy the example file:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:
```properties
DATABASE_URL=jdbc:postgresql://localhost:5432/billboard_marketplace
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password_here
JWT_SECRET=your_jwt_secret_key_here
```

### Frontend Environment Variables

Copy the example file:
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` with your values:
```properties
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

---

## Troubleshooting

### Backend Issues

#### Port 8080 Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>
```

#### Maven Build Fails
```bash
# Clean and rebuild
mvn clean install -U

# Skip tests if needed
mvn clean install -DskipTests
```

#### Java Version Issues
```bash
# Check Java version
java -version

# Set JAVA_HOME (macOS/Linux)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Frontend Issues

#### Port 3000 Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or run on different port
PORT=3001 npm start
```

#### Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Build Fails
```bash
# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

---

## Quick Reference

### Backend Commands Summary
```bash
cd backend
mvn clean install          # Install dependencies
mvn spring-boot:run        # Run development server
mvn test                   # Run tests
mvn clean package          # Build production JAR
```

### Frontend Commands Summary
```bash
cd frontend
npm install                # Install dependencies
npm start                  # Run development server
npm test                   # Run tests
npm run build              # Build for production
```

### Default Ports
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8080
- **H2 Console:** http://localhost:8080/h2-console

### Authentication Quick Reference
- **API Username:** `user`
- **API Password:** Check backend console logs on startup
- **H2 Username:** `sa`
- **H2 Password:** (empty)

---

## Next Steps

1. ✅ Backend and frontend are set up
2. 🔄 Implement user authentication endpoints
3. 🔄 Create billboard management APIs
4. 🔄 Develop advertiser booking system
5. 🔄 Add payment integration
6. 🔄 Build analytics dashboard

---

## Additional Resources

- **Backend README:** [backend/README.md](backend/README.md)
- **Frontend README:** [frontend/README.md](frontend/README.md)
- **Main README:** [README.md](README.md)
- **Spring Boot Documentation:** https://spring.io/projects/spring-boot
- **React Documentation:** https://react.dev
