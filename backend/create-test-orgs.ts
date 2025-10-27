import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get all users
  const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  const user = await prisma.user.findUnique({ where: { email: 'user@example.com' } });
  const superadmin = await prisma.user.findUnique({ where: { email: 'superadmin@example.com' } });

  if (!admin || !user || !superadmin) {
    console.log('❌ Users not found');
    return;
  }

  // Check if organizations already exist
  const existingOrgs = await prisma.organization.findMany({
    where: {
      name: {
        in: ['Admin Family', 'User Household', 'SuperAdmin Organization']
      }
    }
  });

  console.log('Creating organizations for test users...\n');

  // Create Admin's organization (if not exists)
  if (!existingOrgs.find(o => o.name === 'Admin Family')) {
    const adminOrg = await prisma.organization.create({
      data: {
        name: 'Admin Family',
        members: {
          create: {
            userId: admin.id,
            role: 'OWNER',
          }
        }
      }
    });
    console.log('✅ Created: Admin Family (Owner: admin@example.com)');
  } else {
    console.log('⏭️  Admin Family already exists');
  }

  // Create Regular User's organization
  if (!existingOrgs.find(o => o.name === 'User Household')) {
    const userOrg = await prisma.organization.create({
      data: {
        name: 'User Household',
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          }
        }
      }
    });
    console.log('✅ Created: User Household (Owner: user@example.com)');
  } else {
    console.log('⏭️  User Household already exists');
  }

  // Create SuperAdmin's organization
  if (!existingOrgs.find(o => o.name === 'SuperAdmin Organization')) {
    const superadminOrg = await prisma.organization.create({
      data: {
        name: 'SuperAdmin Organization',
        members: {
          create: {
            userId: superadmin.id,
            role: 'OWNER',
          }
        }
      }
    });
    console.log('✅ Created: SuperAdmin Organization (Owner: superadmin@example.com)');
  } else {
    console.log('⏭️  SuperAdmin Organization already exists');
  }

  console.log('\n📊 Test User Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email: admin@example.com');
  console.log('Password: Admin123!@#$');
  console.log('Organization: Admin Family (OWNER)');
  console.log('');
  console.log('Email: user@example.com');
  console.log('Password: User123!@#$');
  console.log('Organization: User Household (OWNER)');
  console.log('');
  console.log('Email: superadmin@example.com');
  console.log('Password: SuperAdmin123!@#$');
  console.log('Organization: SuperAdmin Organization (OWNER)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🎉 All users can now test the invitation system!');
  console.log('📍 Navigate to: http://localhost:4200/invite/manage');

  await prisma.$disconnect();
}

main().catch(console.error);
