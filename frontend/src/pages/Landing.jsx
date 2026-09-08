import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, UserRoundCheck, Shield, ChevronRight } from 'lucide-react';

const roles = [
  {
    key: 'student',
    title: 'Student',
    description: 'Create groups, submit proposals, and manage your capstone project',
    icon: GraduationCap,
    path: '/login?role=student',
  },
  {
    key: 'supervisor',
    title: 'Supervisor',
    description: 'Review proposals, assign marks, and guide student teams',
    icon: UserRoundCheck,
    path: '/login?role=supervisor',
  },
  {
    key: 'admin',
    title: 'Administrator',
    description: 'Manage students, supervisors, groups, and system settings',
    icon: Shield,
    path: '/login?role=admin',
  },
];

export default function Landing() {
  const { isAuthenticated, user } = useAuth();

  // If already logged in, redirect to their dashboard
  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return (
    <div className="landing-container">
      <div className="landing-card animate-fade-in-up">
        {/* Header */}
        <div className="landing-header">
          <img src="/logo.png" alt="CapstoneDesk" className="landing-logo" />
          <h1 className="landing-title">CapstoneDesk</h1>
          <p className="landing-tagline">Capstone Project Management</p>
          <p className="landing-subtitle">
            Streamline your capstone workflow — from proposal to completion.
          </p>
        </div>

        {/* Role Selection */}
        <div className="role-list">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.key}
                to={role.path}
                className="role-item"
                id={`role-${role.key}`}
              >
                <div className="role-item-icon">
                  <Icon size={18} />
                </div>
                <div className="role-item-content">
                  <div className="role-item-title">{role.title}</div>
                  <div className="role-item-desc">{role.description}</div>
                </div>
                <ChevronRight size={16} className="role-item-arrow" />
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          © {new Date().getFullYear()} CapstoneDesk. All rights reserved.
        </p>
      </div>
    </div>
  );
}
