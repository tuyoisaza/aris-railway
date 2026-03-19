const http = require('http');

async function testChat() {
    console.log("--- Testing AI Chat Streaming ---");

    const body = JSON.stringify({
        mentorId: 'marcus',
        messages: [{ role: 'user', content: 'What is the best way to handle failure?' }]
    });

    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        res.setEncoding('utf8');

        console.log("Response Stream:");
        res.on('data', (chunk) => {
            process.stdout.write(chunk);
        });

        res.on('end', () => {
            console.log("\n\n--- Stream Completed ---");
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.write(body);
    req.end();
}

testChat();
