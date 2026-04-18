/**
 * OpenAI Service — generates structured notes + MCQs for a given topic.
 *
 * The entire response is a single JSON object so we can parse it
 * deterministically without brittle string splitting.
 *
 * PostgreSQL note: when you switch the datasource to postgresql, change the
 * `notes` and `mcqs` columns in the schema from String → Json so Prisma
 * stores them as native jsonb rather than JSON strings.
 */

const OpenAI = require('openai');

// Lazily initialised so tests / imports don't blow up when the key is absent
let _client = null;
const getClient = () => {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables.');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
};

// ── Prompt ────────────────────────────────────────────────────────────────────
const buildPrompt = (topic) => `
You are an expert educator. Generate structured learning content for the topic: "${topic}".

Return ONLY a single valid JSON object — no markdown fences, no extra text — with this exact shape:

{
  "notes": {
    "topic": "<topic>",
    "summary": "<2-3 sentence overview>",
    "sections": [
      {
        "heading": "<section title>",
        "content": "<explanation paragraph>",
        "keyPoints": ["<point 1>", "<point 2>", "<point 3>"]
      }
    ],
    "glossary": [
      { "term": "<term>", "definition": "<concise definition>" }
    ],
    "resources": ["<recommended resource or search query>"]
  },
  "mcqs": [
    {
      "question": "<question text>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "answer": "<exact text of the correct option>",
      "explanation": "<why this answer is correct>"
    }
  ]
}

Rules:
- notes.sections must contain 3–5 sections.
- notes.glossary must contain 4–8 terms.
- notes.resources must contain 2–4 items.
- mcqs must contain EXACTLY 5 questions.
- Each MCQ must have EXACTLY 4 options.
- The answer field must be an exact copy of one of the options strings.
- Do NOT wrap the JSON in markdown code blocks.
`.trim();

// ── Core generation function ──────────────────────────────────────────────────
/**
 * @param {string} topic
 * @param {string} [model="gpt-4o-mini"]
 * @returns {{ notes: object, mcqs: object[], model: string, tokensUsed: number }}
 */
const generateContent = async (topic, model = 'gpt-4o-mini') => {
  const client = getClient();

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a JSON-only API. You respond exclusively with valid JSON objects — no prose, no markdown.',
      },
      { role: 'user', content: buildPrompt(topic) },
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: 'json_object' }, // forces JSON mode (supported by gpt-4o-mini+)
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('OpenAI returned an empty response.');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('OpenAI response was not valid JSON.');
  }

  // ── Structural validation ────────────────────────────────────────────────
  if (!parsed.notes || typeof parsed.notes !== 'object') {
    throw new Error('OpenAI response missing "notes" object.');
  }
  if (!Array.isArray(parsed.mcqs) || parsed.mcqs.length === 0) {
    throw new Error('OpenAI response missing "mcqs" array.');
  }

  // Validate each MCQ has required fields
  parsed.mcqs.forEach((mcq, i) => {
    if (!mcq.question || !Array.isArray(mcq.options) || !mcq.answer || !mcq.explanation) {
      throw new Error(`MCQ at index ${i} is malformed.`);
    }
    if (!mcq.options.includes(mcq.answer)) {
      throw new Error(`MCQ at index ${i}: answer "${mcq.answer}" is not in options.`);
    }
  });

  return {
    notes:      parsed.notes,
    mcqs:       parsed.mcqs,
    model,
    tokensUsed: response.usage?.total_tokens ?? null,
  };
};

module.exports = { generateContent };
