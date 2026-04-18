/**
 * Generate Controller
 *
 * POST /api/generate          — call OpenAI → save to DB → return notes + MCQs
 * GET  /api/generate/history  — paginated list (auth required)
 * GET  /api/generate/:id      — single record by ID
 *
 * Storage: Prisma GeneratedContent model (SQLite — works out of the box,
 *          no separate PostgreSQL setup needed).
 */

require('dotenv').config();

const { validationResult } = require('express-validator');
const prisma               = require('../lib/prisma');

// ── OpenAI config ─────────────────────────────────────────────────────────────
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL  = 'gpt-4o-mini';

// ── Prompt ────────────────────────────────────────────────────────────────────
function buildPrompt(topic) {
  return `
You are an expert educator and JSON API. Generate structured learning content for: "${topic}".

Return ONLY a single valid JSON object — no markdown fences, no extra prose.

Shape:
{
  "notes": "A full plain-text explanation of ${topic}. Use numbered headings like '1. Introduction', '2. Key Concepts', '3. Examples', '4. Summary'. Each section must have 2-3 detailed sentences with a concrete example.",
  "mcqs": [
    {
      "question": "A clear question about ${topic}?",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "answer": "Option A text",
      "explanation": "Why this is correct."
    }
  ]
}

Rules:
- notes is a plain string (not an object).
- mcqs has EXACTLY 5 questions.
- Each MCQ has EXACTLY 4 options.
- answer must be an exact copy of one of the options strings.
- No markdown code blocks — pure JSON only.
`.trim();
}

// ── OpenAI fetch call ─────────────────────────────────────────────────────────
async function callOpenAI(topic, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-your')) {
    const err = new Error('OPENAI_API_KEY is not configured. Add your real key to backend/.env');
    err.status = 503;
    throw err;
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a JSON-only API. Respond exclusively with valid JSON.' },
        { role: 'user',   content: buildPrompt(topic) },
      ],
      temperature:     0.7,
      max_tokens:      3000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg  = body?.error?.message || response.statusText;
    const err  = new Error(`OpenAI error (${response.status}): ${msg}`);
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }

  const data = await response.json();
  const raw  = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('OpenAI returned an empty response.');
  return { raw, tokensUsed: data.usage?.total_tokens ?? null };
}

// ── Safe JSON parse ───────────────────────────────────────────────────────────
function safeParse(raw) {
  try   { return { parsed: JSON.parse(raw), parseError: null }; }
  catch (e) {
    console.error('[generate] JSON parse failed. Raw:\n', raw);
    return { parsed: null, parseError: e.message };
  }
}

// ── Shape validation ──────────────────────────────────────────────────────────
function validateShape(parsed) {
  const errors = [];
  if (typeof parsed.notes !== 'string' || parsed.notes.trim().length < 10)
    errors.push('"notes" must be a non-empty string.');

  if (!Array.isArray(parsed.mcqs) || parsed.mcqs.length !== 5)
    errors.push('"mcqs" must be an array of exactly 5 questions.');
  else
    parsed.mcqs.forEach((mcq, i) => {
      if (!mcq.question)                                           errors.push(`mcqs[${i}]: missing question.`);
      if (!Array.isArray(mcq.options) || mcq.options.length !== 4) errors.push(`mcqs[${i}]: options must have 4 items.`);
      if (!mcq.answer)                                             errors.push(`mcqs[${i}]: missing answer.`);
      if (mcq.options && !mcq.options.includes(mcq.answer))        errors.push(`mcqs[${i}]: answer not in options.`);
    });
  return errors;
}

// ── POST /api/generate ────────────────────────────────────────────────────────
const generate = async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty())
    return res.status(422).json({ success: false, error: 'Validation failed.', details: validationErrors.array() });

  const topic  = req.body.topic?.trim();
  if (!topic)
    return res.status(400).json({ success: false, error: '"topic" is required.' });

  const model  = req.body.model || DEFAULT_MODEL;
  const userId = req.user?.id ?? null;

  // Call OpenAI
  let raw, tokensUsed;
  try {
    ({ raw, tokensUsed } = await callOpenAI(topic, model));
  } catch (err) {
    console.error('[generate] OpenAI failed:', err.message);
    return res.status(err.status || 502).json({ success: false, error: err.message });
  }

  // Parse
  const { parsed, parseError } = safeParse(raw);
  if (!parsed)
    return res.status(502).json({ success: false, error: 'OpenAI returned invalid JSON.', parseError, rawResponse: raw });

  // Validate shape
  const shapeErrors = validateShape(parsed);
  if (shapeErrors.length > 0)
    return res.status(502).json({ success: false, error: 'OpenAI response has unexpected shape.', shapeErrors, rawResponse: raw });

  // Persist to SQLite via Prisma
  let record;
  try {
    record = await prisma.generatedContent.create({
      data: {
        topic,
        notes:  parsed.notes,
        mcqs:   JSON.stringify(parsed.mcqs),
        model,
        userId,
      },
    });
  } catch (dbErr) {
    console.error('[generate] DB insert failed:', dbErr.message);
    return res.status(500).json({ success: false, error: 'Failed to save to database.', detail: dbErr.message });
  }

  return res.status(201).json({
    success: true,
    data: {
      id:         record.id,
      topic:      record.topic,
      model:      record.model,
      tokensUsed,
      notes:      parsed.notes,
      mcqs:       parsed.mcqs.map((q, i) => ({
        id:             i + 1,
        question:       q.question,
        options:        q.options,
        correct_answer: q.answer,
        explanation:    q.explanation ?? '',
      })),
      createdAt: record.createdAt,
    },
  });
};

// ── GET /api/generate/history ─────────────────────────────────────────────────
const getHistory = async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip   = (page - 1) * limit;

  try {
    const [records, total] = await Promise.all([
      prisma.generatedContent.findMany({
        where:   { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take:    limit,
        select:  { id: true, topic: true, model: true, createdAt: true },
      }),
      prisma.generatedContent.count({ where: { userId: req.user.id } }),
    ]);

    return res.json({
      success: true,
      data: {
        records,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    console.error('[generate] getHistory failed:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch history.' });
  }
};

// ── GET /api/generate/:id ─────────────────────────────────────────────────────
const getById = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, error: 'Invalid id.' });

  try {
    const record = await prisma.generatedContent.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ success: false, error: 'Handout not found.' });

    // Private records only viewable by owner
    if (record.userId && record.userId !== req.user?.id)
      return res.status(403).json({ success: false, error: 'Access denied.' });

    let mcqs;
    try   { mcqs = JSON.parse(record.mcqs); }
    catch { return res.status(500).json({ success: false, error: 'Stored MCQs are corrupted.' }); }

    return res.json({
      success: true,
      data: {
        id:        record.id,
        topic:     record.topic,
        model:     record.model,
        notes:     record.notes,
        mcqs:      mcqs.map((q, i) => ({
          id:             i + 1,
          question:       q.question,
          options:        q.options,
          correct_answer: q.answer,
          explanation:    q.explanation ?? '',
        })),
        createdAt: record.createdAt,
      },
    });
  } catch (err) {
    console.error('[generate] getById failed:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch handout.' });
  }
};

module.exports = { generate, getHistory, getById };
