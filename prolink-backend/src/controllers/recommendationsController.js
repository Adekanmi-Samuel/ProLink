const prisma = require('../config/prisma');

const recommendJobsForProvider = async (req, res, next) => {
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
      take: 50 // Fetch more to allow for smart sorting
    });
    
    // Smart Scoring Algorithm
    const scoredJobs = jobs.map(job => {
      let score = 0;
      
      const jobSkillIds = job.skills.map(s => s.skill_id);
      
      // 1. Skill overlap score (High weight)
      const matchingSkills = skillIds.filter(id => jobSkillIds.includes(id)).length;
      if (jobSkillIds.length > 0) {
        score += (matchingSkills / jobSkillIds.length) * 50; 
      }
      
      // 2. Client Rating score (Medium weight)
      if (job.client?.profile?.rating_avg) {
        score += (job.client.profile.rating_avg / 5) * 30;
      }
      
      // 3. Recency score (Medium weight)
      const daysOld = (new Date() - new Date(job.posted_at)) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 20 - daysOld); // Up to 20 points for very recent jobs
      
      // 4. Budget score (Small weight, just a bump for higher budget)
      if (job.budget) {
        score += Math.min(10, parseFloat(job.budget) / 1000);
      }

      return {
        ...job,
        match_score: Math.round(score),
        skills: job.skills?.map(s => s.skill) ?? [],
        client_name: job.client?.profile?.full_name,
        client_avatar: job.client?.profile?.profile_picture_url,
        client_rating: job.client?.profile?.rating_avg,
      };
    });

    // Sort by score descending and take top 10
    scoredJobs.sort((a, b) => b.match_score - a.match_score);
    const result = scoredJobs.slice(0, 10);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to fetch recommendations' });
  }
};

const recommendProvidersForJob = async (req, res, next) => {
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
    res.status(500).json({ msg: 'Failed to fetch recommendations' });
  }
};

module.exports = {
  recommendJobsForProvider,
  recommendProvidersForJob
};
