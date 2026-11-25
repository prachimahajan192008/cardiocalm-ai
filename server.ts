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
      message: 'Gemini API permission denied. Please verify your API key in Settings > Secrets.',
    };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('GEMINI_API_KEY')) {
    return {
      status: 400,
      message: 'Gemini API key is missing or invalid. Check Settings > Secrets.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'Rate limit or quota reached. Please wait briefly and try again.',
    };
  }
  return {
    status: 500,
    message: raw || 'Failed to generate response from Gemini.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Run a user prompt against Gemini 4 Hydrogen
  app.post('/api/gemini/run', async (req: Request, res: Response) => {
    try {
      const { systemInstruction, prompt, jsonMode } = req.body as {
        systemInstruction?: string;
        prompt?: string;
        jsonMode?: boolean;
      };

      if (!prompt || !prompt.trim()) {
        res.status(400).json({ error: 'Prompt text is required.' });
        return;
      }

      const ai = getAiClient();
      const started = Date.now();

      const config: {
        systemInstruction?: string;
        responseMimeType?: string;
      } = {};

      if (systemInstruction && systemInstruction.trim()) {
        config.systemInstruction = systemInstruction.trim();
      }
      if (jsonMode) {
        config.responseMimeType = 'application/json';
      }

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt.trim(),
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const latencyMs = Date.now() - started;
      const text = (response.text ?? '').trim();
      const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

      res.json({
        text,
        latencyMs,
        charCount: text.length,
        wordCount,
        model: MODEL_ID,
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Evaluate a prompt against a challenge brief with structured feedback
  app.post('/api/gemini/critique', async (req: Request, res: Response) => {
    try {
      const { challengeTitle, challengeBrief, systemInstruction, prompt } = req.body as {
        challengeTitle?: string;
        challengeBrief?: string;
        systemInstruction?: string;
        prompt?: string;
      };

      if (!prompt || !prompt.trim()) {
        res.status(400).json({ error: 'Draft a prompt before requesting an evaluation.' });
        return;
      }

      const ai = getAiClient();

      const evaluationRequest = [
        `Challenge Title: ${challengeTitle || 'PromptWars Open Task'}`,
        `Challenge Brief:\n${challengeBrief || 'Demonstrate prompt clarity, creative problem solving, and constraint adherence.'}`,
        `Candidate System Instruction:\n${systemInstruction?.trim() || '(None provided)'}`,
        `Candidate User Prompt:\n${prompt.trim()}`,
      ].join('\n\n');

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: evaluationRequest,
        config: {
          systemInstruction:
            'You are a strict hackathon judge and senior prompt engineer reviewing a participant prompt for PromptWars. Give direct, actionable, non-generic critique focused on task alignment, structural constraints, edge-case coverage, and clarity. Provide a concrete improved user prompt.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Two-sentence executive assessment of how well the prompt tackles the brief.',
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 specific strengths present in the candidate prompt.',
              },
              blindSpots: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 concrete ambiguities or missing constraints.',
              },
              edgeCases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 test edge cases the prompt should explicitly handle.',
              },
              improvedPrompt: {
                type: Type.STRING,
                description: 'A sharper, well-structured rewrite of the candidate user prompt.',
              },
            },
            required: ['summary', 'strengths', 'blindSpots', 'edgeCases', 'improvedPrompt'],
          },
        },
      });

      const rawJson = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawJson);
      res.json(parsed);
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Polish submission strategy writeup for clarity
  app.post('/api/gemini/polish', async (req: Request, res: Response) => {
    try {
      const { title, problemStatement, strategy, notes } = req.body as {
        title?: string;
        problemStatement?: string;
        strategy?: string;
        notes?: string;
      };

      if (!strategy || !strategy.trim()) {
        res.status(400).json({ error: 'Write a strategy draft before polishing.' });
        return;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: [
          `Project Title: ${title || 'Untitled PromptWars Entry'}`,
          `Problem Statement: ${problemStatement || 'Not specified'}`,
          `Draft Strategy:\n${strategy.trim()}`,
          `Implementation Notes:\n${notes?.trim() || 'None'}`,
        ].join('\n\n'),
        config: {
          systemInstruction:
            'Rewrite the participant submission strategy into concise, clear, judge-ready prose (120-180 words). Preserve every technical fact and never invent metrics, benchmarks, or features not present in the draft.',
        },
      });

      res.json({ polishedStrategy: (response.text ?? '').trim() });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

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
    console.log(`PromptWars Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
