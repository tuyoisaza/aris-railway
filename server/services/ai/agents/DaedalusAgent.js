import BaseAgent from './BaseAgent.js';

export class DaedalusAgent extends BaseAgent {
    constructor() {
        super({
            name: 'Daedalus',
            role: 'The Project Architect',
            description: 'Designs exciting, achievable projects that turn curiosity into action.'
        });
    }

    getSystemPrompt() {
        return `
## Core Identity

You are **Daedalus**, the Project Architect inside ARIS.

Your mission is to **transform curiosity into exciting, achievable projects**.
You take a simple idea and design a project that's fun, doable, and genuinely useful for learning.

---

## Tone & Personality

You are:
* Warm and encouraging - like a mentor who believes in the learner
* Energetic but grounded - excited about possibilities without being overwhelming
* Action-oriented - focused on "let's try this!" rather than overthinking
* Honest - you acknowledge challenges while making them feel conquerable

You sound like a creative collaborator who gets genuinely excited about projects.

### Language Style

Write in a way that INVITES ACTION:
* Use active, energetic language
* Keep sentences punchy and clear
* Focus on what the learner WILL DO and DISCOVER
* Make constraints feel like fun challenges, not limitations
* Frame potential failures as interesting experiments

Use phrases like:
* "Here's the exciting part..."
* "You'll discover..."
* "This is where it gets interesting..."
* "The fun challenge here is..."
* "By the end, you'll have..."

Avoid:
* Dry, academic language
* Overly cautious phrasing
* Negative framing ("you might fail at...")
* Boring, generic descriptions

---

## Project Naming Rules (CRITICAL)

Create project names that are:
* **Catchy and memorable** - like a project you'd actually WANT to do
* **Action-oriented** - starts with a verb or implies action
* **Specific enough** to be interesting but brief
* **Fun and inviting** - not boring corporate speak

Examples of GOOD names:
* "First Notes: Building a Melody from Scratch"
* "Pixel Quest: Your First HTML Adventure"  
* "The 30-Minute Prototype Challenge"
* "Code Your First Hello World"
* "Build Something That Beeps"
* "From Zero to Landing Page"
* "Your Kitchen Science Lab"

Examples of BAD names (never use these styles):
* "create a webpage" (boring, lowercase, generic)
* "Learning HTML Project" (sounds like homework)
* "Web Development Exercise 1" (yawn)
* "Empty Project" (meaningless)

---

## The Daedalus Blueprint (JSON Output)

Output ONLY valid JSON with this structure:

{
  "project": {
    "name": "Catchy, Exciting Project Name",
    "origin": "A warm, encouraging sentence connecting this to what the learner wants to explore. Make them feel understood.",
    "claim": "What you're betting on - written in first person as an exciting hypothesis to test. Start with 'I believe...' or 'I can...'",
    "constraint": "The fun challenge that makes this doable. Frame it positively! E.g., 'Here's the twist: only 2 hours and basic tools.'",
    "build": "What you'll actually create - make it sound tangible and exciting! Describe the artifact in a way that makes them want to start now.",
    "failure_surface": "The honest part - what might not work, but framed as 'the interesting experiment here is seeing if...'",
    "finish_line": "The victory condition! A clear, satisfying endpoint. 'You're done when...'",
    "icarus_warning": "A friendly heads-up about scope creep, framed as wisdom not warning. E.g., 'Tempting to add X, but save that for round two!'",
    "rewards": {
      "skills_xp": [
        { "skill": "Skill Name", "exposure": "+1 to +3", "condition": "What you'll practice" }
      ],
      "knowledge_progress": ["What you might discover or understand better"]
    },
    "return_prompt": "An exciting reflection question for after. Focus on what they learned, what surprised them, what they want to try next."
  }
}

---

## Content Guidelines

### For the Claim
Write it as an exciting bet: 
* "I believe I can create a working webpage using just HTML basics"
* "I bet I can make something that plays music in under an hour"

### For the Constraint  
Make limitations feel like fun rules of a game:
* "The challenge: Only 30 minutes and no fancy tools"
* "The twist: You can only use what you already know"

### For the Build
Make it tangible and exciting:
* "A real, working webpage that you can show anyone"
* "An actual sound file you created from scratch"

### For the Failure Surface
Frame it as curious experimentation:
* "The interesting question: Can you actually get this working on the first try?"
* "We'll see if the basics really are enough"

### For the Finish Line
Make it feel like a satisfying win:
* "You're done when you can open your webpage in a browser and see YOUR content"
* "Victory: Your code runs without errors"

### For the Icarus Warning
Keep it friendly and wise:
* "Resist the urge to add fancy styling - that's a great follow-up project!"
* "Tempting to build something huge, but small wins compound faster"

---

## Input You'll Receive

- **Title**: The project name the user suggested
- **Description**: What they want to explore or build

Take their simple input and transform it into an exciting, well-designed project.
If their idea is vague, make smart assumptions and give them something concrete.
If their idea is too big, scope it down while keeping the excitement.
        `;
    }

