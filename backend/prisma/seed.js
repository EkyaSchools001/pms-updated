const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database with test data...\n');

    try {
        // Clear existing data (optional - comment out if you want to keep existing data)
        // Clear existing data in correct order (children before parents)
        console.log('🗑️  Clearing existing test data...');
        // 1. Chat related
        await prisma.messageReaction.deleteMany({});
        await prisma.message.deleteMany({});
        await prisma.chatParticipant.deleteMany({});
        await prisma.chat.deleteMany({});

        // 2. Ticket related
        await prisma.ticketComment.deleteMany({});
        await prisma.ticket.deleteMany({});

        // 3. Project / Inventory / Finance
        await prisma.projectInventory.deleteMany({});
        await prisma.inventoryItem.deleteMany({});
        await prisma.expense.deleteMany({});
        await prisma.invoice.deleteMany({});

        // 4. Tasks and TimeLogs
        await prisma.timeLog.deleteMany({});
        await prisma.task.deleteMany({});

        // 5. Meetings related
        await prisma.meetingParticipant.deleteMany({});
        await prisma.meeting.deleteMany({});
        await prisma.roomAvailabilitySlot.deleteMany({});
        await prisma.roomBlockedSlot.deleteMany({});
        await prisma.meetingRoom.deleteMany({});

        // 6. User and System related
        await prisma.calendarShare.deleteMany({});
        await prisma.calendarView.deleteMany({});
        await prisma.auditLog.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.project.deleteMany({});
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: '@test.com'
                }
            }
        });

        // Create Users with hashed passwords
        console.log('\n👥 Creating test users...');
        const password = await bcrypt.hash('password123', 10);

        const admin = await prisma.user.create({
            data: {
                email: 'admin@test.com',
                passwordHash: password,
                fullName: 'Admin User',
                role: 'ADMIN',
            },
        });
        console.log('✅ Admin created: admin@test.com / password123');

        const manager = await prisma.user.create({
            data: {
                email: 'manager@test.com',
                passwordHash: password,
                fullName: 'Sarah Johnson',
                role: 'MANAGER',
                campusAccess: 'Main Campus,South Campus,Sarjapur Campus,Kanakapura Campus'
            },
        });
        console.log('✅ Manager created: manager@test.com / password123');

        const employee1 = await prisma.user.create({
            data: {
                email: 'john@test.com',
                passwordHash: password,
                fullName: 'John Smith',
                role: 'TEAM_MEMBER',
                department: 'IT Support',
            },
        });
        console.log('✅ Employee 1 created: john@test.com / password123');

        const employee2 = await prisma.user.create({
            data: {
                email: 'emily@test.com',
                passwordHash: password,
                fullName: 'Emily Chen',
                role: 'TEAM_MEMBER',
                department: 'IT Support',
            },
        });
        console.log('✅ Employee 2 created: emily@test.com / password123');

        const employee3 = await prisma.user.create({
            data: {
                email: 'michael@test.com',
                passwordHash: password,
                fullName: 'Michael Brown',
                role: 'TEAM_MEMBER',
                department: 'Facilities',
            },
        });
        console.log('✅ Employee 3 created: michael@test.com / password123');

        const customer = await prisma.user.create({
            data: {
                email: 'customer@test.com',
                passwordHash: password,
                fullName: 'Customer User',
                role: 'CUSTOMER',
            },
        });
        console.log('✅ Customer created: customer@test.com / password123');

        // Create Projects with Team Members
        console.log('\n📁 Creating test projects...');

        const project1 = await prisma.project.create({
            data: {
                name: 'E-Commerce Platform Redesign',
                description: 'Complete redesign of the e-commerce platform with modern UI/UX',
                status: 'IN_PROGRESS',
                managerId: manager.id,
                customerId: customer.id,
                members: {
                    connect: [
                        { id: employee1.id },
                        { id: employee2.id },
                        { id: employee3.id }
                    ],
                },
                startDate: new Date('2026-01-15'),
                endDate: new Date('2026-03-30'),
            },
            include: {
                members: true,
            },
        });
        console.log(`✅ Project 1 created: "${project1.name}" with ${project1.members.length} team members`);

        const project2 = await prisma.project.create({
            data: {
                name: 'Mobile App Development',
                description: 'Native mobile app for iOS and Android',
                status: 'IN_PROGRESS',
                managerId: manager.id,
                members: {
                    connect: [
                        { id: employee1.id },
                        { id: employee2.id }
                    ],
                },
                startDate: new Date('2026-02-01'),
                endDate: new Date('2026-05-30'),
            },
            include: {
                members: true,
            },
        });
        console.log(`✅ Project 2 created: "${project2.name}" with ${project2.members.length} team members`);

        // Create Tasks with Multiple Assignees
        console.log('\n📝 Creating test tasks...');

        const task1 = await prisma.task.create({
            data: {
                title: 'Frontend Components Development',
                description: 'Build reusable React components for the dashboard',
                priority: 'HIGH',
                status: 'IN_PROGRESS',
                projectId: project1.id,
                dueDate: new Date('2026-02-10'),
                assignees: {
                    connect: [
                        { id: employee1.id },
                        { id: employee2.id }
                    ],
                },
            },
            include: {
                assignees: true,
            },
        });
        console.log(`✅ Task 1 created: "${task1.title}" with ${task1.assignees.length} assignees`);

        const task2 = await prisma.task.create({
            data: {
                title: 'Backend API Integration',
                description: 'Integrate payment gateway and user authentication APIs',
                priority: 'CRITICAL',
                status: 'TODO',
                projectId: project1.id,
                dueDate: new Date('2026-02-15'),
                assignees: {
                    connect: [
                        { id: employee3.id }
                    ],
                },
            },
            include: {
                assignees: true,
            },
        });
        console.log(`✅ Task 2 created: "${task2.title}" with ${task2.assignees.length} assignee`);

        const task3 = await prisma.task.create({
            data: {
                title: 'User Testing Scenarios',
                description: 'Create comprehensive test cases for user flows',
                priority: 'MEDIUM',
                status: 'TODO',
                projectId: project1.id,
                dueDate: new Date('2026-02-20'),
                assignees: {
                    connect: [
                        { id: employee1.id },
                        { id: employee2.id },
                        { id: employee3.id }
                    ],
                },
            },
            include: {
                assignees: true,
            },
        });
        console.log(`✅ Task 3 created: "${task3.title}" with ${task3.assignees.length} assignees`);

        const task4 = await prisma.task.create({
            data: {
                title: 'Database Schema Design',
                description: 'Design and implement database schema for mobile app',
                priority: 'HIGH',
                status: 'IN_PROGRESS',
                projectId: project2.id,
                dueDate: new Date('2026-02-25'),
                assignees: {
                    connect: [
                        { id: employee1.id }
                    ],
                },
            },
            include: {
                assignees: true,
            },
        });
        console.log(`✅ Task 4 created: "${task4.title}" with ${task4.assignees.length} assignee`);

        // Create Private Chats
        console.log('\n💬 Creating test chats...');

        const chat1 = await prisma.chat.create({
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
                participants: {
                    include: {
                        user: true
                    }
                },
            },
        });
        console.log(`✅ Private chat created: Manager ↔ John Smith`);

        const chat2 = await prisma.chat.create({
            data: {
                type: 'PRIVATE',
                participants: {
                    create: [
                        { userId: employee1.id },
                        { userId: employee2.id },
                    ],
                },
            },
            include: {
                participants: {
                    include: {
                        user: true
                    }
                },
            },
        });
        console.log(`✅ Private chat created: John Smith ↔ Emily Chen`);

        const chat3 = await prisma.chat.create({
            data: {
                type: 'PRIVATE',
                participants: {
                    create: [
                        { userId: admin.id },
                        { userId: manager.id },
                    ],
                },
            },
            include: {
                participants: {
                    include: {
                        user: true
                    }
                },
            },
        });
        console.log(`✅ Private chat created: Admin ↔ Manager`);

        // Create Sample Messages
        console.log('\n📨 Creating sample messages...');

        await prisma.message.create({
            data: {
                content: 'Hi John! How is the frontend development going?',
                chatId: chat1.id,
                senderId: manager.id,
            },
        });

        await prisma.message.create({
            data: {
                content: 'Going well! I should have the components ready by tomorrow.',
                chatId: chat1.id,
                senderId: employee1.id,
            },
        });

        await prisma.message.create({
            data: {
                content: 'Great work on the API integration!',
                chatId: chat2.id,
                senderId: employee1.id,
            },
        });

        await prisma.message.create({
            data: {
                content: 'Thanks! Let me know if you need any help with the frontend.',
                chatId: chat2.id,
                senderId: employee2.id,
            },
        });

        console.log('✅ Sample messages created');

        // Create Meeting Rooms
        console.log('\n🏢 Creating meeting rooms...');
        const rooms = [
            { name: 'Board Room (GF)', capacity: 20, location: 'Ground Floor', type: 'MEETING' },
            { name: 'Interview Room 1', capacity: 4, location: '1st Floor', type: 'INTERVIEW' },
            { name: 'Interview Room 2', capacity: 4, location: '1st Floor', type: 'INTERVIEW' },
            { name: 'Interview Room 3', capacity: 4, location: '1st Floor', type: 'INTERVIEW' },
            { name: 'Meeting Room 3rd Floor', capacity: 10, location: '3rd Floor', type: 'MEETING' }
        ];

        for (const room of rooms) {
            await prisma.meetingRoom.create({ data: room });
        }
        console.log('✅ Meeting rooms created');

        console.log('\n✨ Database seeding completed successfully!\n');
        console.log('📋 Test Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Admin:      admin@test.com / password123');
        console.log('Manager:    manager@test.com / password123');
        console.log('Employee 1: john@test.com / password123');
        console.log('Employee 2: emily@test.com / password123');
        console.log('Employee 3: michael@test.com / password123');
        console.log('Customer:   customer@test.com / password123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
