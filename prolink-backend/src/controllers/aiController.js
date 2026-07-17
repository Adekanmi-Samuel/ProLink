const { GoogleGenAI } = require('@google/genai');
const prisma = require('../config/prisma');
const logger = require('../config/logger');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });

const generateProposal = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { jobId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: providerId },
      include: { profile: { include: { skills: { include: { skill: true } } } } }
    });

    if (!user.is_premium) {
      return res.status(403).json({ error: 'This feature is only available for Premium users.' });
    }

    const job = await prisma.job.findUnique({ where: { id: parseInt(jobId) } });
    if (!job) return res.status(404).json({ error: 'Job not found.' });

    const profileDetails = user.profile ? `My bio: ${user.profile.bio}\nMy skills: ${user.profile.skills.map(s => s.skill.name).join(', ')}` : 'I am a skilled freelancer.';
    const prompt = `
      You are an expert freelance proposal writer. Draft a compelling, professional, and concise proposal for the following job.
      
      Job Title: ${job.title}
      Job Description: ${job.description}
      Budget: ₦${job.budget}
      
      My Profile Context:
      ${profileDetails}
      
      Write the proposal from my perspective directly to the client. Do not include placeholders like [Your Name]. Just write the message body.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ proposal: response.text });
  } catch (error) {
    logger.error('Error generating AI proposal:', error);
    res.status(500).json({ error: 'Failed to generate proposal.' });
  }
};

const optimizeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, skills } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.is_premium) {
      return res.status(403).json({ error: 'This feature is only available for Premium users.' });
    }

    const prompt = `
      You are an expert career coach and profile optimizer for freelancers. 
      I will provide my current bio and a list of my skills. 
      Rewrite my bio to be highly professional, compelling, and attractive to clients. 
      Also suggest any missing but highly relevant skills I should add.
      
      Current Bio: ${bio || 'N/A'}
      Current Skills: ${skills ? skills.join(', ') : 'N/A'}
      
      Format the response in JSON with two keys:
      - "optimizedBio": the rewritten bio text
      - "suggestedSkills": an array of suggested skill strings
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const result = JSON.parse(response.text);
    res.json(result);
  } catch (error) {
    logger.error('Error optimizing profile:', error);
    res.status(500).json({ error: 'Failed to optimize profile.' });
  }
};

const matchJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { profile: { include: { skills: { include: { skill: true } } } } }
    });

    if (!user || !user.is_premium) {
      return res.status(403).json({ error: 'This feature is only available for Premium users.' });
    }

    // Fetch up to 20 recent open jobs
    const openJobs = await prisma.job.findMany({
      where: { status: 'open' },
      orderBy: { posted_at: 'desc' },
      take: 20,
      select: { id: true, title: true, description: true, budget: true, job_type: true }
    });

    if (openJobs.length === 0) {
      return res.json({ matches: [] });
    }

    const profileDetails = user.profile ? `Bio: ${user.profile.bio}\nSkills: ${user.profile.skills.map(s => s.skill.name).join(', ')}` : 'N/A';

    const prompt = `
      You are an AI job matching assistant.
      Here is the freelancer's profile:
      ${profileDetails}
      
      Here are the available jobs in JSON format:
      ${JSON.stringify(openJobs)}
      
      Analyze the jobs and select the top 3 best matches for this freelancer based on their skills and bio.
      Return the response as a JSON array of objects, where each object has:
      - "jobId": the ID of the matched job
      - "matchReason": a short, encouraging 1-sentence explanation of why they are a perfect fit.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const result = JSON.parse(response.text);
    
    // Map the results back to the job objects
    const matches = result.map((match) => {
      const jobInfo = openJobs.find(j => j.id === match.jobId);
      return { ...jobInfo, matchReason: match.matchReason };
    }).filter(m => m.id);

    res.json({ matches });
  } catch (error) {
    logger.error('Error matching jobs:', error);
    res.status(500).json({ error: 'Failed to find job matches.' });
  }
};

const suggestPricing = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user.is_premium) {
      return res.status(403).json({ error: 'This feature is only available for Premium users.' });
    }

    const prompt = `
      You are an expert freelance pricing strategist. 
      Based on the following service title and description, suggest a reasonable price range (in Nigerian Naira ₦) that is competitive but fair.
      
      Service Title: ${title}
      Description: ${description}
      
      Return a JSON object with:
      - "minPrice": number (the minimum suggested price)
      - "maxPrice": number (the maximum suggested price)
      - "tip": A short, 1-sentence tip on how to price or package this service.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const result = JSON.parse(response.text);
    res.json(result);
  } catch (error) {
    logger.error('Error suggesting pricing:', error);
    res.status(500).json({ error: 'Failed to generate pricing suggestions.' });
  }
};

module.exports = { generateProposal, optimizeProfile, matchJobs, suggestPricing };
