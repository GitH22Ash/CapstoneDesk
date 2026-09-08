import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/constants';
import {
  Menu,
  LogOut,
  Settings,
  ChevronDown,
  User,
} from 'lucide-react';

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setShowMenu(false);
    logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        {title && <h1 className="topbar-title">{title}</h1>}
      </div>

      <div className="topbar-right">
        {/* User Menu */}
        <div className="dropdown" ref={menuRef}>
          <button
            className="user-menu-trigger"
            onClick={() => setShowMenu(!showMenu)}
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <div className="avatar avatar-sm">
              {initials}
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span className="user-menu-name">{user?.name || 'User'}</span>
              <span className="user-menu-role">{ROLE_LABELS[user?.role] || 'Unknown'}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  const settingsPath = `/${user?.role}/settings`;
                  navigate(settingsPath);
                }}
              >
                <User size={14} />
                Profile
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  const settingsPath = `/${user?.role}/settings`;
                  navigate(settingsPath);
                }}
              >
                <Settings size={14} />
                Settings
              </button>
              <div className="dropdown-separator" />
              <button
                className="dropdown-item dropdown-item-danger"
                onClick={handleLogout}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
