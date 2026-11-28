import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_ID = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return {
      status: 403,
      message: 'Service permission denied. Please verify your API key in Settings > Secrets.',
    };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('GEMINI_API_KEY')) {
    return {
      status: 400,
      message: 'API key is missing or invalid. Check Settings > Secrets.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'Rate limit reached. Please wait briefly and try again.',
    };
  }
  return {
    status: 500,
    message: raw || 'Failed to complete request.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Pillar 1: Cardiac event risk prediction & triage assessment
  app.post('/api/gemini/cardiac-assess', async (req: Request, res: Response) => {
    try {
      const {
        heartRate,
        hrvMs,
        systolicBp,
        diastolicBp,
        spo2,
        symptoms,
        contextNotes,
      } = req.body as {
        heartRate?: number;
        hrvMs?: number;
        systolicBp?: number;
        diastolicBp?: number;
        spo2?: number;
        symptoms?: string[];
        contextNotes?: string;
      };

      const ai = getAiClient();
      const vitalsSummary = [
        `Heart Rate: ${heartRate ?? 74} bpm`,
        `HRV (RMSSD): ${hrvMs ?? 48} ms`,
        `Blood Pressure: ${systolicBp ?? 118}/${diastolicBp ?? 76} mmHg`,
        `SpO2: ${spo2 ?? 98}%`,
        `Reported Symptoms: ${symptoms && symptoms.length > 0 ? symptoms.join(', ') : 'None reported'}`,
        `Context: ${contextNotes?.trim() || 'Resting baseline'}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: `Assess the following personal wearable & symptom snapshot for potential cardiac event warning signs:\n\n${vitalsSummary}`,
        config: {
          systemInstruction:
            'You are CardioCalm, a personal cardiac safety triage agent. Analyze wearable vitals and self-reported symptoms to identify early warning patterns, suggest safe immediate steps (sit/rest, avoid exertion), and classify escalation clearly. Keep tone calm, factual, and reassuring—never alarmist. Never claim a definitive medical diagnosis; frame outputs as early risk triage.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskTier: {
                type: Type.STRING,
                description: 'Must be exactly one of: Nominal, Elevated, High Alert',
              },
              headline: {
                type: Type.STRING,
                description: 'Concise 1-sentence triage summary.',
              },
              earlySignals: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-4 specific physiological or symptom observations.',
              },
              immediateGuidance: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 safe, clear immediate actions for the patient.',
              },
              escalationAction: {
                type: Type.STRING,
                description:
                  'Must be one of: Monitor & Rest, Consult Physician Promptly, Activate Emergency Protocol',
              },
              calmingOpening: {
                type: Type.STRING,
                description:
                  'A gentle, grounding 2-sentence message addressed directly to the patient to reduce panic.',
              },
            },
            required: [
              'riskTier',
              'headline',
              'earlySignals',
              'immediateGuidance',
              'escalationAction',
              'calmingOpening',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Pillar 2: Calming & grounding patient dialogue
  app.post('/api/gemini/calm-chat', async (req: Request, res: Response) => {
    try {
      const { message, vitalsSummary, riskTier, history } = req.body as {
        message?: string;
        vitalsSummary?: string;
        riskTier?: string;
        history?: { role: string; text: string }[];
      };

      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message text is required.' });
        return;
      }

      const ai = getAiClient();
      const historyBlock = (history ?? [])
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'Patient' : 'CardioCalm'}: ${m.text}`)
        .join('\n');

      const prompt = [
        `Current Triage Tier: ${riskTier || 'Not yet assessed'}`,
        `Current Vitals: ${vitalsSummary || 'Not specified'}`,
        historyBlock ? `Recent Dialogue:\n${historyBlock}` : '',
        `Patient says: "${message.trim()}"`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          systemInstruction:
            'You are CardioCalm, a compassionate cardiac safety companion. Speak in short, warm, grounding sentences (max 80 words). Acknowledge how they feel, guide slow breathing or comfortable seated posture, and remind them cleanly if emergency escalation is active without causing panic.',
        },
      });

      res.json({ reply: (response.text ?? '').trim() });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Pillar 3: Emergency response & EMS coordination packet
  app.post('/api/gemini/dispatch-brief', async (req: Request, res: Response) => {
    try {
      const {
        patientName,
        locationNote,
        emergencyContact,
        medicalNotes,
        vitalsSummary,
        symptoms,
        riskTier,
      } = req.body as {
        patientName?: string;
        locationNote?: string;
        emergencyContact?: string;
        medicalNotes?: string;
        vitalsSummary?: string;
        symptoms?: string[];
        riskTier?: string;
      };

      const ai = getAiClient();
      const payload = [
        `Patient: ${patientName || 'Patient'}`,
        `Location: ${locationNote || 'Current home address / GPS shared'}`,
        `Emergency Contact: ${emergencyContact || 'Primary family contact'}`,
        `Medical History / Meds / Allergies: ${medicalNotes || 'None listed'}`,
        `Triage Tier: ${riskTier || 'High Alert'}`,
        `Vitals: ${vitalsSummary || 'Unavailable'}`,
        `Symptoms: ${symptoms && symptoms.length > 0 ? symptoms.join(', ') : 'Acute cardiac concern'}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: `Generate an emergency coordination packet for EMS dispatch and the patient's emergency contact based on:\n\n${payload}`,
        config: {
          systemInstruction:
            'You are an emergency care coordination assistant. Produce crisp, scannable, zero-fluff handoff communications suitable for an EMS dispatcher and a family emergency contact.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emsScript: {
                type: Type.STRING,
                description: 'Structured dispatcher/paramedic summary under 100 words.',
              },
              contactAlertMessage: {
                type: Type.STRING,
                description: 'Clear, calm SMS/alert text for the emergency contact with location and status.',
              },
              responderChecklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-4 practical steps while awaiting responders (e.g. unlock front door, keep phone audible).',
              },
            },
            required: ['emsScript', 'contactAlertMessage', 'responderChecklist'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Trial & Clinical Demo Inquiry Endpoint
  app.post('/api/inquiries', (req: Request, res: Response) => {
    const { fullName, email, planName, wearable, inquiryType } = req.body as {
      fullName?: string;
      email?: string;
      planName?: string;
      wearable?: string;
      inquiryType?: string;
    };

    if (!fullName || !fullName.trim()) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    res.json({
      confirmed: true,
      referenceCode: `CC-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: fullName.trim(),
      email: email.trim(),
      planName: planName || 'Individual Care',
      wearable: wearable || 'Apple Watch',
      inquiryType: inquiryType || 'trial',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CardioCalm server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
