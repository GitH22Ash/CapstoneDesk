# API Reference

## Authentication
- `POST /api/auth/login` - Authenticate and receive a JWT.
- `POST /api/auth/register` - Student self-registration.
- `GET /api/auth/me` - Fetch authenticated user details.

## Admin Routes (Protected: `['admin']`)
- `GET /api/admin/supervisors` - List all supervisors.
- `GET /api/admin/students` - List all students.
- `GET /api/admin/groups` - List all groups.
- `POST /api/admin/supervisors/create` - Manually create a supervisor account.
- `POST /api/admin/upload-students` - Bulk import students via CSV/XLSX.
- `POST /api/admin/upload-supervisors` - Bulk import supervisors via CSV/XLSX.
- `POST /api/admin/auto-create-groups` - Randomly distribute unassigned students into groups of up to 5.
- `POST /api/admin/assign-groups` - Auto-assign unassigned groups to supervisors in a round-robin fashion.
- `PUT /api/admin/groups/:groupId/assign` - Manually assign a group to a supervisor.

## Supervisor Routes (Protected: `['supervisor']`)
- `GET /api/supervisors/my-groups` - List assigned groups.
- `GET /api/supervisors/my-groups/:groupId` - View detailed group info (proposals, members).
- `POST /api/supervisors/proposals/:proposalId/review` - Approve, reject, or request changes on a project proposal.
- `PUT /api/supervisors/marks` - Enter marks/feedback for a group milestone.

## Student Routes (Protected: `['student']`)
- `GET /api/groups/my-group` - View the student's current group.
- `POST /api/groups` - Create a new project group with a password.
- `POST /api/groups/join` - Join an existing group using its name and password.
- `POST /api/projects` - Register the capstone project details for the group.
- `POST /api/projects/proposals` - Submit a formal project proposal for supervisor review.

## General Routes
- `GET /api/activity` - Fetch the system activity feed (visible to all logged-in users, filtered by relevance).