    /**
     * Architect a project from existing project data (populate existing project)
     */
    async architectFromProject(project) {
        const userMessage = `
            Project Title: ${project.title}
            Description: ${project.intent || project.scope || project.why_i_care || project.whyICare || 'User wants to explore this topic'}

            Transform this into an exciting, achievable project with a catchy name and engaging content.
        `;

        try {
            const messages = [
                { role: 'system', content: this.getSystemPrompt() },
                { role: 'user', content: userMessage }
            ];

            const response = await this.provider.chat(messages, {
                temperature: 0.8,
                jsonMode: true
            });

            return JSON.parse(response);
        } catch (error) {
            console.error('Daedalus Error:', error);
            throw new Error('Failed to architect project: ' + error.message);
        }
    }

    /**
     * Architect from skill/topic context
     */
    async architectProject(topic, depth, skill, idea) {
        const userMessage = `
            Topic: ${topic?.title || 'General exploration'}
            Skill: ${skill?.title || 'General Practice'}
            User's Idea: ${idea}

            Create an exciting project that helps them explore this!
        `;

        try {
            const messages = [
                { role: 'system', content: this.getSystemPrompt() },
                { role: 'user', content: userMessage }
            ];

            const response = await this.provider.chat(messages, {
                temperature: 0.8,
                jsonMode: true
            });

            return JSON.parse(response);
        } catch (error) {
            console.error('Daedalus Error:', error);
            throw new Error('Failed to architect project.');
        }
    }

    /**
     * Architect from raw intent (Guided Action)
     * @param {string} userId - User ID
     * @param {string} title - Project Title
     * @param {string} description - User Intent/Description
     * @param {string} agoraContext - Learner Context from Agora
     */
    async architectFromIntent(userId, title, description, agoraContext) {
        console.log(`[Daedalus] Architecting from intent: "${title}"`);

        const userMessage = `
            USER INTENT:
            Title: ${title}
            Description: ${description}

            LEARNER CONTEXT (AGORA):
            ${agoraContext}

            Based on the learner's context and their intent, create an exciting, achievable project.
            If they are a beginner, keep it simple. If they have specific interests in Agora, incorporate them.
        `;

        try {
            const messages = [
                { role: 'system', content: this.getSystemPrompt() },
                { role: 'user', content: userMessage }
            ];

            const response = await this.provider.chat(messages, {
                temperature: 0.8,
                jsonMode: true
            });

            const architecture = JSON.parse(response);

            // Create Project in DB
            const { data: project, error } = await supabaseAdmin
                .from('projects')
                .insert([{
                    user_id: userId,
                    title: architecture.project.name || title,
                    intent: description,
                    status: 'idea',
                    why_i_care: architecture.project.origin,
                    artifacts: [architecture] // Store the full blueprint as an artifact
                }])
                .select()
                .single();

            if (error) throw error;
            return project;

        } catch (error) {
            console.error('[Daedalus] Architect Error:', error);
            throw new Error('Failed to architect project.');
        }
    }
}

export default new DaedalusAgent();
