import { prisma } from '../src/config/database';
import { hash } from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user
  const hashedPassword = await hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  console.log('✅ Created test user:', user.email);
  console.log('📧 Email: test@example.com');
  console.log('🔑 Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
