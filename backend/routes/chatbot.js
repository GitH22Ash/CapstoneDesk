const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');

// Rate limiter: 20 requests per minute per IP
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { msg: 'Too many requests. Please wait a moment before sending another message.' }
});

const SYSTEM_PROMPT = `You are a friendly and knowledgeable academic mentor for capstone/final year project students. Your role is to:
- Help students with project-related queries (architecture, coding, debugging, documentation)
- Guide them on best practices, methodologies, and project management
- Provide constructive feedback and suggestions
- Be encouraging and supportive like a real mentor would be
- Keep responses concise but helpful (max 200 words unless the student asks for detail)
- If a question is outside your scope, guide them to ask their supervisor

You are NOT a replacement for the supervisor. For major decisions (scope changes, deadline extensions, grading), always recommend consulting the supervisor.`;

// POST /api/chatbot/message
router.post('/message', chatLimiter, async (req, res) => {
    const { message, conversationHistory } = req.body;

    if (!message || message.trim().length === 0) {
        return res.status(400).json({ msg: 'Message cannot be empty.' });
    }

    // Cost control: limit input length
    if (message.length > 500) {
        return res.status(400).json({ msg: 'Message too long. Please keep it under 500 characters.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ msg: 'AI service is not configured. Please contact the administrator.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build conversation context from history (last 20 messages)
        const history = (conversationHistory || []).slice(-20);
        let contextMessages = SYSTEM_PROMPT + '\n\nConversation so far:\n';
        for (const msg of history) {
            contextMessages += `${msg.role === 'user' ? 'Student' : 'Mentor'}: ${msg.content}\n`;
        }
        contextMessages += `Student: ${message}\nMentor:`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: contextMessages }] }],
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            },
        });

        const response = result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (err) {
        console.error('Chatbot error:', err.message);
        if (err.message?.includes('API_KEY')) {
            return res.status(500).json({ msg: 'Invalid AI API key. Please contact the administrator.' });
        }
        res.status(500).json({ msg: 'Failed to get AI response. Please try again.' });
    }
});

module.exports = router;
