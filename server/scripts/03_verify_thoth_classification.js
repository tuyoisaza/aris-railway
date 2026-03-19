import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ThothAgent from '../services/ai/agents/ThothAgent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verify() {
    const inputs = [
        "How to bake muffins",
        "Newton's Second Law",
        "Python list comprehension",
        "Building a birdhouse",
        "The causes of WWI",
        "T-Rex Anatomy"
    ];

    console.log("Verifying Thoth Classification...");
    for (const input of inputs) {
        console.log(`\nInput: "${input}"`);
        try {
            const result = await ThothAgent.classifyTopology(input);
            console.log(`Result: Domain="${result.domain}", Region="${result.region}"`);

            if (result.domain.toLowerCase() === input.toLowerCase()) {
                console.error("❌ FAILURE: Domain matches Input exactly!");
            } else {
                console.log("✅ CHECK: Domain is distinct from Input.");
            }
        } catch (e) {
            console.error("❌ ERROR:", e);
        }
    }
}

verify();
