const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Verifying schema changes...');

    try {
        // 1. Create Users
        const admin = await prisma.user.create({
            data: {
                email: `admin-${Date.now()}@test.com`,
                passwordHash: 'hash',
                fullName: 'Admin User',
                role: 'ADMIN',
            },
        });

        const manager = await prisma.user.create({
            data: {
                email: `manager-${Date.now()}@test.com`,
                passwordHash: 'hash',
                fullName: 'Manager User',
                role: 'MANAGER',
            },
        });

        const employee1 = await prisma.user.create({
            data: {
                email: `emp1-${Date.now()}@test.com`,
                passwordHash: 'hash',
                fullName: 'Employee One',
                role: 'EMPLOYEE',
            },
        });

        const employee2 = await prisma.user.create({
            data: {
                email: `emp2-${Date.now()}@test.com`,
                passwordHash: 'hash',
                fullName: 'Employee Two',
                role: 'EMPLOYEE',
            },
        });

        console.log('Users created.');

        // 2. Create Project with Members
        const project = await prisma.project.create({
            data: {
                name: 'Test Project',
                managerId: manager.id,
                members: {
                    connect: [{ id: employee1.id }, { id: employee2.id }],
                },
            },
            include: {
                members: true,
            },
        });

        console.log(`Project created with ${project.members.length} members.`);
        if (project.members.length !== 2) throw new Error('Project members mismatch');

        // 3. Create Task with Multiple Assignees
        const task = await prisma.task.create({
            data: {
                title: 'Test Task',
                projectId: project.id,
                assignees: {
                    connect: [{ id: employee1.id }, { id: employee2.id }],
                },
            },
            include: {
                assignees: true,
            },
        });

        console.log(`Task created with ${task.assignees.length} assignees.`);
        if (task.assignees.length !== 2) throw new Error('Task assignees mismatch');

        // 4. Create Private Chat
        const chat = await prisma.chat.create({
            data: {
                type: 'PRIVATE',
                participants: {
                    create: [
                        { userId: manager.id },
                        { userId: employee1.id },
                    ],
                },
            },
            include: {
                participants: true,
            },
        });

        console.log(`Chat created with ${chat.participants.length} participants.`);

        // 5. Send Message
        const message = await prisma.message.create({
            data: {
                content: 'Hello World',
                chatId: chat.id,
                senderId: manager.id,
            },
        });

        console.log('Message sent:', message.content);

        console.log('Schema verification SUCCESS!');
    } catch (error) {
        console.error('Schema verification FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
