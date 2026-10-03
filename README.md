# RETAIL INVENTORY MANAGEMENT SYSTEM

A full-stack web-based Retail Inventory Management System developed as an HCL Agile Capstone Project.

PROJECT ID: P_022
PROJECT TYPE: Agile Capstone Case Study

TECH STACK
- Frontend: React.js + Vite
- Backend: Node.js + Express.js
- Database: MySQL
- ORM: Prisma
- Architecture: Layered MVC
- Authentication: JWT
- Authorization: Role-Based Access Control (RBAC)
- Version Control: Git + GitHub

--------------------------------------------------
1. PROJECT OBJECTIVE
--------------------------------------------------

The objective of this project is to develop a centralized inventory management platform that helps retail businesses manage:

- Products
- Stock
- Warehouses
- Suppliers
- Procurement
- Customer orders
- Stock movements
- Reports
- Notifications
- Users
- Roles
- Audit activities

The system provides REST APIs for business operations and a React-based web interface for users.

--------------------------------------------------
2. KEY FEATURES
--------------------------------------------------

AUTHENTICATION & SECURITY

- JWT-based authentication
- Secure login and logout
- Password hashing using bcrypt
- Protected API routes
- Role-Based Access Control (RBAC)
- Active/inactive/suspended user validation
- Unauthorized and forbidden request handling
- User-specific notification access
- Audit logging
- Secure API communication


PRODUCT CATALOG

- Product management
- Category management
- Product search
- Filtering and sorting
- Pagination
- Product status management
- SKU uniqueness validation
- Product-category relationships


WAREHOUSE MANAGEMENT

- Warehouse creation and editing
- Warehouse search and filtering
- Warehouse status management
- Warehouse manager assignment
- Warehouse inventory summary
- Warehouse-level inventory tracking


INVENTORY MANAGEMENT

- Track product stock across warehouses
- Current stock tracking
- Reserved stock tracking
- Available stock calculation
- Reorder level management
- Automatic stock status calculation
- Stock adjustments
- Stock movement tracking
- Warehouse-wise inventory
- Product-wise inventory


SUPPLIER & PROCUREMENT

- Supplier management
- Supplier-product relationships
- Purchase order creation
- Purchase order approval
- Purchase order status workflow
- Receiving goods
- Automatic inventory updates after receiving
- Stock movement generation
- Transaction-safe receiving process


ORDER MANAGEMENT & FULFILLMENT

- Customer order creation
- Order item management
- Inventory availability checking
- Stock reservation
- Order cancellation
- Order fulfillment workflow
- Stock deduction during shipment
- Delivery status management


NOTIFICATIONS

- Low-stock notifications
- Out-of-stock notifications
- Purchase order notifications
- Order notifications
- Warehouse/system notifications
- Read/unread notification management


REPORTS & DASHBOARD

- Inventory reports
- Procurement reports
- Order reports
- Dashboard statistics
- Inventory summaries
- Procurement summaries
- Order summaries


ADMINISTRATION

- User management
- Role management
- User status management
- Administrative dashboard
- Audit log management
- System activity tracking


--------------------------------------------------
3. SYSTEM ARCHITECTURE
--------------------------------------------------

The application follows a Layered MVC Architecture.

ARCHITECTURE:

React Frontend
        |
        | REST API / JSON
        ↓
Express.js API
        |
        |-- Routes
        |-- Controllers
        |-- Services
        |-- Middleware
        |
        | Prisma ORM
        ↓
MySQL Database
        |
        └── retail_inventory


REQUEST FLOW:

React UI
   ↓
API Client
   ↓
Express Route
   ↓
Authentication / RBAC Middleware
   ↓
Controller
   ↓
Service
   ↓
Prisma ORM
   ↓
MySQL
   ↓
Service
   ↓
Controller
   ↓
JSON Response
   ↓
React UI


--------------------------------------------------
4. PROJECT MODULES
--------------------------------------------------

The system is divided into 8 major modules:

1. User & Role Management
2. Product Catalog Management
3. Warehouse Management
4. Inventory Management
5. Supplier & Procurement Management
6. Order Management & Fulfillment
7. Dashboard, Reports & Notifications
8. Administration & Audit Management


--------------------------------------------------
5. DATABASE
--------------------------------------------------

Database: MySQL

Database Name:

retail_inventory

ORM:

Prisma ORM

The database contains 17 core models:

1. Role
2. User
3. Category
4. Product
5. Warehouse
6. Inventory
7. StockMovement
8. Supplier
9. SupplierProduct
10. PurchaseOrder
11. PurchaseOrderItem
12. Order
13. OrderItem
14. StockTransfer
15. StockTransferItem
16. Notification
17. AuditLog


