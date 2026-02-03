async function testProjects() {
    try {
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

        const projectsRes = await fetch('http://localhost:5000/api/v1/projects', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const projectsData = await projectsRes.json();
        console.log('Projects:', projectsData.length);
        console.log(JSON.stringify(projectsData, null, 2));
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}
testProjects();
