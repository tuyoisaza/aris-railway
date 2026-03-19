const http = require('http');

const data = JSON.stringify({
    id: 'evt_test_webhook',
    object: 'event',
});

const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/webhook/stripe',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Stripe-Signature': 't=123,v1=bad_signature' // Intentionally bad
    },
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
