const express = require('express');
const router = express.Router();
const db = require('../db');
const authorize = require('../middleware/authorize');

// GET /api/activity
// Fetch recent activity logs (limited to 50)
router.get('/', authorize(['admin', 'supervisor', 'student']), async (req, res) => {
  try {
    const { role, user_id } = req.user;
    
    let query = `
      SELECT a.*, u.name as user_name
      FROM activity_log a
      LEFT JOIN users u ON a.user_id = u.id
    `;
    const params = [];

    // Filter by role if necessary
    // Admin sees all.
    // Supervisors see activity related to their groups (for now we can just show all public activity or filter).
    // Let's just return a generic activity feed for now, prioritizing global visibility for demo purposes,
    // or filter by group if student.
    if (role === 'student') {
      // Find student's group
      const groupRes = await db.query('SELECT group_id FROM students WHERE user_id = $1', [user_id]);
      if (groupRes.rows.length > 0 && groupRes.rows[0].group_id) {
        query += ` WHERE a.group_id = $1 OR a.group_id IS NULL`;
        params.push(groupRes.rows[0].group_id);
      } else {
        query += ` WHERE a.user_id = $1 OR a.group_id IS NULL`;
        params.push(user_id);
      }
    } else if (role === 'supervisor') {
      // Find supervisor's assigned groups
      const supRes = await db.query('SELECT emp_id FROM supervisors WHERE user_id = $1', [user_id]);
      if (supRes.rows.length > 0) {
        const empId = supRes.rows[0].emp_id;
        query += ` 
          WHERE a.group_id IN (SELECT group_id FROM groups WHERE assigned_supervisor_id = $1)
          OR a.user_id = $2 OR a.group_id IS NULL
        `;
        params.push(empId, user_id);
      }
    }

    query += ` ORDER BY a.created_at DESC LIMIT 20`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch activity error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
