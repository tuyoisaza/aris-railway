
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

const EXPERIENCE_PROMPT = `
You are "The Experience Maker" of the Upgrade! OS.
Your goal is to create a deep, immersive learning session (a "Class") for a specific step in a course syllabus.

## Context
Course Title: "{{COURSE_TITLE}}"
Step Title: "{{STEP_TITLE}}"
Step Description: "{{STEP_DESC}}"
Axis: "{{AXIS_ID}}"

## Output Format (JSON)
You must output VALID JSON with the following structure:
{
  "success": true,
  "markdown_content": "# Title\n\n## Concepto...\n\n(Write a full 500-800 word lesson in Markdown. Use bolding, lists, and clear headings. Be punchy, deep, and transformational. Create an 'Experience'.)",
  "resources": [
    {
      "type": "video" | "podcast" | "article",
      "title": "Title of the resource",
      "url": "https://youtube.com/results?search_query=...",
      "description": "Why this resource matters."
    }
  ],
  "estimated_read_time": "5 min"
}

## Guidelines
1. **Tone**: Sovereign, Evolutionary, Clear, Direct. Avoid corporate jargon. Use "Upgrade! Language".
2. **Content**: 
   - Explain the "Concepto".
   - Give a "Counter-intuitive Insight" (something most people get wrong).
   - Provide a "Micro-Practice" (something they can do RIGHT NOW).
3. **Resources**: Suggest 2-3 high quality resources. 
   - Since you cannot browse the live web, generate youtube search URLs like: \`https://www.youtube.com/results?search_query=Simon+Sinek+Start+With+Why\` 
   - Or generic google search URLs for articles.
`;

async function generateLessonContent(course, stepIndex) {
    const step = course.syllabus[stepIndex];
    if (!step) throw new Error("Step not found");

    const prompt = EXPERIENCE_PROMPT
        .replace('{{COURSE_TITLE}}', course.title)
        .replace('{{STEP_TITLE}}', step.title)
        .replace('{{STEP_DESC}}', step.desc || '')
        .replace('{{AXIS_ID}}', course.category_id || 'human');

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: "Generate the class content now." }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
            temperature: 0.7
        });

        const content = completion.choices[0].message.content;
        return JSON.parse(content || '{}');
    } catch (error) {
        console.error("Experience Generation Failed:", error);
        throw error;
    }
}

async function main() {
    console.log('Fetching courses that need content population...');

    // Find seeded courses
    const { data: courses, error } = await supabase
        .from('courses')
        .select('*, categories(axis_id)')
        .eq('origin_topic', 'Seed Data');

    if (error) {
        console.error("Error fetching courses:", error);
        return;
    }

    console.log(`Found ${courses.length} seeded courses.`);

    for (const course of courses) {
        console.log(`\nChecking Course: "${course.title}"`);
        let updated = false;
        let newSyllabus = [...(course.syllabus || [])];

        for (let i = 0; i < newSyllabus.length; i++) {
            const step = newSyllabus[i];

            // If content is missing, generate it
            if (!step.content || !step.content.markdown_content) {
                console.log(`   > Generating content for Step ${i + 1}: "${step.title}"...`);
                try {
                    const content = await generateLessonContent(course, i);
                    newSyllabus[i] = { ...step, content: content };
                    updated = true;

                    // Sleep to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } catch (err) {
                    console.error(`   > Failed to generate content for step ${i}:`, err.message);
                }
            } else {
                console.log(`   > Step ${i + 1} already has content. Skipping.`);
            }
        }

        if (updated) {
            console.log(`   > Saving updates for course "${course.title}"...`);
            const { error: updateError } = await supabase
                .from('courses')
                .update({ syllabus: newSyllabus })
                .eq('id', course.id);

            if (updateError) {
                console.error(`   > Failed to save course:`, updateError);
            } else {
                console.log(`   > ✅ Saved.`);
            }
        } else {
            console.log(`   > No updates needed.`);
        }
    }
}

main();
