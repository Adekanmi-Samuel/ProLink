const prisma = require('../config/prisma');

const recommendJobsForProvider = async (req, res) => {
  try {
    const providerId = req.user.id;
    
    // Get provider skills
    const profile = await prisma.profile.findUnique({
      where: { user_id: providerId },
      include: { skills: true }
    });
    
    if (!profile) return res.json([]);
    
    const skillIds = profile.skills.map(s => s.skill_id);
    
    let where = { status: 'open' };
    
    if (skillIds.length > 0) {
      where.skills = {
        some: { skill_id: { in: skillIds } }
      };
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { posted_at: 'desc' },
      include: {
        client: {
          select: { profile: { select: { full_name: true, profile_picture_url: true, rating_avg: true } } }
        },
        category: true,
        skills: { include: { skill: true } }
      },
      take: 10
    });
    
    // Flatten skills to consistent format
    const result = jobs.map(job => ({
      ...job,
      skills: job.skills?.map(s => s.skill) ?? [],
      client_name: job.client?.profile?.full_name,
      client_avatar: job.client?.profile?.profile_picture_url,
      client_rating: job.client?.profile?.rating_avg,
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    res.status(500).json({ msg: 'Failed to fetch recommendations' });
  }
};

const recommendProvidersForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Get job skills
    const job = await prisma.job.findUnique({
      where: { id: parseInt(jobId) },
      include: { skills: true }
    });
    
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    
    const skillIds = job.skills.map(s => s.skill_id);
    
    let where = { user: { user_type: 'provider', status: 'active' } };
    
    if (skillIds.length > 0) {
      where.skills = {
        some: { skill_id: { in: skillIds } }
      };
    }

    const providers = await prisma.profile.findMany({
      where,
      orderBy: [
        { is_featured: 'desc' },
        { rating_avg: 'desc' }
      ],
      include: {
        skills: { include: { skill: true } },
        user: { select: { id: true, email_verified: true } }
      },
      take: 10
    });
    
    // Flatten skills to consistent format
    const result = providers.map(p => ({
      ...p,
      skills: p.skills?.map(s => s.skill) ?? [],
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching provider recommendations:', error);
    res.status(500).json({ msg: 'Failed to fetch recommendations' });
  }
};

module.exports = {
  recommendJobsForProvider,
  recommendProvidersForJob
};
