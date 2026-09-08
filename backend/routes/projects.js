const express = require('express');
const router = express.Router();
const db = require('../db');
const authorize = require('../middleware/authorize');

// @route   GET /api/projects/my-project
// @desc    Get the current group's project and proposal details
// @access  Private (Student)
router.get('/my-project', authorize(['student']), async (req, res) => {
    try {
        // Find the student's group
        const groupRes = await db.query(`
            SELECT gm.group_id 
            FROM group_members gm 
            JOIN students s ON gm.student_reg_no = s.reg_no 
            WHERE s.user_id = $1
        `, [req.user.id]);

        if (groupRes.rows.length === 0) {
            return res.status(404).json({ msg: 'You are not part of any group.' });
        }

        const groupId = groupRes.rows[0].group_id;

        // Fetch project
        const projectRes = await db.query(`
            SELECT id, title, abstract, technology_stack, category, status, created_at 
            FROM projects WHERE group_id = $1
        `, [groupId]);

        if (projectRes.rows.length === 0) {
            return res.status(404).json({ msg: 'No project found for your group.' });
        }

        const project = projectRes.rows[0];

        // Fetch proposals for this project
        const proposalRes = await db.query(`
            SELECT id, document_url, status, feedback, created_at
            FROM proposals WHERE project_id = $1
            ORDER BY created_at DESC
        `, [project.id]);

        project.proposals = proposalRes.rows;

        res.json(project);
    } catch (err) {
        console.error('Fetch project error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/projects
// @desc    Create a new project for the group
// @access  Private (Student)
router.post('/', authorize(['student']), async (req, res) => {
    const { title, abstract, technology_stack, category } = req.body;

    if (!title || !abstract) {
        return res.status(400).json({ msg: 'Please provide at least a project title and abstract.' });
    }

    try {
        // Find the student's group
        const groupRes = await db.query(`
            SELECT gm.group_id 
            FROM group_members gm 
            JOIN students s ON gm.student_reg_no = s.reg_no 
            WHERE s.user_id = $1
        `, [req.user.id]);

        if (groupRes.rows.length === 0) {
            return res.status(404).json({ msg: 'You must join a group before creating a project.' });
        }

        const groupId = groupRes.rows[0].group_id;

        // Check if group already has a project
        const checkProject = await db.query('SELECT id FROM projects WHERE group_id = $1', [groupId]);
        if (checkProject.rows.length > 0) {
            return res.status(400).json({ msg: 'Your group already has a registered project.' });
        }

        // Insert project
        const projectRes = await db.query(`
            INSERT INTO projects (group_id, title, abstract, technology_stack, category)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [groupId, title, abstract, technology_stack, category]);

        // Log activity
        await db.query(`
            INSERT INTO activity_log (group_id, user_id, action, details)
            VALUES ($1, $2, 'PROJECT_CREATED', $3)
        `, [groupId, req.user.id, JSON.stringify({ title })]);

        res.status(201).json(projectRes.rows[0]);
    } catch (err) {
        console.error('Create project error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/projects/proposals
// @desc    Submit a proposal document for the project
// @access  Private (Student)
router.post('/proposals', authorize(['student']), async (req, res) => {
    const { document_url } = req.body;

    if (!document_url) {
        return res.status(400).json({ msg: 'Please provide a document URL.' });
    }

    try {
        // Find the student's project
        const groupRes = await db.query(`
            SELECT p.id as project_id, p.group_id 
            FROM group_members gm 
            JOIN students s ON gm.student_reg_no = s.reg_no 
            JOIN projects p ON gm.group_id = p.group_id
            WHERE s.user_id = $1
        `, [req.user.id]);

        if (groupRes.rows.length === 0) {
            return res.status(404).json({ msg: 'You must register a project before submitting a proposal.' });
        }

        const { project_id, group_id } = groupRes.rows[0];

        // Insert proposal
        const proposalRes = await db.query(`
            INSERT INTO proposals (project_id, document_url, submitted_by)
            VALUES ($1, $2, $3) RETURNING *
        `, [project_id, document_url, req.user.id]);

        // Update project status
        await db.query(`UPDATE projects SET status = 'proposal_submitted', updated_at = NOW() WHERE id = $1`, [project_id]);

        // Log activity
        await db.query(`
            INSERT INTO activity_log (group_id, user_id, action, details)
            VALUES ($1, $2, 'PROPOSAL_SUBMITTED', $3)
        `, [group_id, req.user.id, JSON.stringify({ proposal_id: proposalRes.rows[0].id })]);

        res.status(201).json(proposalRes.rows[0]);
    } catch (err) {
        console.error('Submit proposal error:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
