const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const db = require('../db');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config: memory storage, 10MB limit, PDF/PPT only
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and PPT/PPTX files are allowed.'), false);
        }
    },
});

// POST /api/submissions/upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { group_id, uploaded_by } = req.body;

        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded.' });
        }
        if (!group_id || !uploaded_by) {
            return res.status(400).json({ msg: 'Group ID and uploader info are required.' });
        }

        // Verify group exists
        const groupCheck = await db.query('SELECT group_id FROM project_groups WHERE group_id = $1', [group_id]);
        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ msg: 'Group not found.' });
        }

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw',
                    folder: `capstonedesk/submissions/group_${group_id}`,
                    public_id: `${Date.now()}_${req.file.originalname}`,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // Determine file type
        const ext = req.file.originalname.split('.').pop().toLowerCase();

        // Save metadata to DB
        const insertResult = await db.query(
            `INSERT INTO submissions (group_id, file_name, file_url, file_type, file_size, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [group_id, req.file.originalname, uploadResult.secure_url, ext, req.file.size, uploaded_by]
        );

        res.status(201).json({
            msg: 'File uploaded successfully!',
            submission: insertResult.rows[0],
        });
    } catch (err) {
        console.error('Upload error:', err.message);
        if (err.message === 'Only PDF and PPT/PPTX files are allowed.') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).json({ msg: 'Failed to upload file. Please try again.' });
    }
});

// GET /api/submissions/group/:groupId
router.get('/group/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const result = await db.query(
            'SELECT * FROM submissions WHERE group_id = $1 ORDER BY uploaded_at DESC',
            [groupId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Failed to fetch submissions.' });
    }
});

// GET /api/submissions/supervisor — get submissions for all assigned groups
const auth = require('../middleware/auth');
router.get('/supervisor', auth, async (req, res) => {
    try {
        const supervisorId = req.supervisor.id;
        const result = await db.query(
            `SELECT s.*, pg.group_name, st.name as uploader_name
             FROM submissions s
             JOIN project_groups pg ON s.group_id = pg.group_id
             LEFT JOIN students st ON s.uploaded_by = st.reg_no
             WHERE pg.assigned_supervisor_id = $1
             ORDER BY s.uploaded_at DESC`,
            [supervisorId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Failed to fetch submissions.' });
    }
});

// DELETE /api/submissions/:submissionId
router.delete('/:submissionId', async (req, res) => {
    try {
        const { submissionId } = req.params;
        
        const check = await db.query('SELECT * FROM submissions WHERE submission_id = $1', [submissionId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ msg: 'Submission not found.' });
        }
        
        // Extract public_id from file_url to delete from cloudinary
        const fileUrl = check.rows[0].file_url;
        try {
            const urlParts = fileUrl.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');
            if (uploadIndex !== -1) {
                // skip upload/vXXXXXX/ and take the rest without extension
                const pathParts = urlParts.slice(uploadIndex + 2);
                const pathString = pathParts.join('/');
                const publicId = pathString.substring(0, pathString.lastIndexOf('.'));
                
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
                }
            }
        } catch (cloudinaryErr) {
            console.error('Failed to delete from Cloudinary:', cloudinaryErr.message);
        }

        await db.query('DELETE FROM submissions WHERE submission_id = $1', [submissionId]);
        
        res.json({ msg: 'Submission deleted successfully.' });
    } catch (err) {
        console.error('Delete error:', err.message);
        res.status(500).json({ msg: 'Failed to delete submission.' });
    }
});

// Multer error handler
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ msg: 'File size exceeds 10MB limit.' });
        }
        return res.status(400).json({ msg: err.message });
    }
    next(err);
});

module.exports = router;
