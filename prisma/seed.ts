import { PrismaClient } from '@prisma/client';
import { ObjectId } from 'mongodb';
import { auth } from '../src/lib/auth';

const prisma = new PrismaClient();

async function clean() {
  console.log('🧹 Cleaning old seed data...');

  // Find and delete the seeded admin user and account
  const adminUser = await prisma.user.findUnique({
    where: { email: 'adminrathagala@gmail.com' },
    include: { accounts: true },
  });

  if (adminUser) {
    // Delete associated accounts first
    for (const account of adminUser.accounts) {
      await prisma.account.delete({
        where: { id: account.id },
      });
      console.log(`🗑️  Deleted account: ${account.id}`);
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: adminUser.id },
    });
    console.log(`🗑️  Deleted user: ${adminUser.email}`);
  } else {
    console.log('ℹ️  No seed data found to clean');
  }

  console.log('✅ Clean completed successfully!');
}

async function main() {
  // Check if clean flag is passed
  if (process.argv.includes('--clean') || process.argv.includes('-c')) {
    await clean();
    return;
  }

  console.log('🌱 Starting seed...');

  // Generate MongoDB ObjectIds for user and account
  const userId = new ObjectId().toString();
  const accountId = new ObjectId().toString();

  // Create admin user with auto-generated ID and current timestamps
  const now = new Date();
  const adminUser = await prisma.user.upsert({
    where: { email: 'adminrathagala@gmail.com' },
    update: {
      name: 'Admin User',
      emailVerified: false,
      twoFactorEnabled: false,
      role: 'admin',
      banned: false,
      updatedAt: now,
    },
    create: {
      id: userId,
      name: 'Admin User',
      email: 'adminrathagala@gmail.com',
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      twoFactorEnabled: false,
      role: 'admin',
      banned: false,
    },
  });

  console.log('✅ Admin user created:', adminUser);

  // Hash the password using better-auth's hash function
  const plainPassword = 'AVSh1454525';
  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(plainPassword);

  // Check if account already exists for this user
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: adminUser.id,
      providerId: 'credential',
    },
  });

  let adminAccount;
  if (existingAccount) {
    // Update existing account
    adminAccount = await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        accountId: adminUser.id,
        providerId: 'credential',
        password: hashedPassword,
        updatedAt: now,
      },
    });
    console.log('✅ Admin account updated:', adminAccount);
  } else {
    // Create new account with auto-generated ID
    adminAccount = await prisma.account.create({
      data: {
        id: accountId,
        accountId: adminUser.id,
        providerId: 'credential',
        userId: adminUser.id,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log('✅ Admin account created:', adminAccount);
  }
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
