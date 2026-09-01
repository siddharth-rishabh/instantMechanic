const { z } = require('zod');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { AppError } = require('../utils/AppError');
const { requireObjectId } = require('../utils/api');

const serviceSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: z.string().optional(),
  basePrice: z.coerce.number().min(0),
  estimatedDuration: z.coerce.number().int().min(1),
  isActive: z.boolean().optional(),
});

function validate(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) throw new AppError(result.error.issues[0].message, 400);
  return result.data;
}

async function listServices(req, res) {
  const filter = {};
  if (req.query.category?.trim()) filter.category = new RegExp(`^${req.query.category.trim()}$`, 'i');
  if (req.query.isActive !== undefined) {
    if (!['true', 'false'].includes(req.query.isActive)) throw new AppError('isActive must be true or false.', 400);
    filter.isActive = req.query.isActive === 'true';
  }
  if (req.query.search?.trim()) {
    const search = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ name: search }, { category: search }, { description: search }];
  }
  const services = await Service.find(filter).sort({ category: 1, name: 1 });
  res.json({ success: true, data: { services } });
}

async function getService(req, res) {
  const service = await Service.findById(requireObjectId(req.params.id, 'Service id'));
  if (!service) throw new AppError('Service not found.', 404);
  res.json({ success: true, data: { service } });
}

async function createService(req, res) {
  const service = await Service.create(validate(serviceSchema, req.body));
  res.status(201).json({ success: true, data: { service } });
}

async function updateService(req, res) {
  const data = validate(serviceSchema.partial(), req.body);
  if (!Object.keys(data).length) throw new AppError('At least one service field is required.', 400);
  const service = await Service.findByIdAndUpdate(requireObjectId(req.params.id, 'Service id'), data, { returnDocument: 'after', runValidators: true });
  if (!service) throw new AppError('Service not found.', 404);
  res.json({ success: true, data: { service } });
}

async function deleteService(req, res) {
  const id = requireObjectId(req.params.id, 'Service id');
  const service = await Service.findById(id);
  if (!service) throw new AppError('Service not found.', 404);
  if (await Booking.exists({ service: id })) throw new AppError('A service with existing bookings cannot be deleted.', 409);
  await service.deleteOne();
  res.json({ success: true, message: 'Service deleted successfully.' });
}

module.exports = { createService, deleteService, getService, listServices, updateService };
