// CapstoneDesk 2.0 — Constants & Enums

// ── Roles ──
export const ROLES = {
  STUDENT: 'student',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.ADMIN]: 'Administrator',
};

// ── Project Status Lifecycle ──
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  PROPOSAL_SUBMITTED: 'proposal_submitted',
  UNDER_REVIEW: 'under_review',
  CHANGES_REQUESTED: 'changes_requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.DRAFT]: 'Draft',
  [PROJECT_STATUS.PROPOSAL_SUBMITTED]: 'Proposal Submitted',
  [PROJECT_STATUS.UNDER_REVIEW]: 'Under Review',
  [PROJECT_STATUS.CHANGES_REQUESTED]: 'Changes Requested',
  [PROJECT_STATUS.APPROVED]: 'Approved',
  [PROJECT_STATUS.REJECTED]: 'Rejected',
  [PROJECT_STATUS.IN_PROGRESS]: 'In Progress',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
};

// Maps to CSS badge classes
export const PROJECT_STATUS_BADGE = {
  [PROJECT_STATUS.DRAFT]: 'badge-draft',
  [PROJECT_STATUS.PROPOSAL_SUBMITTED]: 'badge-submitted',
  [PROJECT_STATUS.UNDER_REVIEW]: 'badge-review',
  [PROJECT_STATUS.CHANGES_REQUESTED]: 'badge-changes',
  [PROJECT_STATUS.APPROVED]: 'badge-approved',
  [PROJECT_STATUS.REJECTED]: 'badge-rejected',
  [PROJECT_STATUS.IN_PROGRESS]: 'badge-progress',
  [PROJECT_STATUS.COMPLETED]: 'badge-completed',
};

// ── Milestone Status ──
export const MILESTONE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
};

export const MILESTONE_STATUS_LABELS = {
  [MILESTONE_STATUS.NOT_STARTED]: 'Not Started',
  [MILESTONE_STATUS.IN_PROGRESS]: 'In Progress',
  [MILESTONE_STATUS.COMPLETED]: 'Completed',
  [MILESTONE_STATUS.OVERDUE]: 'Overdue',
};

export const MILESTONE_STATUS_BADGE = {
  [MILESTONE_STATUS.NOT_STARTED]: 'badge-neutral',
  [MILESTONE_STATUS.IN_PROGRESS]: 'badge-progress',
  [MILESTONE_STATUS.COMPLETED]: 'badge-completed',
  [MILESTONE_STATUS.OVERDUE]: 'badge-overdue',
};

// ── Review Types ──
export const REVIEW_TYPE = {
  REVIEW_1: 'review_1',
  REVIEW_2: 'review_2',
  REVIEW_3: 'review_3',
  REVIEW_4: 'review_4',
};

// ── Navigation by Role ──
export const STUDENT_NAV = [
  { key: 'overview', label: 'Overview', path: '/student/dashboard' },
  { key: 'project', label: 'Project', path: '/student/project' },
  { key: 'milestones', label: 'Milestones', path: '/student/milestones' },
  { key: 'reviews', label: 'Reviews', path: '/student/reviews' },
  { key: 'team', label: 'Team', path: '/student/team' },
];

export const SUPERVISOR_NAV = [
  { key: 'overview', label: 'Overview', path: '/supervisor/dashboard' },
  { key: 'groups', label: 'Assigned Groups', path: '/supervisor/groups' },
  { key: 'reviews', label: 'Reviews', path: '/supervisor/reviews' },
];

export const ADMIN_NAV = [
  { key: 'overview', label: 'Overview', path: '/admin/dashboard' },
  { key: 'students', label: 'Students', path: '/admin/students' },
  { key: 'supervisors', label: 'Supervisors', path: '/admin/supervisors' },
  { key: 'groups', label: 'Groups', path: '/admin/groups' },
  { key: 'projects', label: 'Projects', path: '/admin/projects' },
  { key: 'assignments', label: 'Assignments', path: '/admin/assignments' },
];
