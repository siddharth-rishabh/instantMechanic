const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const { AppError } = require('../utils/AppError');
const { getPagination, getPaginationMetadata, getSort, requireObjectId } = require('../utils/api');

async function listCustomers(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.search?.trim()) {
    const search = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ name: search }, { email: search }, { phone: search }, { address: search }];
  }
  const sort = getSort(req.query.sort, ['name', 'email', 'totalBookings', 'totalSpent', 'createdAt'], { createdAt: -1 });
  const [customers, total] = await Promise.all([Customer.find(filter).sort(sort).skip(skip).limit(limit), Customer.countDocuments(filter)]);
  res.json({ success: true, data: { customers, pagination: getPaginationMetadata(page, limit, total) } });
}

async function getCustomer(req, res) {
  const customer = await Customer.findById(requireObjectId(req.params.id, 'Customer id'));
  if (!customer) throw new AppError('Customer not found.', 404);
  const recentBookings = await Booking.find({ customer: customer._id }).populate('mechanic', 'name status').populate('service', 'name category').sort({ scheduledAt: -1 }).limit(10);
  res.json({ success: true, data: { customer, recentBookings } });
}

module.exports = { getCustomer, listCustomers };
