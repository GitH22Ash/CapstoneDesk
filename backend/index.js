require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Sentry = require('@sentry/node');
const db = require('./db'); // Ensure db is imported to initialize the pool

// ── Sentry Initialization ──
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
});

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ── Socket.IO ──
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Setup video call signaling
const { setupSocketIO } = require('./routes/videoCall');
setupSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json()); // This allows the server to accept JSON in the request body

// --- API Routes ---
// Import route files
const groupRoutes = require('./routes/groups');
const supervisorRoutes = require('./routes/supervisors');
const adminRoutes = require('./routes/admin');
const chatbotRoutes = require('./routes/chatbot');
const submissionRoutes = require('./routes/submissions');
const { router: videoCallRoutes } = require('./routes/videoCall');
const summarizerRoutes = require('./routes/summarizer');

// Use the routes
app.use('/api/groups', groupRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/video', videoCallRoutes);
app.use('/api/summarizer', summarizerRoutes);

// Health check endpoint for UptimeRobot monitoring
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sentry error handler — must be after all routes and before any other error handlers
Sentry.setupExpressErrorHandler(app);

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
