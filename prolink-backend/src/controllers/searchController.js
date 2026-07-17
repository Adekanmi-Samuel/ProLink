const prisma = require('../config/prisma');
const cache = require('../utils/cache');

const searchJobs = async (req, res, next) => {
  try {
    const { q, categoryId, minBudget, maxBudget, jobType, skillIds, state, city, page: pageParam, limit: limitParam } = req.query;
    
    const cacheKey = cache.makeKey('search:jobs', { q, categoryId, minBudget, maxBudget, jobType, state, city, page: pageParam, limit: limitParam });
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);
    
    let where = { status: 'open' };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } }
      ];
    }
    
    if (categoryId) where.category_id = parseInt(categoryId);
    if (jobType) where.job_type = jobType;
    if (state) where.state = state;
    if (city) where.city = { contains: city };

    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = parseFloat(minBudget);
      if (maxBudget) where.budget.lte = parseFloat(maxBudget);
    }
    
    if (skillIds) {
      const skills = skillIds.split(',').map(id => parseInt(id));
      where.skills = { some: { skill_id: { in: skills } } };
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { posted_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          budget: true,
          job_type: true,
          posted_at: true,
          status: true,
          state: true,
          city: true,
          client: {
            select: {
              profile: { select: { full_name: true, profile_picture_url: true, rating_avg: true } },
            },
          },
          category: { select: { name: true, icon: true } },
          skills: { select: { skill: { select: { id: true, name: true } } } },
          _count: { select: { bids: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const result = {
      jobs: jobs.map(j => ({
        id: j.id,
        title: j.title,
        description: j.description?.substring(0, 200),
        budget: j.budget,
        job_type: j.job_type,
        posted_at: j.posted_at,
        status: j.status,
        state: j.state,
        city: j.city,
        client_name: j.client?.profile?.full_name,
        client_avatar: j.client?.profile?.profile_picture_url,
        client_rating: j.client?.profile?.rating_avg,
        category: j.category,
        skills: j.skills.map(s => s.skill),
        bid_count: j._count.bids,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };

    cache.set(cacheKey, result, 30 * 1000); // 30 second TTL for search results
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search jobs' });
  }
};

const searchProviders = async (req, res, next) => {
  try {
    const { q, minRating, minRate, maxRate, availability, skillIds, state, city } = req.query;

    const cacheKey = cache.makeKey('search:providers', { q, minRating, minRate, maxRate, availability, state, city, page: req.query.page, limit: req.query.limit });
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    let where = {
      user: { user_type: 'provider', status: 'active' }
    };

    if (q) {
      where.OR = [
        { full_name: { contains: q } },
        { title: { contains: q } },
        { bio: { contains: q } }
      ];
    }
    
    if (minRating) where.rating_avg = { gte: parseFloat(minRating) };
    if (minRate || maxRate) {
      where.hourly_rate = {};
      if (minRate) where.hourly_rate.gte = parseFloat(minRate);
      if (maxRate) where.hourly_rate.lte = parseFloat(maxRate);
    }
    if (availability) where.availability = availability;
    if (state) where.state = state;
    if (city) where.city = { contains: city };
    
    if (skillIds) {
      const skills = skillIds.split(',').map(id => parseInt(id));
      where.skills = { some: { skill_id: { in: skills } } };
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [providers, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        orderBy: [{ is_featured: 'desc' }, { rating_avg: 'desc' }],
        skip,
        take: limit,
        select: {
          id: true,
          user_id: true,
          full_name: true,
          title: true,
          bio: true,
          hourly_rate: true,
          rate_period: true,
          availability: true,
          profile_picture_url: true,
          rating_avg: true,
          review_count: true,
          state: true,
          city: true,
          is_featured: true,
          job_success_score: true,
          response_time_hours: true,
          skills: { select: { skill: { select: { id: true, name: true } } } },
          user: { select: { id: true } },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    const result = {
      providers: providers.map(p => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        title: p.title,
        bio: p.bio?.substring(0, 200),
        hourly_rate: p.hourly_rate ? parseFloat(p.hourly_rate) : null,
        rate_period: p.rate_period,
        availability: p.availability,
        profile_picture_url: p.profile_picture_url,
        rating_avg: p.rating_avg ? parseFloat(p.rating_avg) : 0,
        review_count: p.review_count,
        state: p.state,
        city: p.city,
        is_featured: p.is_featured,
        job_success_score: p.job_success_score,
        response_time_hours: p.response_time_hours,
        skills: p.skills.map(s => s.skill),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };

    cache.set(cacheKey, result, 30 * 1000);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search providers' });
  }
};

module.exports = {
  searchJobs,
  searchProviders
};
