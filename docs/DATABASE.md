# Database Schema

The PostgreSQL database for CapstoneDesk is structured to support relational data between users, roles, projects, and activities.

## Core Tables

### 1. `users`
The centralized authentication table.
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password_hash` (String)
- `role` (Enum: `student`, `supervisor`, `admin`)
- `name` (String)
- `created_at` (Timestamp)

### 2. `students`
- `reg_no` (String, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`)
- `group_id` (UUID, Foreign Key -> `groups.id`, Nullable)

### 3. `supervisors`
- `emp_id` (String, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`)
- `preferences` (JSONB)

### 4. `groups`
Represents a team of students working on a project.
- `id` (UUID, Primary Key)
- `group_name` (String, Unique)
- `password_hash` (String) - For students to join the group.
- `assigned_supervisor_id` (String, Foreign Key -> `supervisors.emp_id`)

### 5. `projects`
1:1 relation with `groups`. Holds the current status of the capstone project.
- `id` (UUID, Primary Key)
- `group_id` (UUID, Foreign Key -> `groups.id`)
- `title` (String)
- `description` (Text)
- `status` (Enum: `draft`, `proposal_submitted`, `proposal_rejected`, `active`, `completed`)

### 6. `proposals`
Tracks formal project proposals submitted to supervisors.
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key -> `projects.id`)
- `content` (Text)
- `status` (Enum: `pending`, `approved`, `rejected`, `changes_requested`)
- `feedback` (Text)

### 7. `activity_log`
Tracks key events for the Activity Feed.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`)
- `group_id` (UUID, Foreign Key -> `groups.id`)
- `action` (String) - E.g., "created a group", "submitted a proposal".
- `created_at` (Timestamp)
