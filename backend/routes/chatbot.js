const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
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

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ msg: 'AI service is not configured. Please contact the administrator.' });
    }

    try {
        const client = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://api.x.ai/v1',
        });

        // Build conversation messages from history (last 20 messages)
        const history = (conversationHistory || []).slice(-20);
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
        ];

        for (const msg of history) {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content,
            });
        }

        messages.push({ role: 'user', content: message });

        const completion = await client.chat.completions.create({
            model: 'grok-3-mini-fast',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
        });

        const text = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        res.json({ reply: text });
    } catch (err) {
        console.error('Chatbot error:', err.message);
        if (err.message?.includes('API_KEY') || err.message?.includes('api_key')) {
            return res.status(500).json({ msg: 'Invalid AI API key. Please contact the administrator.' });
        }
        res.status(500).json({ msg: 'Failed to get AI response. Please try again.' });
    }
});

module.exports = router;
