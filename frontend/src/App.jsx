import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Import page components
import LandingPage from './components/LandingPage';
import StudentAuth from './components/StudentAuth';
import GroupSignup from './components/GroupSignup';
import StudentDashboard from './components/StudentDashboard';
import SupervisorLogin from './components/SupervisorLogin';
import SupervisorDashboard from './components/SupervisorDashboard';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Student Routes */}
        <Route path="/student" element={<StudentAuth />} />
        <Route path="/student/signup/members" element={<GroupSignup />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />

        {/* Supervisor Routes */}
        <Route path="/supervisor/login" element={<SupervisorLogin />} />
        <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
