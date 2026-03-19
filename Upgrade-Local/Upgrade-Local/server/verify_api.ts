
async function verify() {
    const BASE_URL = 'http://localhost:8080/api';
    const HEADERS = {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
    };

    console.log("Starting API Verification...");

    // 1. Check Public Settings
    try {
        const res = await fetch(`${BASE_URL}/settings`);
        const data = await res.json();
        console.log("1. Public Settings:", res.status === 200 ? "OK" : "FAIL", data);
    } catch (e) {
        console.error("1. Public Settings: ERROR", e);
    }

    // 2. Check Admin Users
    try {
        const res = await fetch(`${BASE_URL}/admin/users?limit=5`, { headers: HEADERS });
        const data = await res.json();
        console.log("2. Admin Users:", res.status === 200 ? "OK" : "FAIL", Array.isArray(data) ? `Found ${data.length} users` : data);
    } catch (e) {
        console.error("2. Admin Users: ERROR", e);
    }

    // 3. Check Admin System Settings
    try {
        const res = await fetch(`${BASE_URL}/admin/system/settings`, { headers: HEADERS });
        const data = await res.json();
        console.log("3. Admin Settings:", res.status === 200 ? "OK" : "FAIL", data);
    } catch (e) {
        console.error("3. Admin Settings: ERROR", e);
    }

    // 4. Check Admin Logs
    try {
        const res = await fetch(`${BASE_URL}/admin/system/logs`, { headers: HEADERS });
        const data = await res.json();
        console.log("4. Admin Logs:", res.status === 200 ? "OK" : "FAIL", Array.isArray(data) ? `Found ${data.length} logs` : data);
    } catch (e) {
        console.error("4. Admin Logs: ERROR", e);
    }
}

verify();
