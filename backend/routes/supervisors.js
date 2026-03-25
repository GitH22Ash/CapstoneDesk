const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

// @route   PUT api/supervisors/preferences
// @desc    Update supervisor's group preference
// @access  Private
router.put('/preferences', auth, async (req, res) => {
    const { max_groups } = req.body;
    const supervisorId = req.supervisor.id;

    if (!max_groups || max_groups < 1) {
        return res.status(400).json({ msg: 'Please specify a valid number of groups (minimum 1)' });
    }

    try {
        await db.query(
            'UPDATE supervisors SET max_groups = $1 WHERE emp_id = $2',
            [max_groups, supervisorId]
        );
        res.json({ msg: 'Preferences updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/supervisors/preferences
// @desc    Get supervisor's current preferences
// @access  Private
router.get('/preferences', auth, async (req, res) => {
    const supervisorId = req.supervisor.id;

    try {
        const result = await db.query(
            'SELECT max_groups FROM supervisors WHERE emp_id = $1',
            [supervisorId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Supervisor not found' });
        }

        res.json({ max_groups: result.rows[0].max_groups || 3 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/supervisors/login
// @desc    Authenticate supervisor & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM supervisors WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const supervisor = result.rows[0];
        const isMatch = await bcrypt.compare(password, supervisor.password_hash);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            supervisor: {
                id: supervisor.emp_id,
                name: supervisor.name,
            },
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/supervisors/my-groups
// @desc    Get all groups assigned to the logged-in supervisor
// @access  Private
router.get('/my-groups', auth, async (req, res) => {
    try {
        const supervisorId = req.supervisor.id;
        const groupsResult = await db.query(
            `SELECT pg.group_id, pg.group_name
             FROM project_groups pg
             WHERE pg.assigned_supervisor_id = $1`,
            [supervisorId]
        );

        const groups = groupsResult.rows;

        for (let group of groups) {
            const membersResult = await db.query(
                `SELECT s.reg_no, s.name, s.cgpa, s.email,
                        m.review1_marks, m.review2_marks, m.review3_marks, m.review4_marks
                 FROM students s
                 JOIN group_members gm ON s.reg_no = gm.student_reg_no
                 LEFT JOIN marks m ON s.reg_no = m.student_reg_no AND gm.group_id = m.group_id
                 WHERE gm.group_id = $1`,
                [group.group_id]
            );
            group.members = membersResult.rows;
        }

        res.json(groups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/supervisors/marks
// @desc    Update marks for a student
// @access  Private
router.put('/marks', auth, async (req, res) => {
    const { student_reg_no, group_id, review_number, marks } = req.body;
    const reviewColumn = `review${review_number}_marks`;

    if (![1, 2, 3, 4].includes(review_number)) {
        return res.status(400).json({ msg: 'Invalid review number.' });
    }

    try {
        const existingMark = await db.query(
            'SELECT * FROM marks WHERE student_reg_no = $1 AND group_id = $2',
            [student_reg_no, group_id]
        );

        if (existingMark.rows.length > 0) {
            await db.query(
                `UPDATE marks SET ${reviewColumn} = $1 WHERE student_reg_no = $2 AND group_id = $3`,
                [marks, student_reg_no, group_id]
            );
        } else {
            await db.query(
                `INSERT INTO marks (student_reg_no, group_id, ${reviewColumn}) VALUES ($1, $2, $3)`,
                [student_reg_no, group_id, marks]
            );
        }
        res.json({ msg: 'Marks updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/supervisors/change-password
// @desc    Change supervisor's password
// @access  Private
router.put('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const supervisorId = req.supervisor.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Please provide current and new password.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'New password must be at least 6 characters.' });
    }

    try {
        // Get current password hash
        const result = await db.query('SELECT password_hash FROM supervisors WHERE emp_id = $1', [supervisorId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Supervisor not found.' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE supervisors SET password_hash = $1 WHERE emp_id = $2', [newHash, supervisorId]);
        res.json({ msg: 'Password changed successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
