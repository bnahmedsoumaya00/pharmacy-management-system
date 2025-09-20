# 🏥 Pharmacy Management System

A comprehensive full-stack pharmacy management system built with modern web technologies to streamline pharmacy operations, inventory management, and customer service.

## 👩‍💻 Developer
**Soumaya Ben Ahmed**  
Final Year IT Student | Aspiring Full-Stack JavaScript Developer  
📧 Contact: [Your Email]  
🔗 LinkedIn: [Your LinkedIn Profile]  
📍 Tunis, Tunisia

## 🎯 Project Overview

This pharmacy management system is designed to digitize and optimize pharmacy operations with a modern, user-friendly interface and robust backend architecture. The system handles everything from inventory management to sales processing, making it an ideal solution for modern pharmacies.

## 🚀 Technologies Used

### **Frontend**
- **React 18** - Modern UI library with hooks
- **React Router DOM 6** - Client-side routing
- **Tailwind CSS 3** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form validation and management
- **Recharts** - Data visualization and charts
- **Heroicons** - Beautiful SVG icons

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js 4** - Web application framework
- **Sequelize ORM** - Database object-relational mapping
- **MySQL 8** - Relational database
- **JWT (JSON Web Tokens)** - Authentication
- **Bcrypt** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### **Development Tools**
- **Vite** - Build tool and dev server
- **Nodemon** - Auto-restart development server
- **Laragon** - Local development environment
- **Git** - Version control
- **Postman** - API testing

## ✨ Key Features

### 📊 **Dashboard & Analytics**
- Real-time sales analytics
- Inventory status overview
- Low stock alerts
- Expiry date warnings
- Revenue tracking and trends
- Daily/monthly/yearly reports

### 💊 **Inventory Management**
- Complete medicine database
- Batch tracking with expiry dates
- Automated stock level monitoring
- Supplier management
- Purchase order system
- Barcode scanning support
- Category-based organization

### 💰 **Point of Sale (POS) System**
- Intuitive sales interface
- Multiple payment methods (Cash, Card, Insurance)
- Receipt generation and printing
- Transaction history
- Return and refund processing
- Discount and tax calculations

### 👥 **Customer Management**
- Customer registration and profiles
- Purchase history tracking
- Loyalty points system
- Prescription management
- Medical history and allergies tracking
- Emergency contact information

### 🏪 **Supplier Management**
- Supplier database and contacts
- Purchase order creation and tracking
- Delivery status monitoring
- Supplier performance analytics
- Payment terms management

### 📋 **Prescription Handling**
- Digital prescription management
- Doctor information tracking
- Prescription status (pending, partial, complete)
- Dosage instructions
- Prescription history

### 👤 **User Management & Security**
- Role-based access control (Admin, Pharmacist, Cashier)
- Secure JWT authentication
- Password encryption with bcrypt
- User activity logging
- Session management
- Security audit trails

### 📈 **Reporting & Analytics**
- Sales reports (daily, weekly, monthly)
- Inventory status reports
- Financial summaries
- Top-selling products analysis
- Customer analytics
- Supplier performance reports
- Export functionality (PDF, Excel)

## 🏗️ Project Architecture

```
pharmacy-management-system/
├── 📁 frontend/                 # React Application
│   ├── 📁 public/              # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/      # Reusable UI components
│   │   │   ├── 📁 common/      # Shared components
│   │   │   ├── 📁 dashboard/   # Dashboard widgets
│   │   │   ├── 📁 inventory/   # Inventory components
│   │   │   ├── 📁 sales/       # POS components
│   │   │   ├── 📁 customers/   # Customer components
│   │   │   └── 📁 layout/      # Layout components
│   │   ├── 📁 pages/           # Main page components
│   │   ├── 📁 hooks/           # Custom React hooks
│   │   ├── 📁 services/        # API service calls
│   │   ├── 📁 utils/           # Helper functions
│   │   ├── 📁 context/         # React Context API
│   │   └── 📁 styles/          # CSS and styling
│   └── 📄 package.json
├── 📁 backend/                 # Node.js API Server
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # Route handlers
│   │   ├── 📁 middleware/      # Custom middleware
│   │   ├── 📁 models/          # Database models
│   │   ├── 📁 routes/          # API route definitions
│   │   ├── 📁 services/        # Business logic
│   │   ├── 📁 utils/           # Helper functions
│   │   ├── 📁 config/          # Configuration files
│   │   └── 📁 validators/      # Input validation
│   ├── 📁 tests/               # Test files
│   └── 📄 package.json
├── 📁 database/                # Database Scripts
│   ├── 📄 schema.sql           # Database schema
│   ├── 📄 sample-data.sql      # Sample data
│   └── 📄 migrations/          # Database migrations
├── 📁 docs/                    # Documentation
│   ├── 📄 api-documentation.md # API endpoints
│   ├── 📄 database-schema.md   # Database design
│   └── 📄 deployment-guide.md  # Deployment instructions
├── 📄 README.md                # Project documentation
├── 📄 .gitignore              # Git ignore rules
└── 📄 LICENSE                  # Project license
```

