const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authorize = require('../middleware/authorize');

// Helper to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (All roles)
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        // Check for user in unified table
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = rows[0];

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ msg: 'Account is deactivated. Please contact an administrator.' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = generateToken(user);

        // Strip password hash from response
        const { password_hash, ...userData } = user;

        res.json({
            token,
            user: userData
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, reg_no, cgpa } = req.body;

        // Currently only allow student registration
        if (role !== 'student') {
            return res.status(403).json({ msg: 'Only students can self-register' });
        }

        if (!name || !email || !password || !reg_no || !cgpa) {
            return res.status(400).json({ msg: 'Please enter all required fields' });
        }

        // Check if user email already exists
        const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // Check if student reg_no already exists
        const regCheck = await db.query('SELECT reg_no FROM students WHERE reg_no = $1', [reg_no]);
        if (regCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'Student with this registration number already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Transaction for inserting into users and students table
        await db.query('BEGIN');

        // Insert into users
        const userResult = await db.query(
            `INSERT INTO users (email, password_hash, role, name) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [email, hash, role, name]
        );
        const user = userResult.rows[0];

        // Insert into students
        await db.query(
            `INSERT INTO students (reg_no, name, cgpa, email, user_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [reg_no, name, cgpa, email, user.id]
        );

        await db.query('COMMIT');

        const token = generateToken(user);
        const { password_hash, ...userData } = user;

        res.json({
            token,
            user: userData
        });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Registration error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authorize(), async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, email, role, name, avatar_url, is_active, created_at FROM users WHERE id = $1', [req.user.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Fetch me error:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
