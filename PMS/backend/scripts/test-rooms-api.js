async function testApi() {
    try {
        // Login as admin
        const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@test.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful');

        // Fetch rooms
        const roomsRes = await fetch('http://localhost:5000/api/v1/rooms', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const roomsData = await roomsRes.json();
        console.log('Rooms received:', roomsData.length);
        console.log(JSON.stringify(roomsData, null, 2));
    } catch (error) {
        console.error('API Test failed:', error.message);
    }
}

testApi();
