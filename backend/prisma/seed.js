const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@pms.com' },
        update: {
            role: 'ADMIN',
            passwordHash: passwordHash
        },
        create: {
            email: 'admin@pms.com',
            fullName: 'Admin User',
            passwordHash,
            role: 'ADMIN',
        },
    });

    // 2. Create Manager
    const manager = await prisma.user.upsert({
        where: { email: 'manager@pms.com' },
        update: {
            role: 'MANAGER',
            passwordHash: passwordHash
        },
        create: {
            email: 'manager@pms.com',
            fullName: 'Project Manager',
            passwordHash,
            role: 'MANAGER',
        },
    });

    const itManager = await prisma.user.upsert({
        where: { email: 'itmanager@ekya.edu.in' },
        update: {
            role: 'MANAGER',
            passwordHash: passwordHash
        },
        create: {
            email: 'itmanager@ekya.edu.in',
            fullName: 'IT Manager',
            passwordHash,
            role: 'MANAGER',
            campusAccess: 'Campus A,Campus B,Campus C'
        },
    });


    // 3. Create Employee
    const employee = await prisma.user.upsert({
        where: { email: 'employee@pms.com' },
        update: {
            role: 'EMPLOYEE',
            passwordHash: passwordHash
        },
        create: {
            email: 'employee@pms.com',
            fullName: 'John Doe',
            passwordHash,
            role: 'EMPLOYEE',
        },
    });

    // 4. Create Customer
    const customer = await prisma.user.upsert({
        where: { email: 'customer@pms.com' },
        update: {
            role: 'CUSTOMER',
            passwordHash: passwordHash
        },
        create: {
            email: 'customer@pms.com',
            fullName: 'Acme Corp',
            passwordHash,
            role: 'CUSTOMER',
        },
    });

    // 5. Create Sample Project
    const project = await prisma.project.create({
        data: {
            name: 'Website Redesign',
            description: 'Redesigning the corporate website with modern UI/UX.',
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
            budget: 15000,
            status: 'IN_PROGRESS',
            managerId: manager.id,
            customerId: customer.id,
            tasks: {
                create: [
                    {
                        title: 'Design Homepage',
                        description: 'Create high-fidelity mockups for the homepage.',
                        priority: 'HIGH',
                        status: 'IN_PROGRESS',
                        assignees: {
                            connect: { id: employee.id }
                        },
                    },
                    {
                        title: 'Setup React App',
                        description: 'Initialize the frontend repository.',
                        priority: 'MEDIUM',
                        status: 'DONE',
                        assignees: {
                            connect: { id: employee.id }
                        },
                    },
                ],
            },
        },
    });

    console.log({ admin, manager, employee, customer, project });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
