import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Layout & Core
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { ROLES } from './lib/constants';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProject from './pages/student/Project';
import StudentTeam from './pages/student/Team';
import StudentMilestones from './pages/student/Milestones';
import StudentReviews from './pages/student/Reviews';

// Supervisor Pages
import SupervisorDashboard from './pages/supervisor/Dashboard';
import SupervisorGroupDetails from './pages/supervisor/GroupDetails';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminSupervisors from './pages/admin/Supervisors';
import AdminGroups from './pages/admin/Groups';

// Generic placeholder for unbuilt pages
function Placeholder({ title }) {
  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="card-body">
        <p className="text-muted">This page is under construction in Phase 1.</p>
      </div>
    </div>
  );
}

// 404 Not Found
function NotFound() {
  return (
    <div className="empty-state animate-fade-in" style={{ marginTop: '10vh' }}>
      <div className="empty-state-icon">404</div>
      <h2 className="empty-state-title">Page Not Found</h2>
      <p className="empty-state-description">The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Return Home</a>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute roles={[ROLES.STUDENT]}>
                <AppShell title="Student Portal" />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="project" element={<StudentProject />} />
              <Route path="team" element={<StudentTeam />} />
              <Route path="milestones" element={<StudentMilestones />} />
              <Route path="reviews" element={<StudentReviews />} />
              <Route path="settings" element={<Placeholder title="Account Settings" />} />
            </Route>

            {/* Supervisor Routes */}
            <Route path="/supervisor" element={
              <ProtectedRoute roles={[ROLES.SUPERVISOR]}>
                <AppShell title="Supervisor Portal" />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
              <Route path="dashboard" element={<SupervisorDashboard />} />
              <Route path="groups" element={<Navigate to="/supervisor/dashboard" replace />} />
              <Route path="groups/:groupId" element={<SupervisorGroupDetails />} />
              <Route path="reviews" element={<Placeholder title="Reviews & Grading" />} />
              <Route path="settings" element={<Placeholder title="Account Settings" />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <AppShell title="Admin Portal" />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="supervisors" element={<AdminSupervisors />} />
              <Route path="groups" element={<AdminGroups />} />
              <Route path="projects" element={<Placeholder title="Project Management" />} />
              <Route path="assignments" element={<Placeholder title="Assignments" />} />
              <Route path="settings" element={<Placeholder title="System Settings" />} />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
