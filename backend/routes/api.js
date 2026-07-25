const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const { GoogleGenAI } = require('@google/genai');

// Use GoogleGenAI properly.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Input length caps
const MAX_TEXT_LENGTH = 500;

// POST /api/profile
router.post('/profile', async (req, res) => {
    try {
        let { name, trusted_contact, calming_phrase } = req.body;
        
        // Basic length cap validation
        name = name ? String(name).substring(0, 100) : '';
        trusted_contact = trusted_contact ? String(trusted_contact).substring(0, 100) : '';
        calming_phrase = calming_phrase ? String(calming_phrase).substring(0, 250) : '';

        // Save new profile (No auth, so we just create a new one each time for the demo)
        const newProfile = new Profile({
            name,
            trusted_contact,
            calming_phrase
        });
        
        await newProfile.save();
        
        res.status(201).json({ success: true, profile: newProfile });
    } catch (err) {
        console.error('Error saving profile'); // Redacted real error to avoid leaking fields
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// POST /api/classify
router.post('/classify', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text input required' });
        }
        
        const cappedText = text.substring(0, MAX_TEXT_LENGTH);
        
        const prompt = `You are a triage classifier for a recovery-support app used in India. Input 
may be in English, Hindi, or any major Indian language (Tamil, Telugu, 
Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, etc.), including 
code-mixed forms, and may be fragmented or emotional.
Classify into exactly one category:
- LOW: reflective, wants grounding/distraction
- MEDIUM: active craving, wants a support script or contact
- HIGH: mentions overdose, physical danger, explicit crisis language, or 
  severe withdrawal symptoms

Return only JSON: {"category": "...", "detected_language": "...", "confidence": 0-1}
Never generate advice or commentary. If ambiguous, default to the higher-risk 
category.

Input text: "${cappedText}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        const output = response.text;
        const parsed = JSON.parse(output);
        
        res.json(parsed);
    } catch (err) {
        console.error('Error in classify endpoint');
        res.status(500).json({ error: 'Classification failed' });
    }
});

// POST /api/generate
router.post('/generate', async (req, res) => {
    try {
        const { text, profile } = req.body;
        if (!text || typeof text !== 'string' || !profile) {
            return res.status(400).json({ error: 'Text and profile required' });
        }
        
        const cappedText = text.substring(0, MAX_TEXT_LENGTH);
        
        const name = String(profile.name || '').substring(0, 100);
        const contact_name = String(profile.trusted_contact || '').substring(0, 100);
        const phrase = String(profile.calming_phrase || '').substring(0, 250);

        const prompt = `You write a short, calming message for someone in early craving/distress, in 
the style shown below. Do not copy the examples verbatim — generate a new 
message each time, matching tone and length, personalized to the profile.

Style examples (for tone only, do not reuse text):
- "This feeling will pass. Look around and name 5 things you can see."
- "You don't have to say much. Just call {{contact_name}} and say you need to talk."
- "Breathe in for 4, hold for 4, out for 4. You're not alone in this."

Profile: name=${name}, trusted_contact=${contact_name}, calming_phrase=${phrase}
User's input: ${cappedText}
Language: detect and respond in the same language as the user's input — this 
may be English, Hindi, or any other major Indian language, including 
code-mixed forms. Match exactly.

Output under 40 words. Plain, warm language — avoid clinical terms like 
"relapse" or "sponsor."`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        res.json({ message: response.text });
    } catch (err) {
        console.error('Error in generate endpoint');
        res.status(500).json({ error: 'Generation failed' });
    }
});

module.exports = router;
