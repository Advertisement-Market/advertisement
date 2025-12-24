# Billboard Marketplace

A full-stack web application connecting billboard owners with advertisers, providing a comprehensive marketplace platform for billboard advertising.

## Project Overview

This repository contains two separate projects:
- **Frontend**: React-based web application
- **Backend**: Java Spring Boot REST API

## Architecture

```
advertisement/
├── frontend/          # React frontend application
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
├── backend/           # Spring Boot backend API
│   ├── src/
│   ├── pom.xml
│   └── README.md
├── .gitignore
└── README.md
```

## Features (Planned)

### For Billboard Owners
- Register and manage billboard properties
- Set pricing and availability
- View booking requests and analytics
- Manage billboard locations and specifications

### For Advertisers
- Browse available billboards
- Filter by location, size, and price
- Book billboard slots
- Manage campaigns and track performance

### Platform Features
- User authentication and authorization
- Real-time availability updates
- Payment processing integration
- Review and rating system
- Analytics dashboard

## Technology Stack

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Build Tool**: Create React App
- **Styling**: CSS3

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Build Tool**: Maven
- **Database**: PostgreSQL (Production), H2 (Development)
- **ORM**: Spring Data JPA
- **Security**: Spring Security
- **API**: RESTful

## Getting Started

### Prerequisites
- **Frontend**: Node.js v16+ and npm
- **Backend**: Java 17+ and Maven 3.6+
- **Database**: PostgreSQL (for production)

### Installation

#### 1. Clone the repository
```bash
git clone <repository-url>
cd advertisement
```

#### 2. Setup Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
Backend will run on `http://localhost:8080`

#### 3. Setup Frontend
```bash
cd frontend
npm install
npm start
```
Frontend will run on `http://localhost:3000`

## Development

### Backend Development
See [backend/README.md](backend/README.md) for detailed backend setup and API documentation.

### Frontend Development
See [frontend/README.md](frontend/README.md) for detailed frontend setup and component structure.

## Environment Variables

Both projects require environment variables. Copy the `.env.example` files:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Update the values according to your local setup.

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

More endpoints will be documented as they are developed.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## Project Status

🚧 **Initial Setup Complete** - This is the first commit establishing the project structure.

## License

[Add your license here]

## Contact

[Add contact information here]