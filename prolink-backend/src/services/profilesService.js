const prisma = require('../config/prisma');
const logger = require('../config/logger');

const getMyProfile = async (userId) => {
  const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
  if (!profile) return null;

  const [user, portfolioItems, profileSkills] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, user_type: true, email_verified: true, phone_verified: true, status: true }
    }),
    prisma.portfolioItem.findMany({ where: { profile_id: profile.id } }),
    prisma.profileSkill.findMany({ where: { profile_id: profile.id }, include: { skill: true } })
  ]);

  const trust_score = 
    (profile.nin_status === 'verified' ? 30 : 0) +
    (profile.cac_status === 'verified' ? 20 : 0) +
    (user ? (user.email_verified ? 10 : 0) : 0) +
    (user ? (user.phone_verified ? 10 : 0) : 0) +
    (profile.job_success_score ? (profile.job_success_score / 100) * 30 : 0);

  return {
    user_id: profile.user_id,
    full_name: profile.full_name,
    bio: profile.bio,
    phone_number: profile.phone_number,
    profile_picture_url: profile.profile_picture_url,
    title: profile.title,
    hourly_rate: profile.hourly_rate ? parseFloat(profile.hourly_rate) : null,
    rate_period: profile.rate_period,
    availability: profile.availability,
    email: user ? user.email : null,
    user_type: user ? user.user_type : null,
    email_verified: user ? user.email_verified : false,
    phone_verified: user ? user.phone_verified : false,
    status: user ? user.status : null,
    nin_status: profile.nin_status,
    cac_status: profile.cac_status,
    state: profile.state,
    city: profile.city,
    gender: profile.gender,
    rating_avg: profile.rating_avg,
    review_count: profile.review_count,
    badges: profile.badges,
    job_success_score: profile.job_success_score,
    response_time_hours: profile.response_time_hours,
    is_featured: profile.is_featured,
    trust_score: Math.round(trust_score),
    portfolio: portfolioItems,
    skills: profileSkills.map(s => ({ id: s.skill.id, name: s.skill.name })),
  };
};

const getProfileById = async (userId) => {
  const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
  if (!profile) return null;

  const [user, portfolioItems, profileSkills] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { user_type: true }
    }),
    prisma.portfolioItem.findMany({ where: { profile_id: profile.id } }),
    prisma.profileSkill.findMany({ where: { profile_id: profile.id }, include: { skill: true } })
  ]);

  const trust_score =
    (profile.nin_status === 'verified' ? 30 : 0) +
    (profile.cac_status === 'verified' ? 20 : 0) +
    (user ? (user.email_verified ? 10 : 0) : 0) +
    (user ? (user.phone_verified ? 10 : 0) : 0) +
    (profile.job_success_score ? (profile.job_success_score / 100) * 30 : 0);

  return {
    user_id: profile.user_id,
    full_name: profile.full_name,
    title: profile.title,
    state: profile.state,
    city: profile.city,
    location: [profile.city, profile.state].filter(Boolean).join(', ') || null,  // ← ADD location
    bio: profile.bio,
    hourly_rate: profile.hourly_rate ? parseFloat(profile.hourly_rate) : null,
    rate_period: profile.rate_period,
    availability: profile.availability,
    profile_picture_url: profile.profile_picture_url,
    rating_avg: profile.rating_avg,
    review_count: profile.review_count,
    badges: profile.badges,
    job_success_score: profile.job_success_score,
    response_time_hours: profile.response_time_hours,
    is_featured: profile.is_featured,
    nin_status: profile.nin_status,
    cac_status: profile.cac_status,
    trust_score: Math.round(trust_score),
    portfolio: portfolioItems,
    skills: profileSkills.map(s => ({ id: s.skill.id, name: s.skill.name })),
    user_type: user?.user_type || 'provider',  // ← ADD user_type
  };
};

