require('dotenv').config();
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  const email = 'admin@prolink.com';
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      user_type: 'admin',
    },
    create: {
      email,
      password_hash: passwordHash,
      user_type: 'admin',
      email_verified: true,
      status: 'active',
      profile: {
        create: {
          full_name: 'ProLink Admin',
        }
      }
    },
  });

  console.log(`Admin user created/updated: ${adminUser.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
