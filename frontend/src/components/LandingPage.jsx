import { useNavigate } from 'react-router-dom';

function LandingPage() {
    const navigate = useNavigate();

    const roles = [
        {
            key: 'student',
            title: 'Student',
            description: 'Register your project group or login to view your group dashboard',
            icon: '🎓',
            path: '/student',
            className: 'student',
        },
        {
            key: 'supervisor',
            title: 'Supervisor',
            description: 'Login to manage assigned groups and enter review marks',
            icon: '👨‍🏫',
            path: '/supervisor/login',
            className: 'supervisor',
        },
        {
            key: 'admin',
            title: 'Admin',
            description: 'Manage supervisors, view groups, and handle group assignments',
            icon: '🛡️',
            path: '/admin/login',
            className: 'admin',
        },
    ];

    return (
        <div className="page-container">
            {/* Background decorations */}
            <div className="bg-grid" />
            <div className="bg-glow" style={{ top: '-200px', left: '-100px', background: 'rgba(59,130,246,0.3)' }} />
            <div className="bg-glow" style={{ bottom: '-200px', right: '-100px', background: 'rgba(139,92,246,0.3)' }} />

            <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                {/* Header */}
                <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <img 
                        src="/logo.png" 
                        alt="CapstoneDesk Logo" 
                        style={{ 
                            width: '150px', 
                            height: '110px', 
                            marginBottom: '1rem',
                            display: 'inline-block',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.4))'
                        }} 
                    />
                    <h1 style={{
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '1rem',
                        letterSpacing: '-0.02em',
                    }}>
                        CapstoneDesk
                    </h1>
                    <p style={{
                        fontSize: '1.15rem',
                        color: 'var(--text-muted)',
                        maxWidth: '500px',
                        margin: '0 auto',
                        lineHeight: 1.6,
                    }}>
                        Capstone Project Management System — Select your role to continue
                    </p>
                </div>

                {/* Role Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '2rem',
                    maxWidth: '960px',
                    width: '100%',
                    padding: '0 1rem',
                }}>
                    {roles.map((role, index) => (
                        <div
                            key={role.key}
                            className={`role-card ${role.className} animate-fade-in-up delay-${index + 1}`}
                            onClick={() => navigate(role.path)}
                            id={`role-card-${role.key}`}
                        >
                            <div className="icon-circle">{role.icon}</div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                marginBottom: '0.75rem',
                                color: 'white',
                            }}>
                                {role.title}
                            </h2>
                            <p style={{
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                color: 'rgba(255,255,255,0.8)',
                                lineHeight: 1.5,
                            }}>
                                {role.description}
                            </p>
                            <div style={{
                                marginTop: '1.5rem',
                                textAlign: 'center',
                                color: 'rgba(255,255,255,0.9)',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                            }}>
                                Continue →
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default LandingPage;
