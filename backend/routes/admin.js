const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Endpoint: POST /api/admin/login
// Purpose: Authenticate admin using env-based credentials
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide email and password.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail || password !== adminPassword) {
        return res.status(400).json({ msg: 'Invalid admin credentials.' });
    }

    // Generate an admin JWT token
    const payload = { admin: true };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.json({ token, msg: 'Admin login successful.' });
    });
});

// Endpoint: GET /api/admin/supervisors
// Purpose: Get all registered supervisors with their current group counts
router.get('/supervisors', async (req, res) => {
    try {
        const query = `
            SELECT
                s.emp_id,
                s.name,
                s.email,
                s.max_groups,
                COUNT(pg.group_id) as current_groups
            FROM supervisors s
            LEFT JOIN project_groups pg ON s.emp_id = pg.assigned_supervisor_id
            GROUP BY s.emp_id, s.name, s.email, s.max_groups
            ORDER BY s.name
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Endpoint: GET /api/admin/groups
// Purpose: Get all registered groups with their assignment status
router.get('/groups', async (req, res) => {
    try {
        const query = `
            SELECT 
                pg.group_id,
                pg.group_name,
                pg.assigned_supervisor_id,
                s.name as supervisor_name,
                COUNT(gm.student_reg_no) as member_count
            FROM project_groups pg
            LEFT JOIN supervisors s ON pg.assigned_supervisor_id = s.emp_id
            LEFT JOIN group_members gm ON pg.group_id = gm.group_id
            GROUP BY pg.group_id, pg.group_name, pg.assigned_supervisor_id, s.name
            ORDER BY pg.group_name
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Endpoint: PUT /api/admin/groups/:groupId/assign
// Purpose: Manually assign a specific group to a specific supervisor
router.put('/groups/:groupId/assign', async (req, res) => {
    const { groupId } = req.params;
    const { supervisorId } = req.body;

    try {
        const supervisorCheck = await db.query(`
            SELECT
                s.emp_id,
                s.max_groups,
                COUNT(pg.group_id) as current_groups
            FROM supervisors s
            LEFT JOIN project_groups pg ON s.emp_id = pg.assigned_supervisor_id
            WHERE s.emp_id = $1
            GROUP BY s.emp_id, s.max_groups
        `, [supervisorId]);

        if (supervisorCheck.rows.length === 0) {
            return res.status(404).json({ msg: 'Supervisor not found' });
        }

        const supervisor = supervisorCheck.rows[0];
        if (supervisor.current_groups >= supervisor.max_groups) {
            return res.status(400).json({
                msg: `Supervisor has reached maximum capacity (${supervisor.max_groups} groups)`
            });
        }

        const groupCheck = await db.query('SELECT group_id FROM project_groups WHERE group_id = $1', [groupId]);
        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        await db.query(
            'UPDATE project_groups SET assigned_supervisor_id = $1 WHERE group_id = $2',
            [supervisorId, groupId]
        );

        res.json({ msg: 'Group assigned successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Endpoint: PUT /api/admin/groups/:groupId/unassign
// Purpose: Unassign a group from its current supervisor
router.put('/groups/:groupId/unassign', async (req, res) => {
    const { groupId } = req.params;

    try {
        await db.query(
            'UPDATE project_groups SET assigned_supervisor_id = NULL WHERE group_id = $1',
            [groupId]
        );
        res.json({ msg: 'Group unassigned successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Endpoint: POST /api/admin/supervisors/create
// Purpose: To create a new supervisor account. Admin-only.
router.post('/supervisors/create', async (req, res) => {
    const { emp_id, name, email, password } = req.body;

    if (!emp_id || !name || !email || !password) {
        return res.status(400).json({ msg: 'Please fill out all fields.' });
    }

    try {
        // Check for existing supervisor
        const existing = await db.query(
            'SELECT emp_id FROM supervisors WHERE email = $1 OR emp_id = $2',
            [email, emp_id]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ msg: 'Supervisor with this email or employee ID already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO supervisors (emp_id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
            [emp_id, name, email, password_hash]
        );
        
        res.status(201).json({ msg: 'Supervisor created successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Endpoint: POST /api/admin/assign-groups
// Purpose: Automatically assign all unassigned groups to supervisors
router.post('/assign-groups', async (req, res) => {
    try {
        const groupsRes = await db.query('SELECT group_id FROM project_groups WHERE assigned_supervisor_id IS NULL');
        
        const supervisorsRes = await db.query(`
            SELECT
                s.emp_id,
                s.max_groups,
                COUNT(pg.group_id) as current_groups
            FROM supervisors s
            LEFT JOIN project_groups pg ON s.emp_id = pg.assigned_supervisor_id
            GROUP BY s.emp_id, s.max_groups
        `);
        
        let groups = groupsRes.rows;
        const supervisors = supervisorsRes.rows;

        if (supervisors.length === 0) {
            return res.status(400).json({ msg: 'No supervisors available to assign groups.' });
        }
        if (groups.length === 0) {
            return res.status(200).json({ msg: 'No unassigned groups to assign.' });
        }

        const availableSupervisors = supervisors.filter(s => s.current_groups < s.max_groups);
        
        if (availableSupervisors.length === 0) {
            return res.status(400).json({ msg: 'All supervisors have reached their maximum group capacity.' });
        }

        const supervisorPool = [];
        availableSupervisors.forEach(supervisor => {
            const remainingCapacity = supervisor.max_groups - supervisor.current_groups;
            for (let i = 0; i < remainingCapacity; i++) {
                supervisorPool.push(supervisor.emp_id);
            }
        });

        groups.sort(() => 0.5 - Math.random());
        supervisorPool.sort(() => 0.5 - Math.random());

        let poolIndex = 0;
        let assignedCount = 0;
        
        for (const group of groups) {
            if (poolIndex >= supervisorPool.length) break;
            
            const supervisorId = supervisorPool[poolIndex];
            await db.query(
                'UPDATE project_groups SET assigned_supervisor_id = $1 WHERE group_id = $2',
                [supervisorId, group.group_id]
            );
            
            assignedCount++;
            poolIndex++;
        }

        const remainingGroups = groups.length - assignedCount;
        let message = `${assignedCount} groups assigned successfully.`;
        if (remainingGroups > 0) {
            message += ` ${remainingGroups} groups remain unassigned due to supervisor capacity limits.`;
        }
        
        res.status(200).json({ msg: message });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
