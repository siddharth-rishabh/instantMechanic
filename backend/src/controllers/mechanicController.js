const { z } = require('zod');
const Mechanic = require('../models/Mechanic');
const Booking = require('../models/Booking');
const { AppError } = require('../utils/AppError');
const { getPagination, getPaginationMetadata, getSort, requireObjectId } = require('../utils/api');

const mechanicUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().min(1).optional(),
  profileImage: z.string().optional(),
  status: z.enum(['available', 'busy', 'offline']).optional(),
  specializations: z.array(z.string().trim().min(1)).optional(),
  location: z.object({ latitude: z.coerce.number(), longitude: z.coerce.number() }).optional(),
});

async function listMechanics(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) {
    if (!['available', 'busy', 'offline'].includes(req.query.status)) throw new AppError('Mechanic status is invalid.', 400);
    filter.status = req.query.status;
  }
  if (req.query.specialization?.trim()) filter.specializations = new RegExp(req.query.specialization.trim(), 'i');
  if (req.query.search?.trim()) {
    const search = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ name: search }, { email: search }, { phone: search }];
  }
  const sort = getSort(req.query.sort, ['name', 'status', 'jobsCompleted', 'createdAt'], { status: 1, name: 1 });
  const [mechanics, total] = await Promise.all([
    Mechanic.find(filter).populate('currentBooking', 'bookingId status scheduledAt vehicle').sort(sort).skip(skip).limit(limit),
    Mechanic.countDocuments(filter),
  ]);
  res.json({ success: true, data: { mechanics, pagination: getPaginationMetadata(page, limit, total) } });
}

async function getMechanic(req, res) {
  const mechanic = await Mechanic.findById(requireObjectId(req.params.id, 'Mechanic id')).populate('currentBooking');
  if (!mechanic) throw new AppError('Mechanic not found.', 404);
  const recentBookings = await Booking.find({ mechanic: mechanic._id }).populate('customer', 'name phone').populate('service', 'name category').sort({ scheduledAt: -1 }).limit(15);
  res.json({ success: true, data: { mechanic, recentBookings } });
}

async function updateMechanic(req, res) {
  const result = mechanicUpdateSchema.safeParse(req.body);
  if (!result.success) throw new AppError(result.error.issues[0].message, 400);
  if (!Object.keys(result.data).length) throw new AppError('At least one mechanic field is required.', 400);
  const mechanic = await Mechanic.findByIdAndUpdate(requireObjectId(req.params.id, 'Mechanic id'), result.data, { returnDocument: 'after', runValidators: true }).populate('currentBooking');
  if (!mechanic) throw new AppError('Mechanic not found.', 404);
  res.json({ success: true, data: { mechanic } });
}

module.exports = { getMechanic, listMechanics, updateMechanic };
