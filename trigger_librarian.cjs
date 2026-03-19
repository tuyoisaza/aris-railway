const LibrarianAgent = require('./server/services/ai/agents/LibrarianAgent');
const topicId = '91f8503f-9ea5-49b0-a5b0-b115d18d4132';

(async () => {
    console.log(`Triggering Librarian for ${topicId}...`);
    await LibrarianAgent.enrichTopic(topicId);
    console.log('Finished.');
})();
