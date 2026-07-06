const prisma = require('../config/prisma');

const createSavedSearch = async (req, res) => {
  try {
    const { title, query, filters } = req.body;
    const savedSearch = await prisma.savedSearch.create({
      data: {
        user_id: req.user.id,
        title,
        query,
        filters
      }
    });
    res.json(savedSearch);
  } catch (error) {
    console.error('Error saving search:', error);
    res.status(500).json({ msg: 'Failed to save search' });
  }
};

const getSavedSearches = async (req, res) => {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(searches);
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    res.status(500).json({ msg: 'Failed to fetch saved searches' });
  }
};

const deleteSavedSearch = async (req, res) => {
  try {
    const { id } = req.params;
    
    const search = await prisma.savedSearch.findUnique({ where: { id: parseInt(id) } });
    if (!search || search.user_id !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await prisma.savedSearch.delete({ where: { id: parseInt(id) } });
    res.json({ msg: 'Search deleted' });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    res.status(500).json({ msg: 'Failed to delete saved search' });
  }
};

module.exports = {
  createSavedSearch,
  getSavedSearches,
  deleteSavedSearch
};
