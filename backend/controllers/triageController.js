const { classifyTriage } = require('../services/gemini');
const User = require('../models/User');


const MAX_TEXT_LENGTH = 250;

exports.handleTriage = async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ error: 'Unauthorized role' });
        }

        const { text } = req.body;
        
        // Strict boundary: handle empty, whitespace, malformed body
        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ error: 'Valid text input is required.' });
        }

        const cappedText = text.substring(0, MAX_TEXT_LENGTH);

        let parsed;
        try {
            parsed = await classifyTriage(cappedText);
        } catch (genAiError) {
            console.error('Gemini API Error (Timeout/Rate-limit):', genAiError);
            // Handle timeout/rate-limit gracefully with HTTP 200 fallback payload
            return res.status(200).json({
                category: "HIGH",
                detected_language: "unknown",
                confidence: 1.0,
                bypassed_genai: true,
                timestamp: new Date().toISOString(),
                fallback: true,
                emergency_resources: ["112", "1800-599-0019", "14416"]
            });
        }

        // HIGH-RISK CIRCUIT BREAKER BYPASS
        if (parsed.category === 'HIGH') {
            parsed.bypassed_genai = true;
            parsed.emergency_resources = ["112", "1800-599-0019", "14416"];
            // We do not invoke any secondary generation here
        } else {
            parsed.bypassed_genai = false;
        }

        // M11: Trigger alert for MEDIUM triage
        if (parsed.category === 'MEDIUM') {
            await User.updateMany(
                { linkedPatientId: req.user._id, role: 'caregiver' },
                { $set: { pendingAlert: true, lastAlertText: cappedText } }
            );
        }

        res.status(200).json(parsed);

    } catch (err) {
        console.error('Error in triage controller:', err);
        // Fallback to 200 instead of 500 as per instructions "NEVER crash with 500 error"
        res.status(200).json({
            category: "HIGH",
            detected_language: "unknown",
            confidence: 1.0,
            bypassed_genai: true,
            timestamp: new Date().toISOString(),
            fallback: true,
            emergency_resources: ["112", "1800-599-0019", "14416"]
        });
    }
};
