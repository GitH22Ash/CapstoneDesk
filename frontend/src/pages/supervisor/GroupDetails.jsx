import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import API from '../../lib/api';
import { ArrowLeft, Loader2, CheckCircle, XCircle, FileText, FileEdit } from 'lucide-react';

export default function SupervisorGroupDetails() {
  const { groupId } = useParams();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      // We first fetch all groups to get the group name & members because /my-groups/:id currently only returns project & proposals.
      // Wait, let's just fetch /my-groups and find it.
      const groupsRes = await API.get('/supervisors/my-groups');
      const groupInfo = groupsRes.data.find(g => g.group_id === parseInt(groupId));
      
      if (!groupInfo) {
        throw new Error('Group not found');
      }

      const projRes = await API.get(`/supervisors/my-groups/${groupId}`);
      
      setData({
        ...groupInfo,
        project: projRes.data.project,
        proposals: projRes.data.proposals
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load group details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status) => {
    const proposal = data.proposals?.[0];
    if (!proposal) return;

    if (status !== 'approved' && !feedback.trim()) {
      return toast.error('Please provide feedback when requesting changes or rejecting.');
    }

    setReviewLoading(true);
    try {
      await API.post(`/supervisors/proposals/${proposal.id}/review`, { status, feedback });
      toast.success(`Proposal marked as ${status.replace('_', ' ')}.`);
      fetchGroupData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleMarkChange = async (regNo, reviewNumber, marks) => {
    try {
      await API.put('/supervisors/marks', {
        student_reg_no: regNo,
        group_id: parseInt(groupId),
        review_number: reviewNumber,
        marks: parseFloat(marks)
      });
      toast.success('Marks updated successfully.');
      fetchGroupData();
    } catch (err) {
      toast.error('Failed to update marks.');
    }
  };

  if (loading || !data) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  const latestProposal = data.proposals?.[0];
  const members = data.members || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div>
        <Link to="/supervisor/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{data.group_name}</h1>
            <p className="text-muted text-sm">{members.length}/5 Students • Project: {data.project?.title || 'Not registered yet'}</p>
          </div>
          <span className={`badge ${data.project?.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'uppercase' }}>
            {data.project?.status ? data.project.status.replace('_', ' ') : 'No Project'}
          </span>
        </div>
      </div>

      {/* Project & Proposal Section */}
      <div className="card">
        <div className="card-header">
          <h2>Project Proposal</h2>
        </div>
        <div className="card-body">
          {!data.project ? (
            <div className="empty-state">
              <p className="empty-state-description">This group has not registered a project or submitted a proposal yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{data.project.title}</h3>
                <p className="text-muted text-sm" style={{ marginBottom: '0.75rem' }}>Category: {data.project.category} • Stack: {data.project.technology_stack}</p>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{data.project.abstract}</p>
              </div>

              {latestProposal ? (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Latest Document</h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-secondary)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <div style={{ fontWeight: 500 }}>Proposal Document</div>
                        <div className="text-muted text-xs">Submitted on {new Date(latestProposal.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`badge ${latestProposal.status === 'approved' ? 'badge-success' : latestProposal.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                        {latestProposal.status.replace('_', ' ')}
                      </span>
                      <a href={latestProposal.document_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        View Document
                      </a>
                    </div>
                  </div>

                  {latestProposal.status === 'under_review' && (
                    <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Provide Review</h4>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Leave feedback for the students..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        style={{ marginBottom: '1rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-error btn-md" disabled={reviewLoading} onClick={() => handleReview('rejected')}>
                          <XCircle size={16} /> Reject
                        </button>
                        <button className="btn btn-secondary btn-md" disabled={reviewLoading} onClick={() => handleReview('changes_requested')}>
                          <FileEdit size={16} /> Request Changes
                        </button>
                        <button className="btn btn-success btn-md" disabled={reviewLoading} onClick={() => handleReview('approved')}>
                          <CheckCircle size={16} /> Approve
                        </button>
                      </div>
                    </div>
                  )}

                  {latestProposal.feedback && (
                    <div style={{ padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ca8a04', marginBottom: '0.25rem' }}>Your Feedback</h4>
                      <p style={{ fontSize: '0.9rem', color: '#854d0e' }}>{latestProposal.feedback}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <p className="text-muted text-sm text-center">No proposal document uploaded yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Marks Section */}
      <div className="card">
        <div className="card-header">
          <h2>Student Marks & Evaluation</h2>
        </div>
        <div style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reg No.</th>
                <th>Rev 1 (20)</th>
                <th>Rev 2 (20)</th>
                <th>Rev 3 (30)</th>
                <th>Rev 4 (30)</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.reg_no}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{member.name}</td>
                  <td className="text-muted">{member.reg_no}</td>
                  {[1, 2, 3, 4].map(revNum => {
                    const markKey = `review${revNum}_marks`;
                    return (
                      <td key={revNum}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: '70px', padding: '0.25rem 0.5rem', textAlign: 'center' }}
                          defaultValue={member[markKey] || ''}
                          onBlur={(e) => {
                            if (e.target.value !== '' && parseFloat(e.target.value) !== parseFloat(member[markKey])) {
                              handleMarkChange(member.reg_no, revNum, e.target.value);
                            }
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
