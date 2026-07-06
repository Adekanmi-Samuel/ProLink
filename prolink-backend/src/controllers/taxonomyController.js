const prisma = require('../config/prisma');

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { jobs: true }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ msg: 'Failed to fetch categories' });
  }
};

const getSkills = async (req, res) => {
  try {
    const { categoryId, q } = req.query;
    
    let where = {};
    if (categoryId) {
      where.category_id = parseInt(categoryId);
    }
    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 50 // Limit results
    });
    
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ msg: 'Failed to fetch skills' });
  }
};

const createSkill = async (req, res) => {
  try {
    const { name, categoryId } = req.body;
    if (!name) return res.status(400).json({ msg: 'Skill name is required' });

    // Try to find existing skill
    let skill = await prisma.skill.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (!skill) {
      // Generate slug from name: lowercase and replace spaces with hyphens
      const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      skill = await prisma.skill.create({
        data: {
          name,
          slug,
          category_id: categoryId || null
        }
      });
    }

    res.json(skill);
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ msg: 'Failed to create skill' });
  }
};

module.exports = {
  getCategories,
  getSkills,
  createSkill
};
