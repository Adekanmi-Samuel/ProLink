const cron = require('node-cron');
const prisma = require('../config/prisma');
const { sendDeadlineReminderEmail } = require('../services/emailService');
const logger = require('../config/logger');

const checkDeadlinesAndSendReminders = async () => {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find active jobs that are assigned, with an approaching deadline, and no reminder sent yet
    const assignments = await prisma.jobAssignment.findMany({
      where: {
        deadline: {
          lte: twentyFourHoursFromNow,
          gt: now // deadline is still in the future, but within 24h
        },
        reminder_sent: false,
        job: {
          status: 'assigned'
        }
      },
      include: {
        job: {
          include: {
            client: true
          }
        },
        provider: true
      }
    });

    if (assignments.length > 0) {
      console.log(`[Cron] Found ${assignments.length} assignments nearing deadline. Sending reminders...`);
    }

    for (const assignment of assignments) {
      try {
        const clientEmail = assignment.job.client.email;
        const providerEmail = assignment.provider.email;
        const jobTitle = assignment.job.title;
        const deadline = assignment.deadline;

        // Send to client
        if (clientEmail) {
          await sendDeadlineReminderEmail(clientEmail, jobTitle, deadline, true);
        }
        
        // Send to provider
        if (providerEmail) {
          await sendDeadlineReminderEmail(providerEmail, jobTitle, deadline, false);
        }

        // Mark reminder as sent
        await prisma.jobAssignment.update({
          where: { id: assignment.id },
          data: { reminder_sent: true }
        });
      } catch (err) {
        console.error(`[Cron] Failed to send reminder for assignment ${assignment.id}:`, err);
      }
    }
  } catch (error) {
    console.error('[Cron] Error checking deadlines:', error);
  }
};

// Run every day at 8:00 AM
const startDeadlineCron = () => {
  cron.schedule('0 8 * * *', checkDeadlinesAndSendReminders);
  console.log('[Cron] Deadline reminder cron job scheduled.');
};

module.exports = {
  startDeadlineCron,
  checkDeadlinesAndSendReminders
};
