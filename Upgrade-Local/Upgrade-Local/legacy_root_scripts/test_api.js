// using built-in fetch

async function testApi() {
    try {
        console.log('Testing API: http://localhost:8080/api/translations/es');
        const res = await fetch('http://localhost:8080/api/translations/es');
        console.log('Status:', res.status);
        if (res.ok) {
            const json = await res.json();
            console.log('Data keys:', Object.keys(json));
            console.log('nav_home:', json.nav_home);
        } else {
            console.log('Error Text:', await res.text());
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

testApi();
