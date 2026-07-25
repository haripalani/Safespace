const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const KnowledgeBase = require('../models/KnowledgeBase');
const { GoogleGenAI } = require('@google/genai');
const auth = require('../middleware/auth');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MAX_TEXT_LENGTH = 500;

// POST /api/profile (Patient only)
router.post('/profile', auth, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ error: 'Only patients can update their profile' });
        }

        let { name, trusted_contact, calming_phrase } = req.body;
        
        name = name ? String(name).substring(0, 100) : '';
        trusted_contact = trusted_contact ? String(trusted_contact).substring(0, 100) : '';
        calming_phrase = calming_phrase ? String(calming_phrase).substring(0, 250) : '';

        // Upsert profile for the logged in patient
        const profile = await Profile.findOneAndUpdate(
            { userId: req.user._id },
            { name, trusted_contact, calming_phrase },
            { new: true, upsert: true, runValidators: true }
        );
        
        res.status(200).json({ success: true, profile });
    } catch (err) {
        console.error('Error saving profile');
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// POST /api/classify (Patient only)
router.post('/classify', auth, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }

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

// POST /api/generate (Patient only)
router.post('/generate', auth, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }

        const { text, category } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text required' });
        }
        
        const cappedText = text.substring(0, MAX_TEXT_LENGTH);
        const profile = await Profile.findOne({ userId: req.user._id });
        
        const name = String(profile?.name || '').substring(0, 100);
        const contact_name = String(profile?.trusted_contact || '').substring(0, 100);
        const phrase = String(profile?.calming_phrase || '').substring(0, 250);

        // RAG Retrieval
        let retrievedSnippets = '';
        if (category === 'LOW' || category === 'MEDIUM') {
            const snippets = await KnowledgeBase.find({ audience: 'patient', category: category });
            retrievedSnippets = snippets.map(s => `- ${s.text}`).join('\n');
        }

        const prompt = `You write a short, calming message for someone in early craving/distress. 
Ground your message in the reference facts below — you may paraphrase and 
personalize them, but do not contradict them or invent unrelated advice.

Reference facts (retrieved, vetted — use these, don't invent new coping 
techniques):
${retrievedSnippets}

Profile: name=${name}, trusted_contact=${contact_name}, calming_phrase=${phrase}
User's input: ${cappedText}

Language requirement for Text-To-Speech: Detect the primary language of the user's input. Respond strictly in ONE pure language (e.g. pure English, pure Hindi, pure Tamil). DO NOT use code-mixed languages like Hinglish, Manglish, or Tanglish, as they sound unnatural when spoken by standard TTS voices. 

Output under 40 words. Plain, warm language — avoid clinical terms like 
"relapse", "sponsor", "sober", "therapy", or "addict". Do not simply copy a reference fact verbatim — 
personalize and phrase it naturally.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        res.json({ message: response.text });
    } catch (err) {
        console.error('Error in generate endpoint:', err);
        res.status(500).json({ error: 'Generation failed' });
    }
});

// POST /api/caregiver/respond (Caregiver only)
router.post('/caregiver/respond', auth, async (req, res) => {
    try {
        if (req.user.role !== 'caregiver') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }
        if (!req.user.linkedPatientId) {
            return res.status(403).json({ error: 'No patient linked to this account' });
        }

        const { text } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Text required' });
        }

        const cappedText = text.substring(0, MAX_TEXT_LENGTH);

        // RAG Retrieval for Caregiver
        const snippets = await KnowledgeBase.find({ audience: 'caregiver', category: 'caregiver_deescalation' });
        const retrievedSnippets = snippets.map(s => `- ${s.text}`).join('\n');

        const prompt = `You help a caregiver (friend, family member, or peer) respond calmly to 
someone they support who may be in a craving or distress moment, in India. 
Input may be in English, Hindi, or any major Indian language, including 
code-mixed forms (like Hinglish, Manglish, Tanglish, etc.), and may be anxious or fragmented.

Ground your response in the reference facts below — paraphrase and adapt 
them, don't contradict them or invent unrelated advice:
Reference facts (retrieved, vetted):
${retrievedSnippets}

Generate a short, calm script the caregiver can say out loud, plus one brief 
"avoid saying" tip, and a physical grounding action. Do not diagnose, do not suggest medication or dosages, do 
not instruct on anything beyond calm de-escalation and when to seek 
emergency help.
If the input describes physical danger, overdose signs, or a medical 
emergency, respond ONLY with: 
{"emergency": true} 
and nothing else — do not generate a script in this case.
Otherwise return only JSON: 
{"emergency": false, "script": "...", "avoid_tip": "...", "physical_action": "..."}
Keep the script under 40 words, warm, plain language, no clinical jargon. 
Language: Detect and respond in the same language as the caregiver's input (including Hinglish, Manglish, Tanglish, etc.). Match exactly.

Caregiver's input: "${cappedText}"`;

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
        console.error('Error in caregiver respond endpoint');
        res.status(500).json({ error: 'Caregiver generation failed' });
    }
});

module.exports = router;
