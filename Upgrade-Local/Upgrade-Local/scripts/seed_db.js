const { db, admin } = require('../server/db');
const { mentorsData, translations, pensum, levelingTest } = require('../server/data_seed');

async function seedDatabase() {
    console.log('Starting database seed...');

    try {
        // 1. Seed Mentors
        console.log('Seeding Mentors...');
        const mentorsBatch = db.batch();
        for (const mentor of mentorsData) {
            const ref = db.collection('mentors').doc(mentor.id);
            mentorsBatch.set(ref, mentor);
        }
        await mentorsBatch.commit();
        console.log('Mentors seeded.');

        // 2. Seed Translations
        console.log('Seeding Translations...');
        const transBatch = db.batch();
        for (const [lang, content] of Object.entries(translations)) {
            const ref = db.collection('translations').doc(lang);
            transBatch.set(ref, content);
        }
        await transBatch.commit();
        console.log('Translations seeded.');

        // 3. Seed Pensum
        console.log('Seeding Pensum...');
        const pensumBatch = db.batch();
        for (const [axisKey, axisData] of Object.entries(pensum)) {
            const ref = db.collection('pensum').doc(axisKey);
            pensumBatch.set(ref, axisData);
        }
        await pensumBatch.commit();
        console.log('Pensum seeded.');

        // 4. Seed Tests
        console.log('Seeding Tests...');
        // Saving the master test as a single document
        await db.collection('tests').doc('levelingTest').set({ questions: levelingTest });
        console.log('Tests seeded.');

        console.log('Database seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
