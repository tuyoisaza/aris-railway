
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

async function generateLessonContent(course: any, stepIndex: number) {
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

    // Helper to extract category title safely (Mocking for test script if missing)
    let categoryName = "Testing Category";
    if (course.categories && course.categories.title) {
        categoryName = course.categories.title;
    } else if (course.category_id) {
        categoryName = course.category_id;
    }

    const finalPrompt = systemPrompt
        .replace('{{COURSE_TITLE}}', course.title)
        .replace('{{STEP_TITLE}}', step.title)
        .replace('{{STEP_DESC}}', step.desc || '')
        .replace('{{CATEGORY}}', categoryName)
        .replace('{{AXIS_ID}}', course.category_id || 'human');

    try {
        console.log("\n[DEBUG] Final System Prompt being sent (First 500 chars):");
        console.log(finalPrompt.substring(0, 500));
        console.log("...\n");
        console.log(`[DEBUG] Model: ${selectedModel}, Temp: ${temperature}`);

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
    } catch (error: any) {
        if (error.code === 'insufficient_quota') {
            console.warn("\n⚠️ OpenAI Quota Exceeded. Skipping generation.");
            console.warn("However, the PROMPT construction was successful (see above).");
            // Return a mock object so the script doesn't crash effectively
            return {
                markdown_content: "# Mock Content (Quota Exceeded)\n\nThe prompt was correct, but API failed.",
                success: false
            };
        }
        console.error("Experience Generation Failed:", error);
        throw error;
    }
}

async function main() {
    console.log("🔍 Finding a course with an existing syllabus...");

    // Fetch a course that has a syllabus
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .not('syllabus', 'is', null)
        .limit(10);

    if (error) {
        console.error("Error fetching courses:", error);
        return;
    }

    if (!courses || courses.length === 0) {
        console.error("No courses found.");
        return;
    }

    // Find a step to generate
    let targetCourse = null;
    let targetIndex = -1;

    for (const course of courses) {
        if (!Array.isArray(course.syllabus)) continue;

        for (let i = 0; i < course.syllabus.length; i++) {
            const step = course.syllabus[i];
            // Check if content is missing or we just want to overwrite for testing
            if (!step.content) {
                targetCourse = course;
                targetIndex = i;
                break;
            }
        }
        if (targetCourse) break;
    }

    // If no empty step found, just pick the first one of the first course
    if (!targetCourse) {
        console.log("⚠️ No empty steps found. Configuring to overwrite the first step of the first course.");
        targetCourse = courses[0];
        targetIndex = 0;
    }

    console.log(`\n🎯 Target Selected:\nCourse: "${targetCourse.title}" (ID: ${targetCourse.id})\nStep ${targetIndex + 1}: "${targetCourse.syllabus[targetIndex].title}"`);

    console.log("\n🚀 Generating Content with 'The Experience Maker'...");

    try {
        const content = await generateLessonContent(targetCourse, targetIndex);

        console.log("\n✅ Generation Complete!");
        console.log("---------------------------------------------------");
        console.log("MARKDOWN PREVIEW (First 500 chars):");
        console.log(content.markdown_content.substring(0, 500) + "...");
        console.log("---------------------------------------------------");

        // Check for specific headers from the new prompt
        const verifyHeaders = [
            "Propósito del Upgrade",
            "Contexto de Fricción",
            "Concepto Central",
            "Insight Contra-intuitivo",
            "Micro-Práctica",
            "Señales de Verificación"
        ];

        console.log("\n🔎 Structure Verification:");
        let allPassed = true;
        for (const header of verifyHeaders) {
            if (content.markdown_content.includes(header)) {
                console.log(`[PASS] Found header: "${header}"`);
            } else {
                console.log(`[FAIL] Missing header: "${header}"`);
                allPassed = false;
            }
        }

        if (allPassed) {
            console.log("\n✨ SUCCESS: The generated content follows the new prompt structure.");
        } else {
            console.log("\n⚠️ WARNING: Some headers were missing. Check the prompt or the AI response.");
        }

    } catch (e: any) {
        console.error("❌ Generation Failed:", e.message);
        console.error(e);
    }
}

main();
