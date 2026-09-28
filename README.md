# Retail Inventory Management System

**Project ID:** `P_022`  
**Case Study:** Agile Capstone  
**Development Methodology:** Agile / Scrum (Iterative and Incremental)

---

## 1. Project Description

The **Retail Inventory Management System** is a college-level, industry-oriented full-stack web application engineered for enterprise-grade management of retail operations. The system is designed to streamline and automate core workflows across products, multi-location warehouses, stock movement, suppliers, procurement purchase orders, customer orders, and order fulfillment.

The platform is architected with a decoupled frontend and backend, enforcing clear separation of concerns, high maintainability, and scalability to support high transaction volumes and evolving business capabilities.

---

## 2. Technology Stack

### Frontend
- **Framework / Library:** React.js (v19)
- **Build Tool:** Vite
- **Language:** JavaScript (ES6+)
- **Styling:** CSS (Modular, Responsive Design)

### Backend
- **Runtime:** Node.js
- **Web Framework:** Express.js
- **Cross-Origin Handling:** CORS
- **Environment Management:** `dotenv`
- **Development Utility:** `nodemon`

### Database
- **Engine:** MySQL (Relational Database Management System)
- *Note: Database schemas and connectivity will be configured in subsequent sprints.*

### API & Architectural Style
- **API Protocol:** RESTful API
- **Data Exchange Format:** JSON
- **Architecture Pattern:** Layered MVC (Model-View-Controller) Architecture

### Version Control & Tooling
- **Version Control:** Git & GitHub
- **Package Manager:** npm

### Future Technologies (Planned)
- JWT Authentication & Refresh Tokens
- Role-Based Access Control (RBAC)
- Containerization: Docker & Docker Compose
- CI/CD Pipeline: Jenkins
- Cloud Deployment: AWS / Azure

---

## 3. System Architecture

The backend strictly adheres to an industry-standard **Layered MVC Architecture**:

```
Client (React.js + Vite)
       ↓  HTTP / REST API (JSON)
Routes (src/routes)
       ↓  Route dispatch & param parsing
Controllers (src/controllers)
       ↓  HTTP request/response handling & validation
Services / Business Logic (src/services)
       ↓  Core business rules, computations, workflows
Models / Data Access (src/models)
       ↓  Data access queries & schema abstractions
MySQL Database
```

### Architectural Principles:
1. **Routes:** Exclusively declare API endpoints and route them to corresponding controllers. No business logic in routes.
2. **Controllers:** Process incoming HTTP requests, extract parameters/body, invoke service methods, and format HTTP responses.
3. **Services:** Contain pure business logic and operational workflows independent of HTTP transport.
4. **Models / Data Access:** Encapsulate database queries and schema persistence. No direct database access from controllers.
5. **Centralized Error Handling:** Global middleware catches exceptions and delivers uniform JSON error responses.

---

## 4. Current Development Status

- **Status:** Phase 1 – Initial Project Setup & Baseline Infrastructure
- **Completed Components:**
  - Standardized monorepo/multi-package workspace structure (`client/`, `server/`, `docs/`).
  - React + Vite frontend scaffolded with modular directory structure (`components/`, `pages/`, `layouts/`, `services/`, `hooks/`, `context/`, `utils/`, `assets/`).
  - Node.js + Express backend established with clean `server.js` and `app.js` separation.
  - Layered MVC directory structure ready for incremental feature expansion.
  - Centralized error handling and 404 middleware.
  - Verified Health-Check API endpoint (`GET /api/health`).
  - Environment variable templates (`.env.example`) for client and server.
  - Comprehensive `.gitignore` configuration.
- **Explicit Boundary:** No business modules, user authentication, or database schemas have been implemented at this stage.

---

## 5. Planned Modules (Agile Delivery)

The following core modules are planned for development across upcoming Agile sprints:

1. **User and Role Management:** Authentication, RBAC, permission hierarchies, and user profiles.
2. **Product Catalog Management:** Categories, SKUs, barcode tracking, pricing, and variants.
3. **Warehouse Management:** Multi-warehouse mapping, bin locations, aisle tracking, and capacity.
4. **Inventory Management:** Stock levels, transfers, adjustments, low-stock threshold alerts, and reorder levels.
5. **Supplier and Procurement Management:** Supplier directory, purchase orders (PO), receipt verification, and lead time tracking.
6. **Order Management and Fulfillment:** Customer order intake, picking, packing, shipping, and return management.
7. **Dashboard, Reports and Notifications:** Executive KPI metrics, inventory valuation, movement velocity, and automated stock alerts.
8. **Administration and Audit Management:** Comprehensive audit trail logs, system health monitoring, and administrative settings.

> **Note:** These modules will be designed, modeled, and implemented incrementally using Agile/Scrum sprints.

---

## 6. Project Structure

```text
retail-inventory-management/
│
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── assets/             # Static assets, images, icons
│   │   ├── components/         # Reusable presentation components
│   │   ├── context/            # React context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Page shell layouts
│   │   ├── pages/              # Route view pages
│   │   ├── services/           # API client services
│   │   ├── utils/              # Helper utilities & constants
│   │   ├── App.css             # Root component styling
│   │   ├── App.jsx             # Root React component
│   │   ├── index.css           # Global typography & base tokens
│   │   └── main.jsx            # Application entry point
│   ├── .env.example            # Frontend environment variable template
│   ├── index.html              # HTML5 entry page
│   ├── package.json            # Frontend package manifest & scripts
│   └── vite.config.js          # Vite build configuration
│
├── server/                     # Backend Application (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Database and environment configurations
│   │   ├── controllers/        # Request handling and response formatting
│   │   ├── middleware/         # Custom Express middleware (e.g., error handler)
│   │   ├── models/             # Data access models (MySQL queries)
│   │   ├── routes/             # REST API endpoint route definitions
│   │   ├── services/           # Core business logic layer
│   │   ├── utils/              # Backend utility helpers
│   │   ├── app.js              # Express app setup, middleware & route mounting
│   │   └── server.js           # Server bootstrap and port listener
│   ├── .env.example            # Backend environment variable template
│   └── package.json            # Backend package manifest & scripts
│
├── docs/                       # Project documentation & sprint artifacts
│   └── README.md               # Documentation guide
│
├── .gitignore                  # Git ignore rules
└── README.md                   # Project overview and setup documentation
```

---

## 7. Getting Started & Verification

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later recommended; tested with v24.x)
- [npm](https://www.npmjs.com/) (v9.x or later)

---

### Backend Setup

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   # On Windows PowerShell:
   Copy-Item .env.example .env
   ```

3. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

4. Start the backend server:
   - For production / standard run:
     ```bash
     npm start
     ```
   - For development (with hot reload via nodemon):
     ```bash
     npm run dev
     ```

5. Verify the health-check endpoint:
   - Navigate to: `http://localhost:5000/api/health`
   - Expected Response:
     ```json
     {
       "success": true,
       "message": "Retail Inventory Management API is running"
     }
     ```

---

### Frontend Setup

1. Open a terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```

2. Copy the environment template (optional for initial run):
   ```bash
   cp .env.example .env
   # On Windows PowerShell:
   Copy-Item .env.example .env
   ```

3. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

5. Access the application in your browser:
   - URL: `http://localhost:5173`