IMPORTANT RELATIONSHIPS:

Role
 └── Users

Category
 └── Products

Product
 ├── Inventory
 ├── StockMovements
 ├── OrderItems
 └── PurchaseOrderItems

Warehouse
 ├── Inventory
 ├── StockMovements
 ├── Orders
 └── PurchaseOrders

Supplier
 ├── SupplierProducts
 └── PurchaseOrders

PurchaseOrder
 └── PurchaseOrderItems

Order
 └── OrderItems

StockTransfer
 └── StockTransferItems

User
 ├── Notifications
 └── AuditLogs


--------------------------------------------------
6. CORE BUSINESS WORKFLOWS
--------------------------------------------------

PROCUREMENT WORKFLOW

Supplier
   ↓
Supplier Products
   ↓
Purchase Order
   ↓
Approval
   ↓
Receive Goods
   ↓
Inventory Updated
   ↓
Stock Movement Created


ORDER FULFILLMENT WORKFLOW

Create Order
   ↓
Check Stock Availability
   ↓
Reserve Stock
   ↓
Processing
   ↓
Picking
   ↓
Packing
   ↓
Shipping
   ↓
Stock Deducted
   ↓
Delivered


LOW STOCK WORKFLOW

Inventory Level Changes
        ↓
Check Reorder Level
        ↓
Low Stock / Out of Stock
        ↓
Notification
        ↓
Procurement
        ↓
Purchase Order
        ↓
Receive Goods
        ↓
Inventory Increased


--------------------------------------------------
7. INVENTORY LOGIC
--------------------------------------------------

AVAILABLE STOCK FORMULA:

Available Stock = MAX(0, Current Stock - Reserved Stock)


STOCK STATUS:

If Current Stock = 0
        ↓
OUT OF STOCK

If Current Stock > 0
AND
Current Stock <= Reorder Level
        ↓
LOW STOCK

If Current Stock > Reorder Level
        ↓
IN STOCK


--------------------------------------------------
8. ORDER RESERVATION LOGIC
--------------------------------------------------

WHEN STOCK IS RESERVED:

Current Stock
    ↓
remains unchanged

Reserved Stock
    ↓
increases

Available Stock
    ↓
decreases


WHEN AN ORDER IS SHIPPED:

Current Stock ↓
Reserved Stock ↓
SALE Stock Movement Created


Critical inventory operations are handled using database transactions.


--------------------------------------------------
9. AUTHENTICATION & RBAC
--------------------------------------------------

The backend uses JWT-based authentication.

AUTHENTICATION FLOW:

User Login
    ↓
Validate Email & Password
    ↓
bcrypt Password Verification
    ↓
Generate JWT
    ↓
Return Token
    ↓
Frontend Stores Token
    ↓
Token Sent with API Requests


JWT HEADER:

Authorization: Bearer <JWT_TOKEN>


The backend verifies the token before allowing access to protected resources.


ROLES:

- ADMIN
- INVENTORY_MANAGER
- WAREHOUSE_MANAGER
- PROCUREMENT_MANAGER
- SALES_MANAGER
- STAFF

ADMIN has administrative privileges while other roles have access based on their assigned permissions.


--------------------------------------------------
10. REST API
--------------------------------------------------

AUTHENTICATION

POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout


PRODUCTS

GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
PATCH  /api/products/:id/status


CATEGORIES

GET    /api/categories
GET    /api/categories/:id
POST   /api/categories
PUT    /api/categories/:id
PATCH  /api/categories/:id/status


WAREHOUSES

GET    /api/warehouses
GET    /api/warehouses/:id
POST   /api/warehouses
PUT    /api/warehouses/:id
PATCH  /api/warehouses/:id/status


INVENTORY

GET    /api/inventory
GET    /api/inventory/:id
POST   /api/inventory/adjust
GET    /api/inventory/warehouse/:warehouseId
GET    /api/inventory/product/:productId


STOCK MOVEMENTS

GET    /api/stock-movements
GET    /api/stock-movements/:id
GET    /api/stock-movements/warehouse/:warehouseId
GET    /api/stock-movements/product/:productId


SUPPLIERS

GET    /api/suppliers
GET    /api/suppliers/:id
POST   /api/suppliers
PUT    /api/suppliers/:id
PATCH  /api/suppliers/:id/status


PURCHASE ORDERS

GET    /api/purchase-orders
GET    /api/purchase-orders/:id
POST   /api/purchase-orders
PUT    /api/purchase-orders/:id
PATCH  /api/purchase-orders/:id/status
PATCH  /api/purchase-orders/:id/approve
POST   /api/purchase-orders/:id/receive


