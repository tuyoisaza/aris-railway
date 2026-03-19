import LibrarianAgent from './services/ai/agents/LibrarianAgent.js';
const TOPIC_ID = '461c526c-7ad3-4b29-953c-e82f1bb4e478';

async function trigger() {
    console.log(`Triggering Librarian for: ${TOPIC_ID}`);
    try {
        await LibrarianAgent.enrichTopic(TOPIC_ID);
        console.log('Finished.');
    } catch (err) {
        console.error('Error:', err);
    }
}

trigger()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });
