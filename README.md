# Nexora 🚀

**Nexora** is a production-style full-stack SaaS platform that combines organization management, role-based access control, project and task management, JWT authentication, PostgreSQL persistence, and Web3 escrow payments.

It was built to demonstrate practical full-stack development, backend API design, database management, authentication, and blockchain integration.

## ✨ Features

* 🔐 JWT-based authentication
* 🔑 Password hashing with bcrypt
* 👥 Organization and team management
* 🛡️ Role-based access control (RBAC)
* 📁 Project management
* ✅ Task management with priorities and statuses
* 💳 Payment management
* ⛓️ Web3 escrow payments
* 🦊 MetaMask integration
* 📊 Dashboard with project, task, team, and payment information
* 🗄️ PostgreSQL database with Prisma ORM
* ⚡ REST API built with Express and TypeScript
* 🎨 Modern responsive frontend with Next.js and Tailwind CSS

## 🏗️ Architecture

```text
Nexora
│
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Express backend
│
├── contracts/            # Solidity smart contracts
│
├── packages/
│   └── shared/           # Shared code
│
└── scripts/              # Development/deployment scripts
```

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* ethers.js

### Backend

* Node.js
* Express
* TypeScript
* REST API
* JWT
* bcrypt

### Database

* PostgreSQL
* Neon
* Prisma ORM

### Blockchain

* Solidity
* Hardhat
* Ethereum-compatible EVM network
* MetaMask
* ethers.js

### Development Tools

* Git
* GitHub
* VS Code
* npm

## 🔐 Authentication

Nexora uses JWT-based authentication.

Users can:

* Register an account
* Log in securely
* Receive a JWT token
* Access protected API routes
* Access protected frontend pages

Passwords are hashed using bcrypt before being stored.

## 👥 Role-Based Access Control

Organizations support multiple roles:

| Role   | Description                |
| ------ | -------------------------- |
| OWNER  | Organization owner         |
| ADMIN  | Organization administrator |
| MEMBER | Regular team member        |
| VIEWER | Read-only access           |

Permissions are enforced on the backend through authentication and organization membership checks.

## 📋 Project & Task Management

Users can create projects inside organizations and manage tasks associated with those projects.

Tasks support:

* TODO
* IN_PROGRESS
* DONE

And priorities:

* LOW
* MEDIUM
* HIGH

## ⛓️ Web3 Escrow

Nexora integrates a Solidity escrow smart contract for payment workflows.

The escrow supports:

```text
Created
   ↓
Funded
   ↓
 ┌───────────┐
 ↓           ↓
Released   Refunded
```

The buyer can release funds to the seller or refund the buyer while the escrow is funded.

For development, Nexora uses a local Hardhat blockchain with test ETH.

## 💳 Payment Flow

```text
User
  │
  ▼
Next.js Frontend
  │
  ├── JWT Authentication
  │
  ▼
Express REST API
  │
  ▼
PostgreSQL / Prisma
```

For Web3 payments:

```text
User
  │
  ▼
MetaMask
  │
  ▼
Nexora Escrow Contract
  │
  ├── Fund
  ├── Release
  └── Refund
```

Payment information is also synchronized with the Nexora database.

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/trishikat/Nexora.git
cd Nexora
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create the required environment files based on `.env.example`.

The backend requires a PostgreSQL connection string and JWT secret.

### 4. Start the backend

```bash
cd apps/api
npm run dev
```

The API runs on:

```text
http://localhost:5000
```

### 5. Start the frontend

In another terminal:

```bash
cd apps/web
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

### 6. Start the local blockchain

From the project root:

```bash
npx hardhat node
```

Then deploy the escrow contract using the deployment script.

## 🧪 Development Environment

The Web3 functionality is designed for local development using Hardhat and test ETH.

No real cryptocurrency is required.

## 📌 Project Status

Nexora currently includes:

* Authentication
* Protected routes
* Organizations
* Team management
* RBAC
* Projects
* Tasks
* Payments
* PostgreSQL persistence
* Prisma integration
* Web3 escrow
* MetaMask integration
* Local Hardhat blockchain

Further improvements can include automated tests, production deployment, CI/CD, notifications, analytics, and additional blockchain networks.

## 🎯 Learning Goals

This project was built to demonstrate practical experience with:

* Full-stack application development
* REST API development
* Authentication and authorization
* Database design
* ORM usage
* Role-based access control
* React/Next.js development
* TypeScript
* Blockchain integration
* Smart contracts
* Web3 wallet integration
* Git and GitHub workflows

## 👩‍💻 Author

**Trishika Tayade**

GitHub: https://github.com/trishikat
