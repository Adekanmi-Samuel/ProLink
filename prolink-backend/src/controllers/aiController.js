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

module.exports = { generateProposal };
