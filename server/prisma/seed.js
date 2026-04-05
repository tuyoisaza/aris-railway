import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '../.env' });
dotenv.config({ path: './.env' });

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seed...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@aris.app' },
        update: {},
        create: {
            email: 'admin@aris.app',
            password: adminPassword,
            name: 'Admin',
            role: 'admin',
            plan: 'premium'
        }
    });
    console.log('Created admin user:', admin.email);

    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@aris.app' },
        update: {},
        create: {
            email: 'demo@aris.app',
            password: userPassword,
            name: 'Demo User',
            role: 'user',
            plan: 'free'
        }
    });
    console.log('Created demo user:', demoUser.email);

    const topics = [
        { title: 'Mathematics', category: 'Academic', description: 'Numbers, algebra, geometry, and more', depth: 1 },
        { title: 'Reading', category: 'Academic', description: 'Literacy and comprehension skills', depth: 1 },
        { title: 'Science', category: 'Academic', description: 'Natural sciences and experiments', depth: 1 },
        { title: 'Programming', category: 'Technical', description: 'Coding and software development', depth: 1 },
        { title: 'Art', category: 'Creative', description: 'Drawing, painting, and creativity', depth: 1 },
        { title: 'Music', category: 'Creative', description: 'Instruments, rhythm, and melody', depth: 1 },
        { title: 'Problem Solving', category: 'Cognitive', description: 'Critical thinking and puzzles', depth: 1 },
        { title: 'Communication', category: 'Social', description: 'Language and expression skills', depth: 1 }
    ];

    for (const topicData of topics) {
        const topic = await prisma.topic.upsert({
            where: { id: topicData.title.toLowerCase().replace(/\s+/g, '-') },
            update: topicData,
            create: {
                id: topicData.title.toLowerCase().replace(/\s+/g, '-'),
                ...topicData
            }
        });
        console.log('Created topic:', topic.title);
    }

    const skills = [
        { title: 'Basic Math', category: 'Cognitive', description: 'Addition, subtraction, multiplication, division', depth: 1 },
        { title: 'Reading Comprehension', category: 'Cognitive', description: 'Understanding written text', depth: 1 },
        { title: 'Typing', category: 'Technical', description: 'Keyboard skills and speed', depth: 1 },
        { title: 'Drawing', category: 'Creative', description: 'Visual art and illustration', depth: 1 },
        { title: 'Listening', category: 'Social', description: 'Active listening skills', depth: 1 }
    ];

    for (const skillData of skills) {
        const skill = await prisma.skill.upsert({
            where: { id: skillData.title.toLowerCase().replace(/\s+/g, '-') },
            update: skillData,
            create: {
                id: skillData.title.toLowerCase().replace(/\s+/g, '-'),
                ...skillData
            }
        });
        console.log('Created skill:', skill.title);
    }

    const systemPrompts = [
        {
            name: 'teacher',
            content: `You are ARIS, a friendly AI learning companion. Help users learn through conversation and exploration.

## Output Format
You must ALWAYS return valid JSON with this structure:
{
  "response": "Your conversational response (3-6 sentences)",
  "options": ["Option 1", "Option 2", "Option 3"],
  "action": null OR { "type": "guided_action_type", "payload": {...}, "intent": "user intent description" }
}

## Guided Actions
You can suggest these actions when the user indicates specific intents:

1. **topic** - User wants to learn about a NEW SUBJECT/TOPIC
   → Set action: { "type": "topic", "payload": { "title": "Topic Name", "category": "Category" }, "intent": "why user wants to learn this" }

2. **project** - User wants to BUILD or CREATE something practical
   → Set action: { "type": "project", "payload": { "title": "Project Name", "description": "what they want to build" }, "intent": "user's goal" }

3. **skill** - User wants to PRACTICE or TRACK a practical skill
   → Set action: { "type": "skill", "payload": { "name": "Skill Name", "category": "Category" }, "intent": "how they want to practice" }

4. **conversation** - User wants to START A NEW CONVERSATION or CHANGE TOPICS
   → Set action: { "type": "conversation", "payload": { "title": "New Topic" }, "intent": "new direction" }

## When to Suggest Actions
- ONLY suggest an action when the user clearly indicates the intent
- Do NOT over-suggest - wait for genuine signals from the user
- Examples of good triggers:
  * "I want to learn about cooking" → topic
  * "I want to build a website" → project
  * "I practiced guitar today" → skill
  * "Let's talk about something else" → conversation

Set action to null if no clear guided action intent is detected.`,
            version: 1,
            active: true
        },
        {
            name: 'cartographer',
            content: 'You help map learning paths and suggest new topics based on user interests.',
            version: 1,
            active: true
        }
    ];

    for (const prompt of systemPrompts) {
        await prisma.systemPrompt.upsert({
            where: { name: prompt.name },
            update: { content: prompt.content },
            create: prompt
        });
        console.log('Created system prompt:', prompt.name);
    }

    console.log('Database seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
