require('dotenv').config();
const prisma = require('./src/config/prisma');

async function main() {
  const admins = await prisma.user.findMany({
    where: { user_type: 'admin' },
    select: { email: true }
  });
  
  if (admins.length === 0) {
    console.log('No admins found. Creating one...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@prolink.com',
        password_hash: hashedPassword,
        user_type: 'admin',
        email_verified: true,
        status: 'active',
        profile: {
          create: {
            full_name: 'ProLink Admin'
          }
        }
      }
    });
    console.log('Created new admin: admin@prolink.com / Admin@123');
  } else {
    console.log('Admins found:', admins);
    // Let's reset the password of the first admin so the user can log in
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    await prisma.user.update({
      where: { email: admins[0].email },
      data: { password_hash: hashedPassword }
    });
    console.log(`Reset password for ${admins[0].email} to 'Admin@123'`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
