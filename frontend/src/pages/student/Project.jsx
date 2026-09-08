import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import API from '../../lib/api';
import { FileText, Upload, CheckCircle, Loader2, FileUp, ListChecks } from 'lucide-react';

export default function StudentProject() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState(null);
  const [groupData, setGroupData] = useState(null);
  
  // Create Project Form
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [techStack, setTechStack] = useState('');
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Proposal Upload
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get group info first to ensure they have a group
      const groupRes = await API.get('/groups/my-group');
      setGroupData(groupRes.data);
      
      try {
        const projRes = await API.get('/projects/my-project');
        setProjectData(projRes.data);
      } catch (err) {
        if (err.response?.status !== 404) {
          throw err;
        }
        setProjectData(null);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setGroupData(null);
      } else {
        toast.error('Failed to load project details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!title.trim() || !abstract.trim()) {
      return toast.error('Title and abstract are required.');
    }
    
    setCreating(true);
    try {
      await API.post('/projects', {
        title, abstract, technology_stack: techStack, category
      });
      toast.success('Project created successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!allowedTypes.includes(file.type)) {
      return toast.error('Only PDF and PPT files are allowed.');
    }
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File size exceeds 10MB limit.');
    }

    setUploading(true);
    try {
      // 1. Upload file to Cloudinary via submissions route
      const formData = new FormData();
      formData.append('file', file);
      formData.append('group_id', groupData.group_id);
      formData.append('uploaded_by', user.id);
      
      const uploadRes = await API.post('/submissions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const fileUrl = uploadRes.data.submission.file_url;
      
      // 2. Submit proposal
      await API.post('/projects/proposals', { document_url: fileUrl });
      
      toast.success('Proposal submitted successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to upload proposal.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const event = { target: { files: e.dataTransfer.files } };
      handleFileUpload(event);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton skeleton-heading" style={{ width: '250px', marginBottom: '1rem' }} />
        <div className="skeleton skeleton-card" style={{ height: '400px' }} />
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="card animate-fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">
            <ListChecks size={20} />
          </div>
          <div className="empty-state-title">No Group Found</div>
          <p className="empty-state-description">
            You need to create or join a group before you can register a project.
          </p>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="card animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card-header">
          <h2>Register Project</h2>
          <p className="text-muted text-sm">Define your capstone project's scope, technology, and objectives.</p>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label form-label-required">Project Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AI-Powered Smart Agriculture System"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label form-label-required">Abstract</label>
              <textarea
                className="form-input"
                rows={5}
                placeholder="Briefly describe the problem, proposed solution, and objectives..."
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Technology Stack</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. React, Node.js, Python"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Category / Domain</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Machine Learning, Web Dev"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? <Loader2 size={16} className="animate-spin" /> : 'Register Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const latestProposal = projectData.proposals?.[0];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Project Details Card */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {projectData.title}
            </h1>
            <p className="text-muted text-sm" style={{ display: 'flex', gap: '1rem' }}>
              <span><strong>Category:</strong> {projectData.category || 'N/A'}</span>
              <span><strong>Stack:</strong> {projectData.technology_stack || 'N/A'}</span>
            </p>
          </div>
          <span className="badge badge-info" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {projectData.status.replace('_', ' ')}
          </span>
        </div>
        <div className="card-body">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Abstract</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
            {projectData.abstract}
          </p>
        </div>
      </div>

      {/* Proposal Section */}
      <div className="card">
        <div className="card-header">
          <h2>Project Proposal</h2>
          <p className="text-muted text-sm">Upload your formal project proposal document for supervisor review.</p>
        </div>
        <div className="card-body">
          
          {latestProposal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px',
                background: 'var(--bg-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Current Proposal Document</div>
                    <div className="text-muted text-xs">Submitted on {new Date(latestProposal.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge ${latestProposal.status === 'approved' ? 'badge-success' : latestProposal.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                    {latestProposal.status}
                  </span>
                  <a href={latestProposal.document_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    View Document
                  </a>
                </div>
              </div>
              
              {latestProposal.feedback && (
                <div style={{ padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ca8a04', marginBottom: '0.25rem' }}>Supervisor Feedback</h4>
                  <p style={{ fontSize: '0.9rem', color: '#854d0e' }}>{latestProposal.feedback}</p>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--border)'}`,
                borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center',
                cursor: uploading ? 'default' : 'pointer', transition: 'all 0.2s ease',
                background: dragOver ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
              }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  <div style={{ fontWeight: 500 }}>Uploading Document...</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <FileUp size={24} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Click to upload or drag and drop</div>
                  <div className="text-muted text-sm">PDF, PPT or PPTX (max. 10MB)</div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
