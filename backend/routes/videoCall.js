const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// POST /api/video/create-room
router.post('/create-room', async (req, res) => {
    const { group_id, supervisor_id } = req.body;

    if (!group_id || !supervisor_id) {
        return res.status(400).json({ msg: 'Group ID and supervisor ID are required.' });
    }

    try {
        const roomId = `room_${group_id}_${supervisor_id}_${crypto.randomBytes(4).toString('hex')}`;

        // Deactivate any existing active rooms for this pair
        await db.query(
            'UPDATE video_rooms SET is_active = FALSE WHERE group_id = $1 AND supervisor_id = $2',
            [group_id, supervisor_id]
        );

        // Create new room
        await db.query(
            'INSERT INTO video_rooms (room_id, group_id, supervisor_id) VALUES ($1, $2, $3)',
            [roomId, group_id, supervisor_id]
        );

        res.status(201).json({ roomId });
    } catch (err) {
        console.error('Create room error:', err.message);
        res.status(500).json({ msg: 'Failed to create video room.' });
    }
});

// GET /api/video/active-rooms/:supervisorId
router.get('/active-rooms/:supervisorId', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT vr.*, pg.group_name
             FROM video_rooms vr
             JOIN project_groups pg ON vr.group_id = pg.group_id
             WHERE vr.supervisor_id = $1 AND vr.is_active = TRUE
             ORDER BY vr.created_at DESC`,
            [req.params.supervisorId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Failed to fetch active rooms.' });
    }
});

// PUT /api/video/end-room/:roomId
router.put('/end-room/:roomId', async (req, res) => {
    try {
        await db.query('UPDATE video_rooms SET is_active = FALSE WHERE room_id = $1', [req.params.roomId]);
        res.json({ msg: 'Room ended.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Failed to end room.' });
    }
});

// Socket.IO setup function — called from index.js
function setupSocketIO(io) {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            socket.to(roomId).emit('user-joined', socket.id);
            console.log(`${socket.id} joined room ${roomId}`);
        });

        socket.on('offer', ({ roomId, offer }) => {
            socket.to(roomId).emit('offer', { offer, from: socket.id });
        });

        socket.on('answer', ({ roomId, answer }) => {
            socket.to(roomId).emit('answer', { answer, from: socket.id });
        });

        socket.on('ice-candidate', ({ roomId, candidate }) => {
            socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
        });

        socket.on('leave-room', (roomId) => {
            socket.to(roomId).emit('user-left', socket.id);
            socket.leave(roomId);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
}

module.exports = { router, setupSocketIO };
