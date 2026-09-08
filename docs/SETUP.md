# Local Setup Instructions

## Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

## Database Setup
1. Create a PostgreSQL database named `capstone`.
2. Run the SQL schema from `backend/db/schema.sql`.

## Backend Setup
1. Navigate to `backend/`.
2. `npm install`
3. Create a `.env` file based on `.env.example`. Make sure to set `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, and `PORT=5000`.
4. Run `npm run dev` (requires `nodemon`) or `npm start` to run the backend server.

## Frontend Setup
1. Navigate to `frontend/`.
2. `npm install`
3. Create a `.env` file and set `VITE_API_URL=http://localhost:5000/api`.
4. Run `npm run dev`.
5. Open your browser to `http://localhost:5173`.

## Default Admin Credentials
If you seeded the database using the SQL script:
- **Email**: admin@example.com
- **Password**: password123
