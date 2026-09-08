# Architecture Overview

## Frontend Architecture
The frontend is a Single Page Application (SPA) built with React and Vite. It heavily relies on a custom CSS design system using native CSS variables for consistency and performance.

### Key Components
- **`AppShell`**: The primary layout wrapper that orchestrates the `Sidebar`, `Topbar`, and `main-content` area.
- **Contexts**: 
  - `AuthContext`: Manages global user state and role-based authentication.
  - `ToastContext`: Manages global notification popups.
- **CSS Architecture** (`index.css`):
  - Uses CSS variables for standardized colors (primary, success, error, neutral), spacing, shadows, and z-indexes.
  - Core UI utility classes: `.btn`, `.card`, `.badge`, `.form-input`.

## Backend Architecture
The backend is a REST API built with Express.js, connecting to a PostgreSQL database via the `pg` driver.

### Key Concepts
- **Unified Authentication**: A single `users` table handles all logins (Admin, Supervisor, Student) via bcrypt and JWT.
- **Middleware (`authorize.js`)**: Highly reusable RBAC (Role-Based Access Control) middleware. Checks JWTs and ensures the user's role exists within the permitted roles array for a given route.
- **Modular Routes**: Domain-specific logic is split into separate route files (e.g., `admin.js`, `students.js`, `projects.js`).
