import { useState, useRef, useEffect } from 'react';
import { API } from '../api';

function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! 👋 I\'m your project mentor. Ask me anything about your capstone project — architecture, coding, documentation, or project management. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');

        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await API.post('/chatbot/message', {
                message: userMsg,
                conversationHistory: newMessages.slice(-20),
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: err.response?.data?.msg || 'Sorry, I couldn\'t process that. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Chat Bubble */}
            <button
                id="chatbot-toggle"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    border: 'none', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={e => { e.target.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
            >
                <span style={{ fontSize: '1.6rem', color: '#fff' }}>
                    {isOpen ? '✕' : '🚀'}
                </span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed', bottom: '96px', right: '24px', zIndex: 999,
                    width: '380px', maxWidth: 'calc(100vw - 48px)', height: '520px',
                    background: 'rgba(15, 15, 25, 0.95)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                    animation: 'fadeInUp 0.3s ease',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.1))',
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                            🚀 Project Buddy
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                            Your project assistant • Powered by Grok
                        </p>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: '16px',
                        display: 'flex', flexDirection: 'column', gap: '12px',
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                            }}>
                                <div style={{
                                    padding: '10px 14px', borderRadius: '12px',
                                    fontSize: '0.88rem', lineHeight: 1.5,
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                        : 'rgba(255,255,255,0.07)',
                                    color: '#fff',
                                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                                <div style={{
                                    padding: '10px 14px', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.07)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex', gap: '4px', alignItems: 'center',
                                }}>
                                    <span className="typing-dot" style={{ animationDelay: '0ms' }}>•</span>
                                    <span className="typing-dot" style={{ animationDelay: '150ms' }}>•</span>
                                    <span className="typing-dot" style={{ animationDelay: '300ms' }}>•</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', gap: '8px',
                    }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            maxLength={500}
                            placeholder="Ask your mentor..."
                            id="chatbot-input"
                            style={{
                                flex: 1, padding: '10px 14px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '0.88rem', outline: 'none',
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            id="chatbot-send"
                            style={{
                                padding: '10px 16px', borderRadius: '10px',
                                background: loading || !input.trim()
                                    ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                                border: 'none', color: '#fff', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.88rem',
                                transition: 'opacity 0.2s',
                                opacity: loading || !input.trim() ? 0.5 : 1,
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .typing-dot {
                    animation: blink 1.2s infinite;
                    color: rgba(255,255,255,0.4);
                    font-size: 1.2rem;
                }
                @keyframes blink {
                    0%, 60%, 100% { opacity: 0.2; }
                    30% { opacity: 1; }
                }
            `}</style>
        </>
    );
}

export default AIChatbot;
