require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Sentry = require('@sentry/node');
const db = require('./db'); // Ensure db is imported to initialize the pool

// ── Sentry Initialization ──
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // This allows the server to accept JSON in the request body

// --- API Routes ---
// Import route files
const groupRoutes = require('./routes/groups');
const supervisorRoutes = require('./routes/supervisors');
const adminRoutes = require('./routes/admin');

// Use the routes
// Any request starting with /api/groups will be handled by groupRoutes
app.use('/api/groups', groupRoutes); 

// Any request starting with /api/supervisors will be handled by supervisorRoutes
app.use('/api/supervisors', supervisorRoutes);

// Any request starting with /api/admin will be handled by adminRoutes
app.use('/api/admin', adminRoutes);

// Health check endpoint for UptimeRobot monitoring
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sentry error handler — must be after all routes and before any other error handlers
Sentry.setupExpressErrorHandler(app);

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
