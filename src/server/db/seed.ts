import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('Seeding data...');

  // Auto Part Categories
  const autoPartCategoriesData = [
    { name: 'Engine Components', slug: 'engine-components', description: 'Engine parts like pistons, valves, etc.' },
    { name: 'Body Parts', slug: 'body-parts', description: 'Doors, bumpers, mirrors, etc.' },
    { name: 'Electrical Systems', slug: 'electrical-systems', description: 'Batteries, alternators, sensors, etc.' },
    { name: 'Brakes', slug: 'brakes', description: 'Brake pads, rotors, calipers, etc.' },
    { name: 'Suspension & Steering', slug: 'suspension-and-steering', description: 'Shocks, struts, tie rods, etc.' },
    { name: 'Transmission', slug: 'transmission', description: 'Gearboxes, clutches, etc.' },
    { name: 'Exhaust Systems', slug: 'exhaust-systems', description: 'Mufflers, catalytic converters, etc.' },
    { name: 'Interior Accessories', slug: 'interior-accessories', description: 'Seats, mats, steering wheel covers, etc.' },
    { name: 'Exterior Accessories', slug: 'exterior-accessories', description: 'Spoilers, roof racks, etc.' },
    { name: 'Wheels & Tires', slug: 'wheels-and-tires', description: 'Alloy wheels, tires, etc.' },
  ];

  for (const category of autoPartCategoriesData) {
    await db.insert(schema.autoPartCategories).values(category).onConflictDoNothing();
  }
  console.log('Auto Part Categories seeded.');

  // Vehicle Models
  const vehicleModelsData = [
    // Toyota
    { name: 'Corolla', brand: 'Toyota' },
    { name: 'Premio', brand: 'Toyota' },
    { name: 'Allion', brand: 'Toyota' },
    { name: 'Aqua', brand: 'Toyota' },
    { name: 'Prius', brand: 'Toyota' },
    { name: 'Yaris', brand: 'Toyota' },
    { name: 'Vitz', brand: 'Toyota' },
    { name: 'Land Cruiser', brand: 'Toyota' },
    { name: 'Hilux', brand: 'Toyota' },
    { name: 'Camry', brand: 'Toyota' },
    // Honda
    { name: 'Civic', brand: 'Honda' },
    { name: 'Accord', brand: 'Honda' },
    { name: 'Fit', brand: 'Honda' },
    { name: 'Vezel', brand: 'Honda' },
    { name: 'CR-V', brand: 'Honda' },
    { name: 'Grace', brand: 'Honda' },
    // Nissan
    { name: 'Leaf', brand: 'Nissan' },
    { name: 'X-Trail', brand: 'Nissan' },
    { name: 'Sunny', brand: 'Nissan' },
    { name: 'March', brand: 'Nissan' },
    { name: 'Patrol', brand: 'Nissan' },
    // Suzuki
    { name: 'Alto', brand: 'Suzuki' },
    { name: 'Wagon R', brand: 'Suzuki' },
    { name: 'Swift', brand: 'Suzuki' },
    { name: 'Spacia', brand: 'Suzuki' },
    { name: 'Every', brand: 'Suzuki' },
  ];

  for (const model of vehicleModelsData) {
    await db.insert(schema.vehicleModels).values(model).onConflictDoNothing();
  }
  console.log('Vehicle Models seeded.');

  // Vehicle Grades
  const vehicleGradesData = [
    // Toyota Corolla
    { name: 'G', model: 'Corolla', brand: 'Toyota' },
    { name: 'X', model: 'Corolla', brand: 'Toyota' },
    { name: 'G-Touring', model: 'Corolla', brand: 'Toyota' },
    { name: 'Axio G', model: 'Corolla', brand: 'Toyota' },
    { name: 'Axio X', model: 'Corolla', brand: 'Toyota' },
    // Toyota Premio
    { name: 'F', model: 'Premio', brand: 'Toyota' },
    { name: 'F EX', model: 'Premio', brand: 'Toyota' },
    { name: 'G', model: 'Premio', brand: 'Toyota' },
    { name: 'G Superior', model: 'Premio', brand: 'Toyota' },
    // Toyota Allion
    { name: 'A15', model: 'Allion', brand: 'Toyota' },
    { name: 'A18', model: 'Allion', brand: 'Toyota' },
    { name: 'A20', model: 'Allion', brand: 'Toyota' },
    // Honda Fit
    { name: 'G', model: 'Fit', brand: 'Honda' },
    { name: 'L', model: 'Fit', brand: 'Honda' },
    { name: 'S', model: 'Fit', brand: 'Honda' },
    { name: 'RS', model: 'Fit', brand: 'Honda' },
    // Honda Vezel
    { name: 'X', model: 'Vezel', brand: 'Honda' },
    { name: 'Z', model: 'Vezel', brand: 'Honda' },
    { name: 'RS', model: 'Vezel', brand: 'Honda' },
  ];

  for (const grade of vehicleGradesData) {
    await db.insert(schema.vehicleGrades).values(grade).onConflictDoNothing();
  }
  console.log('Vehicle Grades seeded.');

  // Provinces, Districts, Cities
  const locationData = [
    {
      province: 'Western',
      districts: [
        { name: 'Colombo', cities: ['Colombo 1', 'Colombo 2', 'Colombo 3', 'Colombo 4', 'Colombo 5', 'Colombo 6', 'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Nugegoda', 'Maharagama', 'Kotte', 'Malabe', 'Homagama', 'Avissawella'] },
        { name: 'Gampaha', cities: ['Gampaha', 'Negombo', 'Kelaniya', 'Kadawatha', 'Kiribathgoda', 'Wattala', 'Ja-Ela', 'Nittambuwa', 'Minuwangoda', 'Veyangoda'] },
        { name: 'Kalutara', cities: ['Kalutara', 'Panadura', 'Horana', 'Matugama', 'Bandaragama', 'Beruwala', 'Aluthgama'] }
      ]
    },
    {
      province: 'Central',
      districts: [
        { name: 'Kandy', cities: ['Kandy', 'Peradeniya', 'Katugastota', 'Gampola', 'Nawalapitiya', 'Kadugannawa', 'Akurana'] },
        { name: 'Matale', cities: ['Matale', 'Dambulla', 'Galewela', 'Sigiriya', 'Ukuwela'] },
        { name: 'Nuwara Eliya', cities: ['Nuwara Eliya', 'Hatton', 'Talawakele', 'Nanu Oya', 'Maskeliya'] }
      ]
    },
    {
      province: 'Southern',
      districts: [
        { name: 'Galle', cities: ['Galle', 'Hikkaduwa', 'Ambalangoda', 'Elpitiya', 'Koggala', 'Baddegama'] },
        { name: 'Matara', cities: ['Matara', 'Weligama', 'Dikwella', 'Akuressa', 'Kamburugamuwa', 'Hakmana'] },
        { name: 'Hambantota', cities: ['Hambantota', 'Tangalle', 'Beliatta', 'Ambalantota', 'Tissamaharama'] }
      ]
    },
    {
      province: 'Northern',
      districts: [
        { name: 'Jaffna', cities: ['Jaffna', 'Chavakachcheri', 'Point Pedro', 'Kankesanthurai', 'Nallur'] },
        { name: 'Kilinochchi', cities: ['Kilinochchi', 'Paranthan', 'Pooneryn'] },
        { name: 'Mannar', cities: ['Mannar', 'Murunkan', 'Pesalai'] },
        { name: 'Vavuniya', cities: ['Vavuniya', 'Omanthai'] },
        { name: 'Mullaitivu', cities: ['Mullaitivu', 'Puthukkudiyiruppu', 'Oddusuddan'] }
      ]
    },
    {
      province: 'Eastern',
      districts: [
        { name: 'Trincomalee', cities: ['Trincomalee', 'Mutur', 'Kinniya', 'Nilaveli'] },
        { name: 'Batticaloa', cities: ['Batticaloa', 'Kattankudy', 'Eravur', 'Valachchenai'] },
        { name: 'Ampara', cities: ['Ampara', 'Kalmunai', 'Samanthurai', 'Akkaraipattu', 'Pottuvil'] }
      ]
    },
    {
      province: 'North Western',
      districts: [
        { name: 'Kurunegala', cities: ['Kurunegala', 'Kuliyapitiya', 'Narammala', 'Mawathagama', 'Giriulla', 'Pannala'] },
        { name: 'Puttalam', cities: ['Puttalam', 'Chilaw', 'Wennappuwa', 'Marawila', 'Nattandiya'] }
      ]
    },
    {
      province: 'North Central',
      districts: [
        { name: 'Anuradhapura', cities: ['Anuradhapura', 'Kekirawa', 'Thabuththegama', 'Medawachchiya', 'Eppawala'] },
        { name: 'Polonnaruwa', cities: ['Polonnaruwa', 'Kaduruwela', 'Hingurakgoda', 'Medirigiriya'] }
      ]
    },
    {
      province: 'Uva',
      districts: [
        { name: 'Badulla', cities: ['Badulla', 'Bandarawela', 'Welimada', 'Mahiyanganaya', 'Hali-Ela', 'Diyatalawa'] },
        { name: 'Moneragala', cities: ['Moneragala', 'Wellawaya', 'Bibile', 'Buttala', 'Kataragama'] }
      ]
    },
    {
      province: 'Sabaragamuwa',
      districts: [
        { name: 'Ratnapura', cities: ['Ratnapura', 'Pelmadulla', 'Balangoda', 'Embilipitiya', 'Eheliyagoda', 'Kuruwita'] },
        { name: 'Kegalle', cities: ['Kegalle', 'Mawanella', 'Warakapola', 'Rambukkana', 'Ruwanwella', 'Yatiyanthota'] }
      ]
    }
  ];

  for (const provData of locationData) {
    const insertedProvince = await db.insert(schema.provinces).values({ name: provData.province }).onConflictDoNothing().returning({ id: schema.provinces.id });
    
    let provinceId = insertedProvince[0]?.id;
    if (!provinceId) {
       // if conflict, use raw sql query instead because query api might not be perfectly typed with neon-http in some older drizzle versions. Wait, drizzle query API is fine.
       // Actually `db.query` is available if we provide the schema when creating the drizzle instance. Which we did.
       const result = await db.select({ id: schema.provinces.id }).from(schema.provinces).where(drizzleSql`name = ${provData.province}`);
       provinceId = result[0]?.id;
    }

    if (provinceId) {
      for (const distData of provData.districts) {
        const insertedDistrict = await db.insert(schema.districts).values({ name: distData.name, provinceId }).onConflictDoNothing().returning({ id: schema.districts.id });
        
        let districtId = insertedDistrict[0]?.id;
        if (!districtId) {
           const distResult = await db.select({ id: schema.districts.id }).from(schema.districts).where(drizzleSql`name = ${distData.name} AND province_id = ${provinceId}`);
           districtId = distResult[0]?.id;
        }

        if (districtId) {
          for (const cityName of distData.cities) {
            await db.insert(schema.cities).values({ name: cityName, districtId }).onConflictDoNothing();
          }
        }
      }
    }
  }
  console.log('Locations seeded.');

  // Manufacture Years
  const currentYear = new Date().getFullYear();
  const manufactureYearsData = [];
  for (let year = currentYear + 1; year >= 1970; year--) {
    manufactureYearsData.push({ year: year.toString() });
  }

  for (const yearData of manufactureYearsData) {
    await db.insert(schema.manufactureYears).values(yearData).onConflictDoNothing();
  }
  console.log('Manufacture Years seeded.');

  console.log('Seeding completed successfully!');
}

import { sql as drizzleSql } from "drizzle-orm";

seed().catch((error) => {
  console.error('Error seeding data:', error);
  process.exit(1);
});
