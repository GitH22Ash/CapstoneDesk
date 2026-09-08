require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcryptjs');

async function runMigrations() {
    console.log("Starting migrations...");
    try {
        const sqlPath = path.join(__dirname, 'migrations', '001_phase1.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await db.query(sql);
        console.log("Phase 1 migrations executed successfully!");
        
        // Also ensure admin exists in users table if they are in .env
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            const adminEmail = process.env.ADMIN_EMAIL;
            const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            
            // Insert or update admin in users table
            await db.query(`
                INSERT INTO users (email, password_hash, role, name)
                VALUES ($1, $2, 'admin', 'System Administrator')
                ON CONFLICT (email) DO UPDATE 
                SET password_hash = $2, role = 'admin'
            `, [adminEmail, hash]);
            console.log("Admin user seeded.");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
}

runMigrations();
