const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Mechanic = require('../models/Mechanic');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitEvent } = require('../sockets');

const activeStatuses = ['assigned', 'mechanic_on_the_way', 'in_progress'];

async function reconcileCustomer(customerId) {
  if (!customerId) return;
  const customerObjectId = new mongoose.Types.ObjectId(customerId);

  const [totals] = await Booking.aggregate([
    { $match: { customer: customerObjectId } },
    {
      $group: {
        _id: '$customer',
        totalBookings: { $sum: 1 },
        totalSpent: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
      },
    },
  ]);

  await Customer.updateOne(
    { _id: customerId },
    { $set: { totalBookings: totals?.totalBookings || 0, totalSpent: totals?.totalSpent || 0 } },
  );
}

async function reconcileMechanic(mechanicId) {
  if (!mechanicId) return;

  const [jobsCompleted, currentBooking] = await Promise.all([
    Booking.countDocuments({ mechanic: mechanicId, status: 'completed' }),
    Booking.findOne({ mechanic: mechanicId, status: { $in: activeStatuses } })
      .sort({ scheduledAt: 1 })
      .select('_id'),
  ]);
  const mechanic = await Mechanic.findById(mechanicId).select('status');
  if (!mechanic) return;

  const updates = { jobsCompleted, currentBooking: currentBooking?._id || null };
  if (mechanic.status !== 'offline') {
    updates.status = currentBooking ? 'busy' : mechanic.status === 'busy' ? 'available' : mechanic.status;
  }
  await Mechanic.updateOne({ _id: mechanicId }, { $set: updates });
}

async function createBookingNotifications(booking, eventType) {
  const users = await User.find({}, '_id');
  if (!users.length) return;

  const message = eventType === 'booking:created'
    ? `Booking ${booking.bookingId} was created.`
    : `Booking ${booking.bookingId} status changed to ${booking.status.replaceAll('_', ' ')}.`;
  const notifications = users.map((user) => ({
    user: user._id,
    type: eventType === 'booking:created' ? 'booking_created' : 'booking_status_changed',
    message,
    booking: booking._id,
  }));
  const created = await Notification.insertMany(notifications);
  created.forEach((notification) => emitEvent('notification:new', notification.toObject()));
}

async function handleBookingChange(booking, previousBooking, eventType) {
  const customerIds = [booking?.customer, previousBooking?.customer]
    .filter(Boolean)
    .map((id) => id.toString());
  const mechanicIds = [booking?.mechanic, previousBooking?.mechanic]
    .filter(Boolean)
    .map((id) => id.toString());

  await Promise.all([...new Set(customerIds)].map((id) => reconcileCustomer(id)));
  await Promise.all([...new Set(mechanicIds)].map((id) => reconcileMechanic(id)));

  if (booking) {
    const payload = booking.toObject ? booking.toObject() : booking;
    emitEvent(eventType, payload);
    if (eventType === 'booking:updated' && previousBooking?.status !== booking.status) {
      emitEvent('booking:statusChanged', payload);
      await createBookingNotifications(booking, 'booking:statusChanged');
    }
    if (eventType === 'booking:created') {
      await createBookingNotifications(booking, eventType);
    }
  }
}

module.exports = { handleBookingChange };
