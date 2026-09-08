import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, STUDENT_NAV, SUPERVISOR_NAV, ADMIN_NAV } from '../../lib/constants';
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardCheck,
  Users,
  GraduationCap,
  Shield,
  Settings,
  ListChecks,
  UserRoundCheck,
  Link2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ICON_MAP = {
  overview: LayoutDashboard,
  project: FolderKanban,
  milestones: ListChecks,
  reviews: ClipboardCheck,
  team: Users,
  groups: Users,
  students: GraduationCap,
  supervisors: UserRoundCheck,
  projects: FolderKanban,
  assignments: Link2,
  settings: Settings,
};

function getNavItems(role) {
  switch (role) {
    case ROLES.STUDENT: return STUDENT_NAV;
    case ROLES.SUPERVISOR: return SUPERVISOR_NAV;
    case ROLES.ADMIN: return ADMIN_NAV;
    default: return [];
  }
}

function getSettingsPath(role) {
  switch (role) {
    case ROLES.STUDENT: return '/student/settings';
    case ROLES.SUPERVISOR: return '/supervisor/settings';
    case ROLES.ADMIN: return '/admin/settings';
    default: return '/settings';
  }
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const settingsPath = getSettingsPath(user.role);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="mobile-overlay open"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <img
            src="/logo.png"
            alt="CapstoneDesk"
            className="sidebar-logo"
          />
          <span className="sidebar-brand">CapstoneDesk</span>

          {/* Mobile close button */}
          <button
            className="mobile-menu-btn"
            onClick={onClose}
            aria-label="Close sidebar"
            style={{ marginLeft: 'auto' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>

          {navItems.map((item) => {
            const Icon = ICON_MAP[item.key] || LayoutDashboard;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={18} className="sidebar-link-icon" />
                <span className="sidebar-link-text">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <NavLink
            to={settingsPath}
            className={`sidebar-link ${location.pathname === settingsPath ? 'active' : ''}`}
            onClick={onClose}
            title={isCollapsed ? "Settings" : undefined}
          >
          
            <Settings size={18} className="sidebar-link-icon" />
            <span className="sidebar-link-text">Settings</span>
          </NavLink>
          <button 
            className="sidebar-link desktop-collapse-btn" 
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} className="sidebar-link-icon" /> : <ChevronLeft size={18} className="sidebar-link-icon" />}
            {/* <span className="sidebar-link-text">Collapse</span> */}
          </button>
        </div>
      </aside>
    </>
  );
}
