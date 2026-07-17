const prisma = require('../config/prisma');

const addPortfolioItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, image_url, project_url } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const item = await prisma.portfolioItem.create({
      data: {
        profile_id: profile.id,
        title,
        description,
        image_url,
        project_url
      }
    });

    res.status(201).json({ msg: 'Portfolio item added', item });
  } catch (err) {
    next(err);
  }
};

const getMyPortfolio = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const items = await prisma.portfolioItem.findMany({
      where: { profile_id: profile.id },
      orderBy: { created_at: 'desc' }
    });

    res.json(items);
  } catch (err) {
    next(err);
  }
};

const deletePortfolioItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.id);

    const profile = await prisma.profile.findUnique({ where: { user_id: userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const item = await prisma.portfolioItem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.profile_id !== profile.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.portfolioItem.delete({ where: { id: itemId } });
    res.json({ msg: 'Item deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addPortfolioItem,
  getMyPortfolio,
  deletePortfolioItem
};
