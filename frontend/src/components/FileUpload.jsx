import { useState, useEffect, useRef } from 'react';
import { API } from '../api';

function FileUpload({ groupId, uploadedBy }) {
    const [files, setFiles] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchSubmissions();
    }, [groupId]);

    const fetchSubmissions = async () => {
        try {
            const res = await API.get(`/submissions/group/${groupId}`);
            setSubmissions(res.data);
        } catch (err) {
            console.error('Failed to fetch submissions:', err);
        }
    };

    const validateFile = (file) => {
        const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            return 'Only PDF and PPT/PPTX files are allowed.';
        }
        if (file.size > maxSize) {
            return 'File size exceeds 10MB limit.';
        }
        return null;
    };

    const handleFileSelect = (selectedFiles) => {
        setError('');
        const validFiles = [];
        for (const file of selectedFiles) {
            const err = validateFile(file);
            if (err) {
                setError(err);
                return;
            }
            validFiles.push(file);
        }
        setFiles(validFiles);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('group_id', groupId);
                formData.append('uploaded_by', uploadedBy);
                await API.post('/submissions/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            setSuccess(`${files.length} file(s) uploaded successfully!`);
            setFiles([]);
            fetchSubmissions();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const getFileIcon = (type) => {
        if (type === 'pdf') return '📄';
        return '📊';
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2 style={{
                fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
                📁 Submissions
            </h2>

            {/* Drop Zone */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${dragOver ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: '14px', padding: '2rem', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.3s',
                    background: dragOver ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                    marginBottom: '1rem',
                }}
                id="file-drop-zone"
            >
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                    Drag & drop files here or click to browse
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    PDF, PPT, PPTX • Max 10MB
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    style={{ display: 'none' }}
                    id="file-input"
                />
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
                <div style={{
                    background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '12px', padding: '1rem', marginBottom: '1rem',
                }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Selected files:
                    </p>
                    {Array.from(files).map((f, i) => (
                        <p key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {getFileIcon(f.name.split('.').pop())} {f.name} ({formatSize(f.size)})
                        </p>
                    ))}
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="btn-primary"
                        id="upload-btn"
                        style={{ marginTop: '0.75rem', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                    >
                        {uploading ? 'Uploading...' : '⬆ Upload'}
                    </button>
                </div>
            )}

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

            {/* Submissions List */}
            {submissions.length > 0 && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {submissions.map(sub => (
                        <div key={sub.submission_id} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '12px', padding: '1rem',
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{getFileIcon(sub.file_type)}</span>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.file_name}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        {formatSize(sub.file_size)} • {formatDate(sub.uploaded_at)} • by {sub.uploaded_by}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span className={`badge ${sub.status === 'submitted' ? 'badge-success' : 'badge-warning'}`}
                                    style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                                    {sub.status}
                                </span>
                                <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                                    className="btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', textDecoration: 'none' }}>
                                    ⬇ Download
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {submissions.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.9rem' }}>
                    No submissions yet. Upload your first file above!
                </p>
            )}
        </div>
    );
}

export default FileUpload;
