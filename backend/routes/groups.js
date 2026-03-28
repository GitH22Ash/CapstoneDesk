const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// Endpoint: POST /api/groups/register
// Purpose: To register a new project group with 5 members and a group password.
router.post('/register', async (req, res) => {
    const { group_name, password, members } = req.body;

    // Validate the incoming data
    if (!group_name || !password || !members || members.length !== 5) {
        return res.status(400).json({ msg: 'Please provide a group name, password, and exactly 5 members.' });
    }

    try {
        // Check if group name already exists
        const existingGroup = await db.query('SELECT group_id FROM project_groups WHERE group_name = $1', [group_name]);
        if (existingGroup.rows.length > 0) {
            return res.status(400).json({ msg: 'A group with this name already exists.' });
        }

        // Check if any of the provided students are already in a group.
        const regNos = members.map(m => m.reg_no);
        const checkStudentQuery = 'SELECT student_reg_no FROM group_members WHERE student_reg_no = ANY($1::varchar[])';
        const existingStudents = await db.query(checkStudentQuery, [regNos]);

        if (existingStudents.rows.length > 0) {
            const existingRegNo = existingStudents.rows[0].student_reg_no;
            return res.status(400).json({ msg: `Student with registration number ${existingRegNo} is already in a group.` });
        }

        // Hash the group password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert the students into the 'students' table.
        for (const member of members) {
            const { name, reg_no, cgpa, email } = member;
            const studentInsertQuery = 'INSERT INTO students (reg_no, name, cgpa, email) VALUES ($1, $2, $3, $4) ON CONFLICT (reg_no) DO NOTHING';
            await db.query(studentInsertQuery, [reg_no, name, cgpa, email || null]);
        }

        // Insert the new group with password hash
        const groupInsertQuery = 'INSERT INTO project_groups (group_name, password_hash) VALUES ($1, $2) RETURNING group_id';
        const newGroup = await db.query(groupInsertQuery, [group_name, password_hash]);
        const groupId = newGroup.rows[0].group_id;

        // Link the members to the group
        for (const member of members) {
            const memberInsertQuery = 'INSERT INTO group_members (group_id, student_reg_no) VALUES ($1, $2)';
            await db.query(memberInsertQuery, [groupId, member.reg_no]);
        }

        // Create initial mark entries
        for (const member of members) {
            const marksInsertQuery = 'INSERT INTO marks (student_reg_no, group_id) VALUES ($1, $2)';
            await db.query(marksInsertQuery, [member.reg_no, groupId]);
        }

        res.status(201).json({ msg: 'Group registered successfully!', groupId });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Endpoint: POST /api/groups/login
// Purpose: Authenticate a group using group name and password, return group details.
router.post('/login', async (req, res) => {
    const { group_name, password } = req.body;

    if (!group_name || !password) {
        return res.status(400).json({ msg: 'Please provide group name and password.' });
    }

    try {
        // Find the group
        const groupResult = await db.query(
            'SELECT group_id, group_name, password_hash, assigned_supervisor_id FROM project_groups WHERE group_name = $1',
            [group_name]
        );

        if (groupResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid group name or password.' });
        }

        const group = groupResult.rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, group.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid group name or password.' });
        }

        // Get group members with their details and marks
        const membersResult = await db.query(
            `SELECT s.reg_no, s.name, s.cgpa, s.email, 
                    m.review1_marks, m.review2_marks, m.review3_marks, m.review4_marks
             FROM students s
             JOIN group_members gm ON s.reg_no = gm.student_reg_no
             LEFT JOIN marks m ON s.reg_no = m.student_reg_no AND gm.group_id = m.group_id
             WHERE gm.group_id = $1`,
            [group.group_id]
        );

        res.json({
            group_id: group.group_id,
            group_name: group.group_name,
            assigned_supervisor_id: group.assigned_supervisor_id || null,
            members: membersResult.rows
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Endpoint: PUT /api/groups/change-password
// Purpose: Authenticate a group using current password and update to new password.
router.put('/change-password', async (req, res) => {
    const { group_id, currentPassword, newPassword } = req.body;

    if (!group_id || !currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Please provide all required fields.' });
    }

    try {
        const groupResult = await db.query('SELECT password_hash FROM project_groups WHERE group_id = $1', [group_id]);
        if (groupResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Group not found.' });
        }

        const group = groupResult.rows[0];
        const isMatch = await bcrypt.compare(currentPassword, group.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid current password.' });
        }

        const salt = await bcrypt.genSalt(10);
        const new_password_hash = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE project_groups SET password_hash = $1 WHERE group_id = $2', [new_password_hash, group_id]);
        res.json({ msg: 'Password updated successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Endpoint: PUT /api/groups/change-name
// Purpose: Authenticate a group using current password and update group name.
router.put('/change-name', async (req, res) => {
    const { group_id, currentPassword, newGroupName } = req.body;

    if (!group_id || !currentPassword || !newGroupName) {
        return res.status(400).json({ msg: 'Please provide all required fields.' });
    }

    try {
        const groupResult = await db.query('SELECT password_hash FROM project_groups WHERE group_id = $1', [group_id]);
        if (groupResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Group not found.' });
        }

        const group = groupResult.rows[0];
        const isMatch = await bcrypt.compare(currentPassword, group.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid current password.' });
        }

        const nameCheck = await db.query('SELECT group_id FROM project_groups WHERE group_name = $1 AND group_id != $2', [newGroupName, group_id]);
        if (nameCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'Group name is already taken.' });
        }

        await db.query('UPDATE project_groups SET group_name = $1 WHERE group_id = $2', [newGroupName, group_id]);
        res.json({ msg: 'Group name updated successfully.', group_name: newGroupName });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
