# 🏥 Pharmacy Management System

A comprehensive full-stack pharmacy management system built with modern web technologies to streamline pharmacy operations, inventory management, and customer service.

## 👩‍💻 Developer
**Soumaya Ben Ahmed**  
Full-Stack JavaScript Developer | IT Engineering Student  
📧 Contact: soumaya.ben.ahmed.009@gmail.com  
🔗 LinkedIn: [linkedin.com/in/soumayabenahmed](https://www.linkedin.com/in/soumayabenahmed/)  
🐙 GitHub: [github.com/bnahmedsoumaya00](https://github.com/bnahmedsoumaya00)  
📍 Tunis, Tunisia

## 🎯 Project Overview

This comprehensive pharmacy management system is a modern, enterprise-grade solution designed to revolutionize pharmacy operations. Built with cutting-edge web technologies, it provides an intuitive interface for managing inventory, processing sales, handling prescriptions, and generating insightful analytics. 

**Key Highlights:**
- 🚀 Modern full-stack architecture with React & Node.js
- 🏥 Real-world pharmacy workflow optimization
- 🔐 Enterprise-level security and authentication
- 📊 Advanced analytics and reporting capabilities
- 📱 Responsive design for desktop and mobile devices
- 🛡️ HIPAA-compliant data handling practices

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

### **Development & DevOps Tools**
- **Vite** - Next-generation build tool and dev server
- **Nodemon** - Auto-restart development server
- **Docker** - Containerization for deployment
- **Laragon/XAMPP** - Local development environment
- **Git & GitHub** - Version control and collaboration
- **Postman** - API testing and documentation
- **ESLint & Prettier** - Code quality and formatting
- **Jest** - Unit and integration testing

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

## 🎯 Learning Objectives & Technical Skills

This project showcases advanced proficiency in:

### **Frontend Development**
✅ **React.js Ecosystem** - Hooks, Context API, Custom Hooks, State Management  
✅ **Modern CSS** - Tailwind CSS, Responsive Design, Component Styling  
✅ **User Experience** - Intuitive UI/UX design for complex workflows  
✅ **Performance Optimization** - Code splitting, lazy loading, memoization  

### **Backend Development**
✅ **RESTful API Design** - Scalable and maintainable API architecture  
✅ **Database Management** - Advanced SQL, ORM patterns, data modeling  
✅ **Authentication & Security** - JWT, RBAC, encryption, security best practices  
✅ **Error Handling** - Comprehensive error management and logging  

### **Full-Stack Integration**
✅ **System Architecture** - Microservices-ready, scalable design patterns  
✅ **Real-time Features** - WebSocket integration for live updates  
✅ **Testing Strategy** - Unit, integration, and end-to-end testing  
✅ **DevOps Practices** - CI/CD, containerization, deployment strategies  

### **Business Domain Expertise**
✅ **Healthcare IT** - Understanding of pharmacy operations and compliance  
✅ **Inventory Management** - Complex stock tracking and forecasting  
✅ **Point of Sale Systems** - Transaction processing and payment handling  
✅ **Reporting & Analytics** - Business intelligence and data visualization  

## 🚧 Development Roadmap & Progress

### **Completed ✅**
- [x] **Project Architecture Design** - System design and technology stack selection
- [x] **Database Schema Design** - Complete ERD and table relationships
- [x] **Development Environment Setup** - Git repository and initial project structure
- [x] **API Documentation Planning** - Endpoint specifications and data models

### **In Progress 🚀**
- [ ] **Backend Core Development** - Express server, middleware, and base controllers
- [ ] **Authentication System** - JWT implementation and user management
- [ ] **Database Integration** - Sequelize models and migrations

### **Upcoming 📋**
- [ ] **Frontend Architecture Setup** - React components structure and routing
- [ ] **Core Feature Implementation** - Inventory, sales, and customer management
- [ ] **Advanced Features** - Analytics dashboard and reporting system
- [ ] **Testing & Quality Assurance** - Unit tests, integration tests, and code quality
- [ ] **Deployment & Production** - Docker containerization and cloud deployment
- [ ] **Performance Optimization** - Caching, pagination, and performance tuning

### **Future Enhancements 🔮**
- [ ] **Mobile Application** - React Native companion app
- [ ] **AI-Powered Features** - Demand forecasting and smart recommendations
- [ ] **Multi-language Support** - Internationalization (i18n)
- [ ] **Advanced Analytics** - Business intelligence dashboard
- [ ] **Third-party Integrations** - Payment gateways, suppliers API, insurance systems

## 🤝 Contributing & Collaboration

This project welcomes contributions and feedback from the development community!

### **How to Contribute**
1. **Fork** the repository to your GitHub account
2. **Clone** your fork locally: `git clone https://github.com/yourusername/pharmacy-management-system.git`
3. **Create** a feature branch: `git checkout -b feature/YourFeatureName`
4. **Make** your changes with clear, descriptive commits
5. **Test** your changes thoroughly
6. **Push** to your branch: `git push origin feature/YourFeatureName`
7. **Submit** a Pull Request with a detailed description

### **Contribution Guidelines**
- Follow the existing code style and conventions
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure your code passes all existing tests

### **Areas for Contribution**
- 🐛 Bug fixes and issue resolution
- ✨ New feature development
- 📝 Documentation improvements
- 🧪 Test coverage expansion
- 🎨 UI/UX enhancements
- 🔧 Performance optimizations

## 📞 Contact & Professional Network

**Soumaya Ben Ahmed** - Full-Stack Developer  
🎓 IT Engineering Student & Software Development Enthusiast  

### **Let's Connect!**
📧 **Email:** [soumaya.ben.ahmed.009@gmail.com](mailto:soumaya.ben.ahmed.009@gmail.com)  
🔗 **LinkedIn:** [linkedin.com/in/soumayabenahmed](https://www.linkedin.com/in/soumayabenahmed/)  
🐙 **GitHub:** [github.com/bnahmedsoumaya00](https://github.com/bnahmedsoumaya00)  
📍 **Location:** Tunis, Tunisia  

### **Open to Opportunities**
- 💼 Full-Stack Development Positions
- 🤝 Open Source Collaborations
- 🎓 Mentorship and Learning Opportunities
- 💡 Innovative Project Partnerships

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

⭐ **If this project helps you or inspires your work, please consider giving it a star!**  
🙏 **Your feedback and contributions make this project better for everyone.**

*Crafted with ❤️ and ☕ by Soumaya Ben Ahmed*  
*"Building the future of pharmacy management, one commit at a time."*