const updateProfile = async (userId, data, skillIds) => {
  const profile = await prisma.profile.upsert({
    where: { user_id: userId },
    update: data,
    create: {
      user_id: userId,
      full_name: data.full_name || 'Unknown',
      ...data,
    }
  });

  if (skillIds !== undefined) {
    // Delete existing skills
    await prisma.profileSkill.deleteMany({ where: { profile_id: profile.id } });
    
    // Add new skills
    if (skillIds.length > 0) {
      await prisma.profileSkill.createMany({
        data: skillIds.map(skill_id => ({ profile_id: profile.id, skill_id }))
      });
    }
  }

  return profile;
};



const getProfileReviews = async (userId, filters = {}) => {
  const profile = await prisma.profile.findUnique({
    where: { user_id: userId },
    select: { user_id: true }
  });
  if (!profile) return null;

  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(filters.limit) || 10));
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { reviewee_id: userId },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        reviewer: {
          select: {
            profile: { select: { full_name: true, profile_picture_url: true } }
          }
        },
        job: { select: { title: true } }    // ← add this to get job title
      }
    }),
    prisma.review.count({
      where: { reviewee_id: userId }
    })
  ]);

  // Map to flat shape for frontend
  const mappedReviews = reviews.map(r => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    reviewer_name: r.reviewer?.profile?.full_name || 'Anonymous',
    reviewer_avatar: r.reviewer?.profile?.profile_picture_url || null,
    job_title: r.job?.title || null,
  }));

  return { reviews: mappedReviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const getBankAccount = async (userId) => {
  const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
  if (!profile) return null;
  return await prisma.bankAccount.findUnique({
    where: { profile_id: profile.id }
  });
};

const saveBankAccount = async (userId, data) => {
  const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
  if (!profile) throw new Error('Profile not found');

  // Create Paystack Transfer Recipient if secret key is configured
  let recipientCode = null;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (secretKey && secretKey !== 'mock') {
    try {
      const response = await fetch('https://api.paystack.co/transferrecipient', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'nuban',
          name: data.account_name,
          account_number: data.account_number,
          bank_code: data.bank_code,
          currency: 'NGN'
        })
      });
      const result = await response.json();
      if (result.status && result.data?.recipient_code) {
        recipientCode = result.data.recipient_code;
      } else {
        console.warn('Paystack recipient creation failed:', result.message);
        throw new Error(result.message || 'Invalid bank account details');
      }
    } catch (err) {
      console.warn('Paystack recipient creation error:', err.message);
      throw new Error(err.message || 'Could not verify bank account with Paystack.');
    }
  }

  return await prisma.bankAccount.upsert({
    where: { profile_id: profile.id },
    update: {
      bank_name: data.bank_name,
      bank_code: data.bank_code,
      account_number: data.account_number,
      account_name: data.account_name,
      ...(recipientCode && { paystack_recipient_code: recipientCode })
    },
    create: {
      profile_id: profile.id,
      bank_name: data.bank_name,
      bank_code: data.bank_code,
      account_number: data.account_number,
      account_name: data.account_name,
      ...(recipientCode && { paystack_recipient_code: recipientCode })
    }
  });
};

const getMyEarnings = async (userId) => {
  // Use DB aggregation to avoid nested JS loops blocking the event loop
  const milestones = await prisma.milestone.findMany({
    where: {
      job: {
        assignment: { provider_id: userId }
      }
    },
    select: {
      amount: true,
      status: true,
    },
  });

  let totalEarned = 0;
  let pendingEscrow = 0;

  for (const m of milestones) {
    if (m.status === 'approved' || m.status === 'paid') {
      totalEarned += Number(m.amount);
    } else if (m.status === 'funded' || m.status === 'submitted') {
      pendingEscrow += Number(m.amount);
    }
  }

  const platformFee = totalEarned * 0.10;
  const netPayout = totalEarned - platformFee;

  return {
    gross_earned: totalEarned,
    platform_fee: platformFee,
    net_payout: netPayout,
    pending_escrow: pendingEscrow,
  };
};

module.exports = { getMyProfile, getProfileById, updateProfile, getProfileReviews, getBankAccount, saveBankAccount, getMyEarnings };