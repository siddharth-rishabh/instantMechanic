const { z } = require('zod');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Mechanic = require('../models/Mechanic');
const Service = require('../models/Service');
const { handleBookingChange } = require('../services/bookingService');
const { AppError } = require('../utils/AppError');
const { getPagination, getPaginationMetadata, getSort, parseDate, requireObjectId } = require('../utils/api');

const statuses = ['pending', 'assigned', 'mechanic_on_the_way', 'in_progress', 'completed', 'cancelled'];
const vehicleSchema = z.object({
  type: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1),
  registrationNumber: z.string().trim().min(1),
});
const createBookingSchema = z.object({
  bookingId: z.string().trim().min(1),
  customer: z.string(),
  mechanic: z.string().nullable().optional(),
  service: z.string(),
  vehicle: vehicleSchema,
  status: z.enum(statuses).optional(),
  amount: z.coerce.number().min(0),
  scheduledAt: z.coerce.date(),
  startedAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  pickupAddress: z.string().trim().min(1),
  notes: z.string().trim().optional(),
});
const updateBookingSchema = createBookingSchema.omit({ bookingId: true }).partial();

function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) throw new AppError(result.error.issues[0].message, 400);
  return result.data;
}

async function validateRelations(data) {
  const checks = [];
  if (data.customer) checks.push(Customer.exists({ _id: requireObjectId(data.customer, 'Customer id') }));
  if (data.service) checks.push(Service.exists({ _id: requireObjectId(data.service, 'Service id') }));
  if (data.mechanic) checks.push(Mechanic.exists({ _id: requireObjectId(data.mechanic, 'Mechanic id') }));
  const values = await Promise.all(checks);
  if (values.some((value) => !value)) throw new AppError('A referenced customer, mechanic, or service was not found.', 404);
}

async function listBookings(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) {
    if (!statuses.includes(req.query.status)) throw new AppError('Booking status is invalid.', 400);
    filter.status = req.query.status;
  }
  if (req.query.service) filter.service = requireObjectId(req.query.service, 'Service id');
  if (req.query.mechanic) filter.mechanic = requireObjectId(req.query.mechanic, 'Mechanic id');
  const startDate = parseDate(req.query.startDate, 'startDate');
  const endDate = parseDate(req.query.endDate, 'endDate');
  if (startDate || endDate) filter.scheduledAt = { ...(startDate && { $gte: startDate }), ...(endDate && { $lte: endDate }) };
  if (req.query.search?.trim()) {
    const search = new RegExp(req.query.search.trim(), 'i');
    const customerIds = await Customer.find({ $or: [{ name: search }, { email: search }, { phone: search }] }).distinct('_id');
    filter.$or = [{ bookingId: search }, { 'vehicle.registrationNumber': search }, { customer: { $in: customerIds } }];
  }
  const sort = getSort(req.query.sort, ['scheduledAt', 'amount', 'createdAt', 'status', 'bookingId'], { scheduledAt: -1 });
  const [bookings, total] = await Promise.all([
    Booking.find(filter).populate('customer', 'name email phone').populate('mechanic', 'name status phone').populate('service', 'name category basePrice').sort(sort).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  res.json({ success: true, data: { bookings, pagination: getPaginationMetadata(page, limit, total) } });
}

async function getBooking(req, res) {
  const booking = await Booking.findById(requireObjectId(req.params.id, 'Booking id'))
    .populate('customer').populate('mechanic').populate('service');
  if (!booking) throw new AppError('Booking not found.', 404);
  res.json({ success: true, data: { booking } });
}

async function createBooking(req, res) {
  const data = parseBody(createBookingSchema, req.body);
  await validateRelations(data);
  if (await Booking.exists({ bookingId: data.bookingId })) throw new AppError('Booking id already exists.', 409);
  const booking = await Booking.create(data);
  await handleBookingChange(booking, null, 'booking:created');
  const populated = await booking.populate('customer mechanic service');
  res.status(201).json({ success: true, data: { booking: populated } });
}

async function updateBooking(req, res) {
  const data = parseBody(updateBookingSchema, req.body);
  if (!Object.keys(data).length) throw new AppError('At least one booking field is required.', 400);
  await validateRelations(data);
  const booking = await Booking.findById(requireObjectId(req.params.id, 'Booking id'));
  if (!booking) throw new AppError('Booking not found.', 404);
  const previousBooking = booking.toObject();
  Object.assign(booking, data);
  await booking.save();
  await handleBookingChange(booking, previousBooking, 'booking:updated');
  const populated = await booking.populate('customer mechanic service');
  res.json({ success: true, data: { booking: populated } });
}

async function deleteBooking(req, res) {
  const booking = await Booking.findById(requireObjectId(req.params.id, 'Booking id'));
  if (!booking) throw new AppError('Booking not found.', 404);
  const previousBooking = booking.toObject();
  await booking.deleteOne();
  await handleBookingChange(null, previousBooking, 'booking:deleted');
  res.json({ success: true, message: 'Booking deleted successfully.' });
}

module.exports = { createBooking, deleteBooking, getBooking, listBookings, updateBooking };
