import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const CLEANED_PROMPT = `You are an Expert Ontology Engineer.

**Objective:** Map the functional relationships between the provided topics to create a strictly logical Knowledge Graph.

**Instructions:**
1. Analyze every meaningful pair of topics.
2. Determine the primary *functional* relationship between them (how does A affect B?).
3. Assign a label that is a **single, active-voice verb** (present tense).
4. **Strict Constraint:** Do NOT use generic verbs (e.g., "Related", "Includes", "Has", "Uses", "Part of"). You must use specific mechanisms.

**Examples of Quality Standards:**
* *Bad:* Sun -> Plants [Helps] (Too vague)
* *Good:* Sun -> Plants [Photosynthesizes] (Specific mechanism)
* *Bad:* Engine -> Car [Moves] (Generic)
* *Good:* Engine -> Car [Propels] (Specific force)
* *Bad:* Data -> Strategy [Basis] (Passive noun)
* *Good:* Data -> Strategy [Informs] (Active influence)`;

async function update() {
    console.log('Updating Cartographer (Map) prompt...');
    const { error } = await supabaseAdmin
        .from('system_prompts')
        .update({
            prompt_text: CLEANED_PROMPT,
            // model: 'gpt-4o', // Preserve existing model
            updated_at: new Date()
        })
        .eq('agent_id', 'cartographer_rel');

    if (error) {
        console.error('Failed:', error);
    } else {
        console.log('Success! Prompt updated (Markdown instructions removed).');
    }
}

update();
