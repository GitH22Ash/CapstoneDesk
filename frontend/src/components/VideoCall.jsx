import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API } from '../api';

const STUN_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');

function VideoCall({ groupId, supervisorId, isSuper = false, onClose }) {
    const [status, setStatus] = useState('idle'); // idle, connecting, connected, failed
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [roomId, setRoomId] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);

    const cleanup = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        if (socketRef.current) {
            if (roomId) socketRef.current.emit('leave-room', roomId);
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        if (roomId) {
            API.put(`/video/end-room/${roomId}`).catch(() => {});
        }
    }, [roomId]);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const getMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            return stream;
        } catch (err) {
            console.error('Media error:', err);
            if (err.name === 'NotAllowedError') {
                setStatus('failed');
                alert('Camera/microphone permission denied. Please allow access and try again.');
            } else if (err.name === 'NotFoundError') {
                setStatus('failed');
                alert('No camera/microphone found. Please connect a device and try again.');
            } else {
                setStatus('failed');
                alert('Failed to access media devices. Please check your permissions.');
            }
            return null;
        }
    };

    const createPeerConnection = (socket, currentRoomId, stream) => {
        const pc = new RTCPeerConnection(STUN_CONFIG);
        peerRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { roomId: currentRoomId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                setStatus('connected');
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                if (retryCount < 3) {
                    setRetryCount(prev => prev + 1);
                    setStatus('connecting');
                    // Reconnection logic
                    setTimeout(() => {
                        if (peerRef.current) {
                            peerRef.current.restartIce();
                        }
                    }, 2000);
                } else {
                    setStatus('failed');
                }
            }
        };

        return pc;
    };

    const startCall = async () => {
        setStatus('connecting');

        const stream = await getMedia();
        if (!stream) return;

        try {
            // Create room
            const res = await API.post('/video/create-room', { group_id: groupId, supervisor_id: supervisorId });
            const currentRoomId = res.data.roomId;
            setRoomId(currentRoomId);

            // Connect socket
            const socket = io(BACKEND_URL);
            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('join-room', currentRoomId);
            });

            socket.on('user-joined', async (userId) => {
                const pc = createPeerConnection(socket, currentRoomId, stream);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('offer', { roomId: currentRoomId, offer });
            });

            socket.on('offer', async ({ offer }) => {
                const pc = createPeerConnection(socket, currentRoomId, stream);
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { roomId: currentRoomId, answer });
            });

            socket.on('answer', async ({ answer }) => {
                if (peerRef.current) {
                    await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                }
            });

            socket.on('ice-candidate', async ({ candidate }) => {
                if (peerRef.current) {
                    await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            });

            socket.on('user-left', () => {
                setStatus('idle');
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            });
        } catch (err) {
            console.error('Call error:', err);
            setStatus('failed');
        }
    };

    const joinRoom = async (existingRoomId) => {
        setStatus('connecting');
        setRoomId(existingRoomId);

        const stream = await getMedia();
        if (!stream) return;

        const socket = io(BACKEND_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join-room', existingRoomId);
        });

        socket.on('user-joined', async () => {
            const pc = createPeerConnection(socket, existingRoomId, stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { roomId: existingRoomId, offer });
        });

        socket.on('offer', async ({ offer }) => {
            const pc = createPeerConnection(socket, existingRoomId, stream);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { roomId: existingRoomId, answer });
        });

        socket.on('answer', async ({ answer }) => {
            if (peerRef.current) {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('ice-candidate', async ({ candidate }) => {
            if (peerRef.current) {
                await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        socket.on('user-left', () => {
            setStatus('idle');
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });
    };

    const endCall = () => {
        cleanup();
        setStatus('idle');
        setRoomId(null);
        setRetryCount(0);
        if (onClose) onClose();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
            setIsVideoOff(!isVideoOff);
        }
    };

    const statusColors = {
        idle: '#6b7280', connecting: '#f59e0b', connected: '#10b981', failed: '#ef4444',
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
            {/* Status indicator */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '1rem', padding: '6px 16px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
            }}>
                <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: statusColors[status],
                    animation: status === 'connecting' ? 'blink 1s infinite' : 'none',
                }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {status === 'idle' ? 'Ready' : status}
                </span>
            </div>

            {/* Video Area */}
            <div style={{
                display: 'grid', gridTemplateColumns: status === 'connected' ? '1fr 1fr' : '1fr',
                gap: '1rem', maxWidth: '900px', width: '90%', marginBottom: '1.5rem',
            }}>
                {/* Local Video */}
                <div style={{
                    position: 'relative', borderRadius: '14px', overflow: 'hidden',
                    background: '#111', aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <video ref={localVideoRef} autoPlay playsInline muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    <span style={{
                        position: 'absolute', bottom: '8px', left: '8px',
                        background: 'rgba(0,0,0,0.6)', padding: '2px 8px',
                        borderRadius: '6px', fontSize: '0.75rem', color: '#fff',
                    }}>You</span>
                </div>

                {/* Remote Video */}
                {status === 'connected' && (
                    <div style={{
                        position: 'relative', borderRadius: '14px', overflow: 'hidden',
                        background: '#111', aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <video ref={remoteVideoRef} autoPlay playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{
                            position: 'absolute', bottom: '8px', left: '8px',
                            background: 'rgba(0,0,0,0.6)', padding: '2px 8px',
                            borderRadius: '6px', fontSize: '0.75rem', color: '#fff',
                        }}>{isSuper ? 'Student' : 'Supervisor'}</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {status === 'idle' && !isSuper && (
                    <button onClick={startCall} className="btn-primary" id="start-call-btn"
                        style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                        📞 Start Call
                    </button>
                )}

                {(status === 'connecting' || status === 'connected') && (
                    <>
                        <button onClick={toggleMute} id="toggle-mute"
                            style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                                fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                            {isMuted ? '🔇' : '🎤'}
                        </button>
                        <button onClick={toggleVideo} id="toggle-video"
                            style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                                fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                            {isVideoOff ? '📵' : '📹'}
                        </button>
                        <button onClick={endCall} id="end-call-btn"
                            style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: '#ef4444', border: 'none', cursor: 'pointer',
                                fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                            📞
                        </button>
                    </>
                )}

                {status === 'failed' && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>Connection failed.</p>
                        <button onClick={startCall} className="btn-primary" style={{ marginRight: '0.5rem' }}>
                            🔄 Retry
                        </button>
                    </div>
                )}

                <button onClick={endCall} className="btn-secondary" id="close-video-call"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                    Close
                </button>
            </div>

            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}

export default VideoCall;
