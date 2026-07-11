
const jwt = require('jsonwebtoken');
require('dotenv').config();
const prisma = require('./src/config/prisma');
(async () => {
    try {
        const user = await prisma.user.findFirst({ where: { user_type: 'client' } });
        console.log(jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET || 'secret'));
    } catch(e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
})();
