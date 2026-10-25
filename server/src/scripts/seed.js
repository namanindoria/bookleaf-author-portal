/**
 * Standalone Database Seeder Script
 */
const dbService = require('../services/dbService');

console.log('Seeding BookLeaf database...');
try {
  const result = dbService.seedDatabase();
  console.log('✅ Seed successful!');
  console.log(`- Authors: ${result.totalAuthors}`);
  console.log(`- Books: ${result.totalBooks}`);
  console.log(`- Tickets: ${result.totalTickets}`);
} catch (err) {
  console.error('❌ Seed failed:', err);
  process.exit(1);
}