ORDERS

GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
POST   /api/orders/:id/reserve
POST   /api/orders/:id/cancel
PATCH  /api/orders/:id/status


REPORTS

GET    /api/reports/inventory
GET    /api/reports/procurement
GET    /api/reports/orders
GET    /api/reports/dashboard


NOTIFICATIONS

GET    /api/notifications
GET    /api/notifications/:id
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id


USERS

GET    /api/users
GET    /api/users/roles
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
PATCH  /api/users/:id/status


AUDIT LOGS

GET    /api/audit-logs
GET    /api/audit-logs/:id


--------------------------------------------------
11. BACKEND STRUCTURE
--------------------------------------------------

server/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.js
│
├── src/
│   ├── config/
│   │   └── prisma.js
│   │
│   ├── controllers/
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── rbacMiddleware.js
│   │   └── errorHandler.js
│   │
│   ├── routes/
│   │
│   ├── services/
│   │
│   ├── utils/
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── .env.example
└── package.json


--------------------------------------------------
12. FRONTEND STRUCTURE
--------------------------------------------------

client/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── products/
│   │   ├── warehouses/
│   │   ├── inventory/
│   │   └── ...
│   │
│   ├── context/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── .env
└── package.json


--------------------------------------------------
13. DATABASE TRANSACTIONS
--------------------------------------------------

Critical operations use Prisma database transactions to maintain data consistency.


STOCK ADJUSTMENT

Inventory Update
      +
Stock Movement Creation
      ↓
Single Database Transaction


PURCHASE ORDER RECEIVING

Purchase Order Item Update
      +
Inventory Update
      +
Stock Movement Creation
      ↓
Single Database Transaction


ORDER SHIPPING

Inventory Deduction
      +
Reserved Stock Reduction
      +
SALE Movement Creation
      ↓
Single Database Transaction


If an operation fails, the transaction is rolled back.


--------------------------------------------------
14. AUDIT LOGGING
--------------------------------------------------

Important system actions are recorded in the audit log.

Examples:

- User creation
- User updates
- User status changes
- Stock adjustments
- Purchase order creation
- Purchase order approval
- Purchase order receiving
- Order creation
- Order reservation
- Order cancellation
- Order shipment
- Order delivery

Audit logs provide traceability for important business operations.


--------------------------------------------------
15. NOTIFICATION SYSTEM
--------------------------------------------------

The system generates notifications for:

- LOW STOCK
- OUT OF STOCK
- PURCHASE ORDER APPROVAL
- PURCHASE ORDER RECEIVING
- ORDER CONFIRMATION
- ORDER SHIPMENT
- ORDER DELIVERY
- ORDER CANCELLATION

Notification failures are designed to be non-blocking so that a notification problem does not unnecessarily fail the primary business transaction.


--------------------------------------------------
16. TESTING
--------------------------------------------------

The backend was validated using dedicated automated test suites.

LATEST RECORDED BACKEND VALIDATION:

Inventory & Stock Movement       94/94
Procurement & Receiving         113/113
Sales Order & Fulfillment        92/92
System / Reports / Admin        127/127
Authentication & RBAC            73/73
---------------------------------------
TOTAL                            499/499

All recorded assertions passed during the backend validation phase.


FRONTEND VALIDATION:

- ESLint
- Production Build
- Authentication Integration
- API Integration


--------------------------------------------------
17. GETTING STARTED
--------------------------------------------------

PREREQUISITES:

- Node.js
- npm
- MySQL
- Git


STEP 1: CLONE REPOSITORY

git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>


STEP 2: INSTALL BACKEND DEPENDENCIES

cd server
npm install


STEP 3: CONFIGURE BACKEND ENVIRONMENT

Create:

server/.env

Example:

PORT=5000
NODE_ENV=development

DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/retail_inventory"

CLIENT_URL=http://localhost:5173

JWT_SECRET="YOUR_SECURE_SECRET"
JWT_EXPIRES_IN="1d"


Never commit .env or expose database credentials or JWT secrets.


STEP 4: CREATE DATABASE

Make sure MySQL is running.

CREATE DATABASE retail_inventory;


STEP 5: RUN PRISMA MIGRATION

From the server directory:

npx prisma migrate dev

Generate Prisma Client:

npx prisma generate


STEP 6: SEED INITIAL DATA

npm run seed


STEP 7: START BACKEND

npm run dev

Backend:

http://localhost:5000

Health Check:

http://localhost:5000/api/health


