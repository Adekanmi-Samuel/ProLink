const prisma = require('../config/prisma');
const paymentsService = require('../services/paymentsService');

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

    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'Title is required and must be at least 3 characters' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description is required and must be at least 10 characters' });
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }
    const parsedDeliveryDays = parseInt(delivery_days, 10);
    if (isNaN(parsedDeliveryDays) || parsedDeliveryDays < 1) {
      return res.status(400).json({ error: 'Delivery days must be a positive integer' });
    }

    const service = await prisma.service.create({
      data: {
        provider_id: providerId,
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        delivery_days: parsedDeliveryDays,
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

    // Process payment via Paystack for the service order
    const client = await prisma.user.findUnique({ where: { id: clientId }, select: { email: true } });
    const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    const callback_url = `${frontendUrl}/dashboard/orders`;

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    let checkoutResult;

    if (!secretKey || secretKey === 'mock') {
      const mockRef = `mock_svc_${Date.now()}`;
      await prisma.serviceOrder.update({ where: { id: order.id }, data: { payment_reference: mockRef } });
      checkoutResult = {
        authorization_url: `${frontendUrl}/mock-paystack?reference=${mockRef}&amount=${service.price}&email=${client.email}`,
        reference: mockRef
      };
    } else {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: client.email,
          amount: parseFloat(service.price) * 100,
          callback_url,
          metadata: { service_order_id: order.id }
        })
      });
      const data = await response.json();
      if (!data.status) {
        throw new Error(data.message || 'Paystack initialization failed');
      }
      await prisma.serviceOrder.update({ where: { id: order.id }, data: { payment_reference: data.data.reference } });
      checkoutResult = data.data;
    }

    res.status(201).json({
      order,
      checkout_url: checkoutResult.authorization_url,
      reference: checkoutResult.reference
    });
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
