const payload = {
    company: {
        name: "SARL Test Company",
        nif: "123456789012345",
        rc: "12/34-5678901B23",
        nis: "123456789012345",
        ai: "123456",
        email: "company@test.com",
        phone: "+213555555555"
    },
    admin: {
        name: "Admin Test",
        email: "admin@test.com",
        password: "password123"
    }
};

async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('Status Code:', res.status);
        console.log('Response Body:', data);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

run();
