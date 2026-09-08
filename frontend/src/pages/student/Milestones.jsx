import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import API from '../../lib/api';
import { ListChecks } from 'lucide-react';

export default function StudentMilestones() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">
            <ListChecks size={20} />
          </div>
          <div className="empty-state-title">No Milestones Yet</div>
          <p className="empty-state-description">
            Your supervisor has not assigned any milestones for your project yet. Check back later once your project proposal is approved.
          </p>
        </div>
      </div>
    </div>
  );
}