STEP 8: INSTALL FRONTEND DEPENDENCIES

Open another terminal:

cd client
npm install


STEP 9: CONFIGURE FRONTEND ENVIRONMENT

Create:

client/.env

Add:

VITE_API_BASE_URL=http://localhost:5000/api


STEP 10: START FRONTEND

npm run dev

Frontend normally runs on:

http://localhost:5173


--------------------------------------------------
18. ENVIRONMENT VARIABLES
--------------------------------------------------

BACKEND:

PORT
NODE_ENV
DATABASE_URL
CLIENT_URL
JWT_SECRET
JWT_EXPIRES_IN


FRONTEND:

VITE_API_BASE_URL


--------------------------------------------------
19. DEVELOPMENT WORKFLOW
--------------------------------------------------

Feature Development
       ↓
Local Testing
       ↓
Lint
       ↓
Build
       ↓
Backend API Tests
       ↓
Frontend Integration Testing
       ↓
Git Commit
       ↓
GitHub Push


--------------------------------------------------
20. CURRENT IMPLEMENTATION STATUS
--------------------------------------------------

IMPLEMENTED:

- React frontend
- Express backend
- MySQL database
- Prisma ORM
- Layered MVC architecture
- Product APIs
- Category APIs
- Warehouse APIs
- Inventory APIs
- Stock Movement APIs
- Supplier APIs
- Purchase Order APIs
- Order APIs
- Reports APIs
- Notification APIs
- User Management APIs
- Audit Log APIs
- JWT Authentication
- RBAC Authorization
- Database Transactions
- Audit Logging
- Notification System
- Automated Backend Test Suites


FRONTEND INTEGRATION:

The following core frontend workflows have been connected to the backend and verified against the database:

- Authentication
- Products
- Categories
- Warehouses
- Inventory
- Stock Adjustment

The remaining modules require final frontend integration/verification and end-to-end validation before the project is considered completely finalized.


--------------------------------------------------
21. AGILE DEVELOPMENT
--------------------------------------------------

The project is structured around Agile/Scrum principles.

8 MAJOR EPICS:

Epic 1 → User & Role Management
Epic 2 → Product Catalog
Epic 3 → Warehouse Management
Epic 4 → Inventory Management
Epic 5 → Supplier & Procurement
Epic 6 → Order Management
Epic 7 → Reports & Notifications
Epic 8 → Administration & Audit

Development was performed incrementally with continuous testing and validation.


--------------------------------------------------
22. TECHNOLOGIES USED
--------------------------------------------------

FRONTEND:

- React.js
- Vite
- JavaScript
- React Router
- Lucide React


BACKEND:

- Node.js
- Express.js
- REST API
- JWT
- bcryptjs


DATABASE:

- MySQL
- Prisma ORM


DEVELOPMENT TOOLS:

- Git
- GitHub
- VS Code
- API Testing Tools


--------------------------------------------------
23. PROJECT STRUCTURE
--------------------------------------------------

Retail Inventory Management System
│
├── client/                 # React frontend
├── server/                 # Node.js + Express backend
├── documentation/          # Project documentation
├── README.md
└── .gitignore


--------------------------------------------------
24. FUTURE ENHANCEMENTS
--------------------------------------------------

Potential future enhancements:

- Advanced analytics and visualization
- Barcode/QR code integration
- Email/SMS notifications
- Multi-store support
- Advanced inventory forecasting
- Automated reorder recommendations
- Cloud deployment
- Docker containerization
- CI/CD pipeline
- Advanced reporting and exports


--------------------------------------------------
25. PROJECT DOCUMENTATION
--------------------------------------------------

The project documentation covers:

- System Architecture
- ER Diagram
- Database Design
- Use Cases
- API Documentation
- Authentication & RBAC
- Business Workflows
- Database Transactions
- Testing
- CI/CD
- Audit Logging
- Notification Architecture


--------------------------------------------------
26. SECURITY
--------------------------------------------------

Never commit sensitive information to GitHub.

The following must remain private:

.env
Database credentials
JWT secrets
API keys
Access tokens

Use .env.example to document required environment variables without exposing actual credentials.


--------------------------------------------------
27. PROJECT DETAILS
--------------------------------------------------

Developed For:

HCL Project Development Programme

Project ID:

P_022

Project:

Retail Inventory Management System

Project Type:

Agile Capstone Case Study

Architecture:

Layered MVC

Frontend:

React.js + Vite

Backend:

Node.js + Express.js

Database:

MySQL

ORM:

Prisma

Authentication:

JWT

Authorization:

RBAC

Version Control:

Git + GitHub