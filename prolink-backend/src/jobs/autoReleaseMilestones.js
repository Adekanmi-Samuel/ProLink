const cron = require('node-cron');
const prisma = require('../config/prisma');
const paymentsService = require('../services/paymentsService');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

const AUTO_RELEASE_DAYS = parseInt(process.env.AUTO_RELEASE_DAYS || '7', 10);

async function runAutoRelease() {
  const cutoff = new Date(Date.now() - AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000);

  const staleMilestones = await prisma.milestone.findMany({
    where: { status: 'submitted', submitted_at: { lte: cutoff } },
    include: { job: { include: { client: true, assignment: { include: { provider: true } } } } }
  });

  for (const milestone of staleMilestones) {
    try {
      await prisma.milestone.update({ where: { id: milestone.id }, data: { status: 'approved' } });
      await paymentsService.releaseFunds(milestone.id);

      const provider = milestone.job.assignment?.provider;
      if (provider?.email) {
        await emailService.sendAutoReleaseEmail(provider.email, milestone.job.title, milestone.amount);
      }
      if (milestone.job.client?.email) {
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
        await emailService.sendNotificationEmail(
          milestone.job.client.email,
          `Milestone Auto-Approved: ${milestone.job.title}`,
          `The milestone "${milestone.job.title}" has been auto-approved after ${AUTO_RELEASE_DAYS} days of inactivity.`,
          `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Milestone Auto-Approved ⏰</h2>
            <p>The milestone for <strong>${milestone.job.title}</strong> has been automatically approved because no action was taken within ${AUTO_RELEASE_DAYS} days of the provider's submission.</p>
            <p>The funds have been released to the provider. If you believe this was an error, please contact support.</p>
            <a href="${frontendUrl}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 5px;">View Dashboard</a>
          </div>`
        );
      }
      logger.info('Auto-released milestone', { milestoneId: milestone.id });
    } catch (err) {
      logger.error('Auto-release failed for milestone', { milestoneId: milestone.id, error: err.message });
    }
  }
}

// Runs once a day at 3am server time
cron.schedule('0 3 * * *', runAutoRelease);

module.exports = { runAutoRelease };
