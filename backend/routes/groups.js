const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const authorize = require('../middleware/authorize');

// @route   GET /api/groups/my-group
// @desc    Get the current student's group and members
// @access  Private (Student)
router.get('/my-group', authorize(['student']), async (req, res) => {
    try {
        // Find the student's reg_no based on user_id
        const studentRes = await db.query('SELECT reg_no FROM students WHERE user_id = $1', [req.user.id]);
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ msg: 'Student profile not found.' });
        }
        const regNo = studentRes.rows[0].reg_no;

        // Find the group they belong to
        const groupRes = await db.query(`
            SELECT pg.group_id, pg.group_name, pg.assigned_supervisor_id,
                   p.id as project_id, p.title as project_title, p.status as project_status
            FROM project_groups pg
            JOIN group_members gm ON pg.group_id = gm.group_id
            LEFT JOIN projects p ON pg.group_id = p.group_id
            WHERE gm.student_reg_no = $1
        `, [regNo]);

        if (groupRes.rows.length === 0) {
            return res.status(404).json({ msg: 'You are not in a group yet.' });
        }

        const group = groupRes.rows[0];

        // Get all members of this group
        const membersRes = await db.query(`
            SELECT s.reg_no, s.name, s.cgpa, s.email, u.avatar_url
            FROM students s
            JOIN group_members gm ON s.reg_no = gm.student_reg_no
            LEFT JOIN users u ON s.user_id = u.id
            WHERE gm.group_id = $1
        `, [group.group_id]);

        group.members = membersRes.rows;

        // Get supervisor details if assigned
        if (group.assigned_supervisor_id) {
            const supRes = await db.query('SELECT name, email FROM supervisors WHERE emp_id = $1', [group.assigned_supervisor_id]);
            if (supRes.rows.length > 0) {
                group.supervisor = supRes.rows[0];
            }
        }

        res.json(group);
    } catch (err) {
        console.error('Error fetching my-group:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private (Student)
router.post('/', authorize(['student']), async (req, res) => {
    const { group_name, password } = req.body;

    if (!group_name || !password) {
        return res.status(400).json({ msg: 'Please provide a group name and password.' });
    }

    try {
        await db.query('BEGIN');

        // Check if student already in a group
        const studentRes = await db.query('SELECT reg_no FROM students WHERE user_id = $1', [req.user.id]);
        if (studentRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ msg: 'Student profile not found.' });
        }
        const regNo = studentRes.rows[0].reg_no;

        const checkMember = await db.query('SELECT group_id FROM group_members WHERE student_reg_no = $1', [regNo]);
        if (checkMember.rows.length > 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ msg: 'You are already in a group.' });
        }

        // Check if group name exists
        const existingGroup = await db.query('SELECT group_id FROM project_groups WHERE group_name = $1', [group_name]);
        if (existingGroup.rows.length > 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ msg: 'A group with this name already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create group
        const groupRes = await db.query(
            'INSERT INTO project_groups (group_name, password_hash) VALUES ($1, $2) RETURNING group_id',
            [group_name, password_hash]
        );
        const groupId = groupRes.rows[0].group_id;

        // Add creator as member
        await db.query('INSERT INTO group_members (group_id, student_reg_no) VALUES ($1, $2)', [groupId, regNo]);
        await db.query('INSERT INTO marks (student_reg_no, group_id) VALUES ($1, $2)', [regNo, groupId]);

        await db.query('COMMIT');
        res.status(201).json({ msg: 'Group created successfully.', groupId });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error creating group:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/groups/join
// @desc    Join an existing group
// @access  Private (Student)
router.post('/join', authorize(['student']), async (req, res) => {
    const { group_name, password } = req.body;

    if (!group_name || !password) {
        return res.status(400).json({ msg: 'Please provide group name and password.' });
    }

    try {
        await db.query('BEGIN');

        // Get student
        const studentRes = await db.query('SELECT reg_no FROM students WHERE user_id = $1', [req.user.id]);
        if (studentRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ msg: 'Student profile not found.' });
        }
        const regNo = studentRes.rows[0].reg_no;

        // Ensure not already in a group
        const checkMember = await db.query('SELECT group_id FROM group_members WHERE student_reg_no = $1', [regNo]);
        if (checkMember.rows.length > 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ msg: 'You are already in a group.' });
        }

        // Find group
        const groupRes = await db.query('SELECT group_id, password_hash FROM project_groups WHERE group_name = $1', [group_name]);
        if (groupRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ msg: 'Group not found.' });
        }

        const group = groupRes.rows[0];

        // Validate password
        const isMatch = await bcrypt.compare(password, group.password_hash);
        if (!isMatch) {
            await db.query('ROLLBACK');
            return res.status(400).json({ msg: 'Invalid group password.' });
        }

        // Check member limit (5)
        const memberCountRes = await db.query('SELECT COUNT(*) FROM group_members WHERE group_id = $1', [group.group_id]);
        if (parseInt(memberCountRes.rows[0].count) >= 5) {
            await db.query('ROLLBACK');
            return res.status(400).json({ msg: 'Group is full (maximum 5 members).' });
        }

        // Join group
        await db.query('INSERT INTO group_members (group_id, student_reg_no) VALUES ($1, $2)', [group.group_id, regNo]);
        await db.query('INSERT INTO marks (student_reg_no, group_id) VALUES ($1, $2)', [regNo, group.group_id]);

        await db.query('COMMIT');
        res.json({ msg: 'Successfully joined group.', group_id: group.group_id });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error joining group:', err.message);
        res.status(500).send('Server error');
    }
});

// Note: Legacy /register and /login endpoints were removed as part of Phase 1 
// unified auth migration. All students now login individually.

module.exports = router;
