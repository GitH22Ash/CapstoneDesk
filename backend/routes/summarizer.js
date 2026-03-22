const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const https = require('https');
const http = require('http');

// Rate limiter: 10 summarizations per minute per supervisor
const summarizeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { msg: 'Too many summarization requests. Please wait.' }
});

// Helper: fetch file content from URL
function fetchFileBuffer(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

// POST /api/summarizer/summarize
router.post('/summarize', auth, summarizeLimiter, async (req, res) => {
    const { file_url, file_name, file_type } = req.body;

    if (!file_url || !file_name) {
        return res.status(400).json({ msg: 'File URL and name are required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ msg: 'AI service is not configured. Please contact the administrator.' });
    }

    try {
        let textContent = '';

        if (file_type === 'pdf') {
            // Extract text from PDF
            const pdfParse = require('pdf-parse');
            const buffer = await fetchFileBuffer(file_url);
            const pdfData = await pdfParse(buffer);
            textContent = pdfData.text;
        } else if (['ppt', 'pptx'].includes(file_type)) {
            // For PPT files, we'll send a note that text extraction is limited
            textContent = `[This is a PowerPoint file: ${file_name}. Full text extraction from PPT is limited. Providing a general summary request.]`;
        }

        if (!textContent || textContent.trim().length < 10) {
            return res.status(400).json({ msg: 'Could not extract enough text content from the file.' });
        }

        // Truncate to avoid token limits (first 5000 chars)
        const truncatedText = textContent.substring(0, 5000);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are an academic document summarizer. Summarize the following document content concisely. Highlight key points, findings, and conclusions. Format with bullet points for readability.

Document: "${file_name}"

Content:
${truncatedText}

Provide a clear, structured summary:`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 1500,
                temperature: 0.3,
            },
        });

        const summary = result.response.text();
        res.json({ summary });
    } catch (err) {
        console.error('Summarizer error:', err.message);
        res.status(500).json({ msg: 'Failed to summarize document. Please try again.' });
    }
});

module.exports = router;
