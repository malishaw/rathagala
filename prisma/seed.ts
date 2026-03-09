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

  // Seed vehicle models provided by user
  try {
    console.log('🌱 Seeding vehicle models...');
    const vehicleModels = [
      { brand: 'Toyota', name: 'Corolla' },
      { brand: 'Toyota', name: 'Camry' },
      { brand: 'Toyota', name: 'Hilux' },
      { brand: 'Honda', name: 'Civic' },
      { brand: 'Honda', name: 'Accord' },
      { brand: 'Honda', name: 'CR-V' },
      { brand: 'Nissan', name: 'Sunny' },
      { brand: 'Nissan', name: 'X-Trail' },
      { brand: 'Nissan', name: 'Patrol' },
      { brand: 'BMW', name: '3 Series' },
      { brand: 'BMW', name: '5 Series' },
      { brand: 'BMW', name: 'X5' },
      { brand: 'Mercedes-Benz', name: 'C-Class' },
      { brand: 'Mercedes-Benz', name: 'E-Class' },
      { brand: 'Mercedes-Benz', name: 'G-Class' },
      { brand: 'Land Rover', name: 'Range Rover' },
      { brand: 'Land Rover', name: 'Defender' },
      { brand: 'Land Rover', name: 'Discovery' },
      { brand: 'Aprilia', name: 'RS 660' },
      { brand: 'Aprilia', name: 'Tuono 660' },
      { brand: 'Aprilia', name: 'RSV4' },
      { brand: 'Ashok Leyland', name: 'Dost' },
      { brand: 'Ashok Leyland', name: 'Partner' },
      { brand: 'Ashok Leyland', name: 'Boss Truck' },
      { brand: 'Aston Martin', name: 'DB11' },
      { brand: 'Aston Martin', name: 'Vantage' },
      { brand: 'Aston Martin', name: 'DBS Superleggera' },
      { brand: 'Atco', name: 'Balmoral' },
      { brand: 'Atco', name: 'Royale' },
      { brand: 'Atco', name: 'Windsor' },
      { brand: 'Ather', name: '450X' },
      { brand: 'Ather', name: '450 Plus' },
      { brand: 'Audi', name: 'A4' },
      { brand: 'Audi', name: 'A6' },
      { brand: 'Audi', name: 'Q7' },
      { brand: 'Austin', name: 'Mini' },
      { brand: 'Austin', name: 'A40' },
      { brand: 'Austin', name: 'A110' },
      { brand: 'BAIC', name: 'BJ40' },
      { brand: 'BAIC', name: 'X55' },
      { brand: 'BAIC', name: 'EU5' },
      { brand: 'Bajaj', name: 'Pulsar' },
      { brand: 'Bajaj', name: 'Discover' },
      { brand: 'Bajaj', name: 'Dominar' },
      { brand: 'Bentley', name: 'Continental GT' },
      { brand: 'Bentley', name: 'Bentayga' },
      { brand: 'Bentley', name: 'Flying Spur' },
      { brand: 'Borgward', name: 'BX5' },
      { brand: 'Borgward', name: 'BX7' },
      { brand: 'BYD', name: 'Atto 3' },
      { brand: 'BYD', name: 'Dolphin' },
      { brand: 'BYD', name: 'Seal' },
      { brand: 'Cadillac', name: 'Escalade' },
      { brand: 'Cadillac', name: 'CT5' },
      { brand: 'Cadillac', name: 'XT5' },
      { brand: 'CAT', name: '320D Excavator' },
      { brand: 'CAT', name: '950 Loader' },
      { brand: 'Changan', name: 'CS35' },
      { brand: 'Changan', name: 'CS75' },
      { brand: 'Changan', name: 'Alsvin' },
      { brand: 'Chery', name: 'Tiggo 2' },
      { brand: 'Chery', name: 'Tiggo 7' },
      { brand: 'Chery', name: 'Arrizo 5' },
      { brand: 'Chevrolet', name: 'Cruze' },
      { brand: 'Chevrolet', name: 'Camaro' },
      { brand: 'Chevrolet', name: 'Silverado' },
      { brand: 'Chrysler', name: '300' },
      { brand: 'Chrysler', name: 'Pacifica' },
      { brand: 'Citroen', name: 'C3' },
      { brand: 'Citroen', name: 'C4' },
      { brand: 'Citroen', name: 'C5 Aircross' },
      { brand: 'Daewoo', name: 'Matiz' },
      { brand: 'Daewoo', name: 'Lanos' },
      { brand: 'Daewoo', name: 'Nubira' },
      { brand: 'Daihatsu', name: 'Mira' },
      { brand: 'Daihatsu', name: 'Terios' },
      { brand: 'Daihatsu', name: 'Tanto' },
      { brand: 'Datsun', name: 'Go' },
      { brand: 'Datsun', name: 'Redi-Go' },
      { brand: 'DFSK', name: 'Glory 580' },
      { brand: 'DFSK', name: 'Glory 330' },
      { brand: 'Ducati', name: 'Panigale V4' },
      { brand: 'Ducati', name: 'Monster' },
      { brand: 'Ducati', name: 'Multistrada' },
      { brand: 'Fiat', name: 'Punto' },
      { brand: 'Fiat', name: '500' },
      { brand: 'Fiat', name: 'Panda' },
      { brand: 'Ford', name: 'Ranger' },
      { brand: 'Ford', name: 'Mustang' },
      { brand: 'Ford', name: 'Everest' },
      { brand: 'Hero', name: 'Splendor' },
      { brand: 'Hero', name: 'HF Deluxe' },
      { brand: 'Hero', name: 'Xpulse 200' },
      { brand: 'Alfa Romeo', name: 'Giulia' },
      { brand: 'Alfa Romeo', name: 'Stelvio' },
      { brand: 'Hyundai', name: 'Elantra' },
      { brand: 'Hyundai', name: 'Tucson' },
      { brand: 'Hyundai', name: 'Santa Fe' },
      { brand: 'Isuzu', name: 'D-Max' },
      { brand: 'Isuzu', name: 'MU-X' },
      { brand: 'Jaguar', name: 'XF' },
      { brand: 'Jaguar', name: 'F-Pace' },
      { brand: 'Jaguar', name: 'XJ' },
      { brand: 'Jeep', name: 'Wrangler' },
      { brand: 'Jeep', name: 'Grand Cherokee' },
      { brand: 'Jeep', name: 'Compass' },
      { brand: 'Kawasaki', name: 'Ninja 400' },
      { brand: 'Kawasaki', name: 'Ninja ZX-10R' },
      { brand: 'Kawasaki', name: 'Z900' },
      { brand: 'Kia', name: 'Sportage' },
      { brand: 'Kia', name: 'Sorento' },
      { brand: 'Kia', name: 'Picanto' },
      { brand: 'KTM', name: 'Duke 200' },
      { brand: 'KTM', name: 'Duke 390' },
      { brand: 'KTM', name: 'RC 390' },
      { brand: 'Lexus', name: 'RX' },
      { brand: 'Lexus', name: 'LX' },
      { brand: 'Lexus', name: 'ES' },
      { brand: 'Mahindra', name: 'Scorpio' },
      { brand: 'Mahindra', name: 'Thar' },
      { brand: 'Mahindra', name: 'XUV700' },
      { brand: 'Mazda', name: 'Mazda 3' },
      { brand: 'Mazda', name: 'Mazda 6' },
      { brand: 'Mazda', name: 'CX-5' },
      { brand: 'Micro', name: 'Panda' },
      { brand: 'Micro', name: 'Tivoli' },
      { brand: 'Mini', name: 'Cooper' },
      { brand: 'Mini', name: 'Countryman' },
      { brand: 'Mitsubishi', name: 'Lancer' },
      { brand: 'Mitsubishi', name: 'Pajero' },
      { brand: 'Mitsubishi', name: 'Outlander' },
      { brand: 'Perodua', name: 'Axia' },
      { brand: 'Perodua', name: 'Myvi' },
      { brand: 'Perodua', name: 'Bezza' },
      { brand: 'Peugeot', name: '208' },
      { brand: 'Peugeot', name: '3008' },
      { brand: 'Peugeot', name: '508' },
      { brand: 'Porsche', name: '911' },
      { brand: 'Porsche', name: 'Cayenne' },
      { brand: 'Porsche', name: 'Macan' },
      { brand: 'Proton', name: 'Saga' },
      { brand: 'Proton', name: 'Persona' },
      { brand: 'Proton', name: 'X70' },
      { brand: 'Renault', name: 'Kwid' },
      { brand: 'Renault', name: 'Duster' },
      { brand: 'Renault', name: 'Megane' },
      { brand: 'Skoda', name: 'Octavia' },
      { brand: 'Skoda', name: 'Superb' },
      { brand: 'Skoda', name: 'Kodiaq' },
      { brand: 'Subaru', name: 'Impreza' },
      { brand: 'Subaru', name: 'Forester' },
      { brand: 'Subaru', name: 'Outback' },
      { brand: 'Suzuki', name: 'Alto' },
      { brand: 'Suzuki', name: 'Swift' },
      { brand: 'Suzuki', name: 'Wagon R' },
      { brand: 'Tata', name: 'Nano' },
      { brand: 'Tata', name: 'Nexon' },
      { brand: 'Tata', name: 'Harrier' },
      { brand: 'Tesla', name: 'Model 3' },
      { brand: 'Tesla', name: 'Model S' },
      { brand: 'Tesla', name: 'Model Y' },
      { brand: 'Acura', name: 'TLX' },
      { brand: 'Acura', name: 'MDX' },
      { brand: 'TVS', name: 'Apache RTR 160' },
      { brand: 'TVS', name: 'Ntorq 125' },
      { brand: 'Volkswagen', name: 'Golf' },
      { brand: 'Volkswagen', name: 'Passat' },
      { brand: 'Volkswagen', name: 'Tiguan' },
      { brand: 'Volvo', name: 'XC60' },
      { brand: 'Volvo', name: 'XC90' },
      { brand: 'Volvo', name: 'S60' },
      { brand: 'Yamaha', name: 'R15' },
      { brand: 'Yamaha', name: 'MT-15' },
      { brand: 'Yamaha', name: 'FZ-S' }
    ];

    let createdCount = 0;
    for (const vm of vehicleModels) {
      const exists = await prisma.vehicleModel.findFirst({ where: { name: vm.name, brand: vm.brand } });
      if (!exists) {
        await prisma.vehicleModel.create({ data: { name: vm.name, brand: vm.brand, isActive: true, createdAt: now, updatedAt: now } });
        createdCount++;
      }
    }
    console.log(`✅ Vehicle models seeded. New entries: ${createdCount}`);
  } catch (e) {
    console.error('❌ Failed to seed vehicle models:', e);
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
