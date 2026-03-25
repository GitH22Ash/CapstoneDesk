DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS project_groups CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS supervisors CASCADE;

CREATE TABLE supervisors (
    emp_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    max_groups INT DEFAULT 3
);

CREATE TABLE students (
    reg_no VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cgpa NUMERIC(4, 2) NOT NULL,
    email VARCHAR(100)
);

CREATE TABLE project_groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    assigned_supervisor_id VARCHAR(50),
    FOREIGN KEY (assigned_supervisor_id) REFERENCES supervisors(emp_id) ON DELETE SET NULL
);

CREATE TABLE group_members (
    group_id INT NOT NULL,
    student_reg_no VARCHAR(50) NOT NULL UNIQUE,
    PRIMARY KEY (group_id, student_reg_no),
    FOREIGN KEY (group_id) REFERENCES project_groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (student_reg_no) REFERENCES students(reg_no) ON DELETE CASCADE
);

CREATE TABLE marks (
    mark_id SERIAL PRIMARY KEY,
    student_reg_no VARCHAR(50) NOT NULL,
    group_id INT NOT NULL,
    review1_marks INT DEFAULT 0,
    review2_marks INT DEFAULT 0,
    review3_marks INT DEFAULT 0,
    review4_marks INT DEFAULT 0,
    FOREIGN KEY (student_reg_no) REFERENCES students(reg_no) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES project_groups(group_id) ON DELETE CASCADE
);

CREATE TABLE submissions (
    submission_id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    file_size INT NOT NULL,
    uploaded_by VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'submitted'
);

CREATE TABLE video_rooms (
    room_id VARCHAR(100) PRIMARY KEY,
    group_id INT NOT NULL REFERENCES project_groups(group_id) ON DELETE CASCADE,
    supervisor_id VARCHAR(50) NOT NULL REFERENCES supervisors(emp_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_group_supervisor ON project_groups(assigned_supervisor_id);
CREATE INDEX idx_submissions_group ON submissions(group_id);
CREATE INDEX idx_video_rooms_active ON video_rooms(is_active);