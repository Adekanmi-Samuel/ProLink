const prisma = require('./src/config/prisma');
prisma.job.findMany({ 
    orderBy: { posted_at: 'desc' }, 
    take: 3, 
    select: { id: true, title: true, client_id: true, status: true, client: { select: { user_type: true } } } 
}).then(console.log).finally(() => process.exit(0));
