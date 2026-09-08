import { useState, useEffect } from 'react';
import API from '../lib/api';
import { Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/activity'); // Fallback if admin route is needed
    } catch (err) {
      try {
        const res = await API.get('/activity');
        setActivities(res.data);
      } catch (err2) {
        console.error('Failed to fetch activity logs', err2);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Recent Activity</h2>
        </div>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader2 className="animate-spin text-muted" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Recent Activity</h2>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {activities.length === 0 ? (
          <div className="empty-state text-muted" style={{ padding: '2rem' }}>
            No recent activity found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activities.map((activity, idx) => (
              <div 
                key={activity.id} 
                style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  padding: '1rem 1.25rem', 
                  borderBottom: idx !== activities.length - 1 ? '1px solid var(--border-light)' : 'none',
                  background: 'var(--bg-surface)'
                }}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Clock size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    <span style={{ fontWeight: 500 }}>{activity.user_name || 'System'}</span> {activity.action}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
