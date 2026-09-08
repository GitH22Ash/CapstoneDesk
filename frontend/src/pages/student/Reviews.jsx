import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import API from '../../lib/api';
import { ClipboardCheck } from 'lucide-react';

export default function StudentReviews() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">
            <ClipboardCheck size={20} />
          </div>
          <div className="empty-state-title">No Reviews Yet</div>
          <p className="empty-state-description">
            Marks and feedback from your supervisor reviews will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