## 🗄️ Database Design

The system uses a well-structured MySQL database with 15+ tables including:

- **users** - System users with role-based access
- **medicines** - Complete medicine inventory
- **categories** - Medicine categorization
- **suppliers** - Supplier information
- **customers** - Customer profiles and history
- **sales** - Transaction records
- **sale_items** - Individual sale line items
- **prescriptions** - Prescription management
- **stock_movements** - Inventory tracking
- **audit_logs** - Security and activity logging

## 🛡️ Security Features

### **Authentication & Authorization**
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Secure password hashing with bcrypt
- Session timeout management
- Multi-factor authentication ready

### **Data Protection**
- SQL injection prevention with Sequelize ORM
- XSS (Cross-Site Scripting) protection
- CSRF (Cross-Site Request Forgery) protection
- Input validation and sanitization
- Helmet.js security headers

### **Audit & Monitoring**
- Complete activity logging
- User action tracking
- Database change auditing
- Login attempt monitoring
- Security event alerts

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js (v16 or higher)
- MySQL 8.0
- Git
- Laragon (for Windows) or XAMPP

### **Backend Setup**
```bash
# Clone the repository
git clone https://github.com/soumayabenahmed/pharmacy-management-system.git

# Navigate to backend directory
cd pharmacy-management-system/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start the server
npm run dev
```

### **Frontend Setup**
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### **Database Setup**
```bash
# Import the database schema
mysql -u root -p pharmacy_db < database/schema.sql

# Import sample data (optional)
mysql -u root -p pharmacy_db < database/sample-data.sql
```

## 📱 API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### **Medicines**
- `GET /api/medicines` - Get all medicines
- `POST /api/medicines` - Add new medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine
- `GET /api/medicines/low-stock` - Get low stock items

### **Sales**
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales/:id/refund` - Process refund

### **Customers**
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add new customer
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/:id/history` - Get purchase history

[Complete API documentation available in `/docs/api-documentation.md`]

## 📊 Screenshots

*Screenshots will be added as development progresses*

## 🎯 Learning Objectives Achieved

This project demonstrates proficiency in:

✅ **Full-Stack Development** with JavaScript  
✅ **React.js** - Modern hooks, state management, routing  
✅ **Node.js & Express** - RESTful API development  
✅ **Database Design** - MySQL with proper relationships  
✅ **Authentication & Security** - JWT, bcrypt, RBAC  
✅ **Modern UI/UX** - Responsive design with Tailwind  
✅ **Git Version Control** - Professional workflow  
✅ **Project Architecture** - Clean, scalable code structure  
✅ **API Integration** - Frontend-backend communication  
✅ **Business Logic** - Real-world pharmacy operations

## 🚧 Development Status

- [x] **Phase 1:** Database design and setup
- [x] **Phase 2:** Project initialization and GitHub setup
- [ ] **Phase 3:** Backend API development
- [ ] **Phase 4:** Frontend React components
- [ ] **Phase 5:** Authentication system
- [ ] **Phase 6:** Core features implementation
- [ ] **Phase 7:** Testing and optimization
- [ ] **Phase 8:** Documentation and deployment

## 🤝 Contributing

This is an educational project, but suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Contact & Support

**Soumaya Ben Ahmed**  
📧 Email: [soumaya.ben.ahmed.009@gmail.com]  
🔗 LinkedIn: [https://www.linkedin.com/in/soumayabenahmed/]  
🐙 GitHub: [github.com/bnahmedsoumaya00]  

---

⭐ **If you find this project helpful, please consider giving it a star!**

*Built with ❤️ by Soumaya Ben Ahmed - Future Full-Stack Developer*