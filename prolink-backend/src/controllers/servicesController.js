const prisma = require('../config/prisma');

const getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { status: 'active' },
      include: {
        provider: { select: { id: true, profile: { select: { full_name: true, title: true } } } },
        category: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        provider: { select: { id: true, profile: { select: { full_name: true, title: true, bio: true } } } },
        category: true
      }
    });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

const createService = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { title, description, price, delivery_days, category_id, images } = req.body;

    const service = await prisma.service.create({
      data: {
        provider_id: providerId,
        title,
        description,
        price,
        delivery_days,
        category_id,
        images
      }
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
};

const getMyServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { provider_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your services' });
  }
};

const purchaseService = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { serviceId, requirements } = req.body;

    const service = await prisma.service.findUnique({ where: { id: parseInt(serviceId) } });
    if (!service) return res.status(404).json({ error: 'Service not found' });

    // Ensure client doesn't buy their own service
    if (service.provider_id === clientId) {
      return res.status(400).json({ error: 'You cannot purchase your own service' });
    }

    const order = await prisma.serviceOrder.create({
      data: {
        service_id: service.id,
        client_id: clientId,
        amount: service.price,
        requirements,
        delivery_date: new Date(Date.now() + service.delivery_days * 24 * 60 * 60 * 1000)
      }
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to purchase service' });
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  getMyServices,
  purchaseService
};
