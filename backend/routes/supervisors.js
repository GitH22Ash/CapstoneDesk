const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const authorize = require('../middleware/authorize');

// Helper to get supervisor's emp_id from their user_id
const getSupervisorEmpId = async (userId) => {
    const res = await db.query('SELECT emp_id FROM supervisors WHERE user_id = $1', [userId]);
    return res.rows.length > 0 ? res.rows[0].emp_id : null;
};

// @route   GET api/supervisors/preferences
// @desc    Get supervisor's current preferences
// @access  Private (Supervisor)
router.get('/preferences', authorize(['supervisor']), async (req, res) => {
    try {
        const empId = await getSupervisorEmpId(req.user.id);
        if (!empId) return res.status(404).json({ msg: 'Supervisor profile not found' });

        const result = await db.query('SELECT max_groups FROM supervisors WHERE emp_id = $1', [empId]);
        res.json({ max_groups: result.rows[0].max_groups || 3 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/supervisors/preferences
// @desc    Update supervisor's group preference
// @access  Private (Supervisor)
router.put('/preferences', authorize(['supervisor']), async (req, res) => {
    const { max_groups } = req.body;
    if (!max_groups || max_groups < 1) {
        return res.status(400).json({ msg: 'Please specify a valid number of groups (minimum 1)' });
    }

    try {
        const empId = await getSupervisorEmpId(req.user.id);
        if (!empId) return res.status(404).json({ msg: 'Supervisor profile not found' });

        await db.query('UPDATE supervisors SET max_groups = $1 WHERE emp_id = $2', [max_groups, empId]);
        res.json({ msg: 'Preferences updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/supervisors/my-groups
// @desc    Get all groups assigned to the logged-in supervisor
// @access  Private (Supervisor)
router.get('/my-groups', authorize(['supervisor']), async (req, res) => {
    try {
        const empId = await getSupervisorEmpId(req.user.id);
        if (!empId) return res.status(404).json({ msg: 'Supervisor profile not found' });

        // Get groups + project info if available
        const groupsResult = await db.query(`
            SELECT pg.group_id, pg.group_name, p.title as project_title, p.status as project_status, p.id as project_id
            FROM project_groups pg
            LEFT JOIN projects p ON pg.group_id = p.group_id
            WHERE pg.assigned_supervisor_id = $1
        `, [empId]);

        const groups = groupsResult.rows;

        // Get members and marks for each group
        for (let group of groups) {
            const membersResult = await db.query(`
                SELECT s.reg_no, s.name, s.cgpa, s.email,
                       m.review1_marks, m.review2_marks, m.review3_marks, m.review4_marks
                FROM students s
                JOIN group_members gm ON s.reg_no = gm.student_reg_no
                LEFT JOIN marks m ON s.reg_no = m.student_reg_no AND gm.group_id = m.group_id
                WHERE gm.group_id = $1
            `, [group.group_id]);
            group.members = membersResult.rows;

            // Get proposal if project exists
            if (group.project_id) {
                const propResult = await db.query(`
                    SELECT id, status, created_at FROM proposals WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1
                `, [group.project_id]);
                group.proposal = propResult.rows.length > 0 ? propResult.rows[0] : null;
            }
        }

        res.json(groups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/supervisors/my-groups/:groupId
// @desc    Get details of a specific assigned group
// @access  Private (Supervisor)
router.get('/my-groups/:groupId', authorize(['supervisor']), async (req, res) => {
    try {
        const { groupId } = req.params;
        const empId = await getSupervisorEmpId(req.user.id);
        if (!empId) return res.status(404).json({ msg: 'Supervisor profile not found' });

        // Verify assignment
        const verifyRes = await db.query('SELECT group_id FROM project_groups WHERE group_id = $1 AND assigned_supervisor_id = $2', [groupId, empId]);
        if (verifyRes.rows.length === 0) return res.status(403).json({ msg: 'Not authorized for this group' });

        // Project
        const projectRes = await db.query('SELECT * FROM projects WHERE group_id = $1', [groupId]);
        const project = projectRes.rows.length > 0 ? projectRes.rows[0] : null;

        // Proposals
        let proposals = [];
        if (project) {
            const propRes = await db.query('SELECT * FROM proposals WHERE project_id = $1 ORDER BY created_at DESC', [project.id]);
            proposals = propRes.rows;
        }

        res.json({ project, proposals });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/supervisors/proposals/:proposalId/review
// @desc    Approve or reject a proposal
// @access  Private (Supervisor)
router.post('/proposals/:proposalId/review', authorize(['supervisor']), async (req, res) => {
    const { status, feedback } = req.body;
    const { proposalId } = req.params;

    if (!['approved', 'rejected', 'changes_requested'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status' });
    }

    try {
        await db.query('BEGIN');

        // Verify proposal exists
        const propRes = await db.query(`
            SELECT p.id, p.project_id, pr.group_id
            FROM proposals p
            JOIN projects pr ON p.project_id = pr.id
            WHERE p.id = $1
        `, [proposalId]);

        if (propRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ msg: 'Proposal not found' });
        }

        const proposal = propRes.rows[0];

        // Update proposal
        await db.query(`
            UPDATE proposals 
            SET status = $1, feedback = $2, reviewed_by = $3, reviewed_at = NOW() 
            WHERE id = $4
        `, [status, feedback || null, req.user.id, proposalId]);

        // Update project status if approved
        if (status === 'approved') {
            await db.query(`UPDATE projects SET status = 'active', updated_at = NOW() WHERE id = $1`, [proposal.project_id]);
        }

        // Log activity
        await db.query(`
            INSERT INTO activity_log (group_id, user_id, action, details)
            VALUES ($1, $2, 'PROPOSAL_REVIEWED', $3)
        `, [proposal.group_id, req.user.id, JSON.stringify({ status })]);

        await db.query('COMMIT');
        res.json({ msg: 'Proposal reviewed successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/supervisors/marks
// @desc    Update marks for a student
// @access  Private (Supervisor)
router.put('/marks', authorize(['supervisor']), async (req, res) => {
    const { student_reg_no, group_id, review_number, marks } = req.body;
    const reviewColumn = `review${review_number}_marks`;

    if (![1, 2, 3, 4].includes(review_number)) {
        return res.status(400).json({ msg: 'Invalid review number.' });
    }

    try {
        const empId = await getSupervisorEmpId(req.user.id);
        
        // Verify supervisor owns this group
        const groupCheck = await db.query('SELECT assigned_supervisor_id FROM project_groups WHERE group_id = $1', [group_id]);
        if (groupCheck.rows.length === 0 || groupCheck.rows[0].assigned_supervisor_id !== empId) {
            return res.status(403).json({ msg: 'Not authorized for this group' });
        }

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

        // Log activity
        await db.query(`
            INSERT INTO activity_log (group_id, user_id, action, details)
            VALUES ($1, $2, 'MARKS_UPDATED', $3)
        `, [group_id, req.user.id, JSON.stringify({ student_reg_no, review_number, marks })]);

        res.json({ msg: 'Marks updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
