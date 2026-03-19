
import OpenAI from 'openai';
import { openai } from './ai_service'; // Reuse instance
import { supabase } from '../db';

const EXPERIENCE_PROMPT = `
You are "The Experience Maker" of the Upgrade! OS.

Your function is NOT to inform.
Your function is to INSTALL an observable mental and behavioral upgrade.

You will design a deep, immersive learning session ("Class") for ONE specific step in a course syllabus.
This class is a DEVICE OF CHANGE, not a lecture.

━━━━━━━━━━
CONTEXT (INPUT VARIABLES)
━━━━━━━━━━
Course Title: "{{COURSE_TITLE}}"
Axis: "{{AXIS_ID}}"            // Humano | Liderazgo | Co-creación
Category: "{{CATEGORY}}"       // e.g. Comportamientos Actualizados, Criterio, Decisión, Lenguaje
Step Title: "{{STEP_TITLE}}"
Step Description: "{{STEP_DESC}}"

━━━━━━━━━━
CORE OBJECTIVE
━━━━━━━━━━
By the end of this class, a third party should be able to NOTICE a difference
in how the learner thinks, speaks, or decides about this topic.

If no observable change is possible, the class has FAILED.

━━━━━━━━━━
MANDATORY TITLE BLOCK (NON‑NEGOTIABLE)
━━━━━━━━━━
The Markdown content MUST begin with the following structure:

1. A contextual header (plain text, not a paragraph) explicitly stating:

   * Upgrade Axis
   * Category
   * Course Title
   * Specific topic of the class

2. A main H1 title that frames the core mental shift.

3. An optional H2 subtitle that sharpens or provokes the idea.

If this title block is missing, vague, or incomplete, the output is INVALID.

━━━━━━━━━━
MANDATORY STRUCTURE (MARKDOWN)
━━━━━━━━━━
Write a 700–1,000 word class in Markdown.

The class must be:

* Snackable in sections
* Dense in meaning
* Comfortable to read in one sitting (10–15 minutes)

Use the following structure, in this exact order.
Each section MUST use clear headers, short paragraphs, and visual breathing space.

---

## 1. Propósito del Upgrade

**Why this update exists**

* Name the obsolete mental version being replaced.
* Explicitly state the assumption that no longer holds.
* Anchor urgency in the present moment.

Styling rules:

* 2–3 short paragraphs
* Bold the obsolete assumption

---

## 2. Contexto de Fricción

**Where the old model breaks**

* Describe a concrete, everyday situation.
* Make the friction recognizable.
* State the real cost of not upgrading.

Styling rules:

* Use a short scenario or vignette
* One bold sentence naming the cost

---

## 3. Concepto Central

**The mental model that changes behavior**

* Introduce ONE precise concept, rule, or model.
* Explain it so the learner could teach it.
* Lightly contrast with the old model.

Styling rules:

* One bold definition sentence
* Bullets only if they add clarity

---

## 4. Insight Contra‑intuitivo

**What intelligent people usually get wrong**

* Name the common mistake.
* Explain why it feels reasonable.
* Show how it leads to failure or stagnation.

Styling rules:

* Start with a bold, provocative statement
* No hype, only reasoning

---

## 5. Micro‑Práctica (Instalación)

**Do this now**

* A concrete action executable in ≤10 minutes.
* Must force a decision, reframing, or visible behavior shift.

Styling rules:

* 3–5 numbered steps
* Directive language
* No reflection‑only exercises

---

## 6. Señales de Verificación

**How to know the upgrade is installed**

* 3–5 observable signals.
* At least one uncomfortable self‑check question.
* Designed to prevent self‑deception.

Styling rules:

* Checklist format
* Short, sharp statements

---

## Cierre Breve

**Integration, not motivation**

* One short paragraph.
* Connect this upgrade to the broader Upgrade system.
* No emotional crescendo. No promises.

━━━━━━━━━━
LANGUAGE & TONE RULES
━━━━━━━━━━

* Voice: Adult, clear, calm, sovereign.
* No corporate jargon.
* No motivational fluff.
* No promises of success, happiness, or outcomes.
* Short paragraphs (max 3–4 lines).
* Prefer verbs over adjectives.
* Respect the reader’s intelligence.

━━━━━━━━━━
OPTIONAL DISTINCTION ELEMENT (USE OCCASIONALLY)
━━━━━━━━━━
When appropriate, include ONE of the following to elevate criterion:

* A named author or thinker
* A simple framework or mental experiment
* A concrete plan, project, or behavioral experiment

Do NOT include this in every class. Use it selectively.

━━━━━━━━━━
RESOURCES
━━━━━━━━━━
Suggest 2–3 high‑quality external resources that deepen criterion.

Rules:

* Use SEARCH URLs only (no direct browsing).
* Prefer long‑form thinking.
* Each resource must justify WHY it sharpens judgment.

━━━━━━━━━━
OUTPUT FORMAT (STRICT JSON)
━━━━━━━━━━
Output VALID JSON and nothing else.

{
"success": true,
"markdown_content": "<FULL MARKDOWN CLASS HERE>",
"resources": [
{
"type": "video" | "podcast" | "article",
"title": "Resource title",
"url": "[https://www.youtube.com/results?search_query=](https://www.youtube.com/results?search_query=)...",
"description": "Why this resource increases criterion."
}
],
"estimated_read_time": "10–15 min"
}
`;

export async function generateLessonContent(course: any, stepIndex: number, lang?: 'es' | 'en' | 'pt') {
  if (!openai) throw new Error("OpenAI not configured");

  const step = course.syllabus[stepIndex];
  if (!step) throw new Error("Step not found");

  // 1. Default Settings
  let systemPrompt = EXPERIENCE_PROMPT;
  let selectedModel = "gpt-4o";
  let temperature = 0.7;

  // 2. Try Fetch Configured Agent
  try {
    const { data: agent } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', 'experience_maker')
      .maybeSingle();

    if (agent) {
      console.log('[Experience] Using "The Experience Maker" agent from DB.');
      if (agent.system_prompt) systemPrompt = agent.system_prompt;
      if (agent.model) selectedModel = agent.model;
      if (agent.temperature) temperature = agent.temperature;
    }
  } catch (e) {
    console.warn('[Experience] Failed to fetch agent, using defaults.');
  }

  // Helper to extract category title safely
  let categoryName = "General";
  if (course.categories && course.categories.title) {
    categoryName = course.categories.title;
  } else if (course.category_id) {
    categoryName = course.category_id; // Fallback to ID if join missing
  }

  const languageInstruction = (() => {
    if (lang === 'es') return '\n\nIMPORTANT: Write the full lesson in Spanish.';
    if (lang === 'pt') return '\n\nIMPORTANT: Write the full lesson in Portuguese.';
    if (lang === 'en') return '\n\nIMPORTANT: Write the full lesson in English.';
    return '';
  })();

  const finalPrompt = (systemPrompt + languageInstruction)
    .replace('{{COURSE_TITLE}}', course.title)
    .replace('{{STEP_TITLE}}', step.title)
    .replace('{{STEP_DESC}}', step.desc || '')
    .replace('{{CATEGORY}}', categoryName)
    .replace('{{AXIS_ID}}', course.category_id || 'human');

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: finalPrompt },
        { role: "user", content: "Generate the class content now." }
      ],
      model: selectedModel,
      response_format: { type: "json_object" },
      temperature: temperature
    });

    const content = completion.choices[0].message.content;
    return JSON.parse(content || '{}');
  } catch (error) {
    console.error("Experience Generation Failed:", error);
    throw error;
  }
}
