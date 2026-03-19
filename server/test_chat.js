import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

console.log("Environment:");
console.log("- SUPABASE_URL:", supabaseUrl ? "[SET]" : "[MISSING]");
console.log("- OPENAI_API_KEY:", openaiKey ? "[SET]" : "[MISSING]");

if (!openaiKey) {
    console.error("CRITICAL: OPENAI_API_KEY is missing. AI will not answer.");
    process.exit(1);
}

// Test Teacher Agent directly
import TeacherAgent from './services/ai/agents/TeacherAgent.js';

async function testTeacher() {
    console.log("\nTesting Teacher Agent Chat...");
    try {
        const response = await TeacherAgent.chat("Hola, ¿quién eres?", []);
        console.log("Teacher Response:", response);
    } catch (err) {
        console.error("Teacher Error:", err.message);
    }
}

testTeacher();
