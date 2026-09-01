const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Mechanic = require('../models/Mechanic');

async function getDashboard(req, res) {
  const [bookingStats, totalCustomers, activeMechanics, recentBookings] = await Promise.all([
    Booking.aggregate([
      {
        $facet: {
          totals: [{ $group: { _id: null, totalBookings: { $sum: 1 }, totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } }, completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } } } }],
          statusDistribution: [{ $group: { _id: '$status', count: { $sum: 1 } } }, { $project: { _id: 0, status: '$_id', count: 1 } }],
          upcomingBookings: [{ $match: { scheduledAt: { $gte: new Date() }, status: { $nin: ['completed', 'cancelled'] } } }, { $count: 'count' }],
        },
      },
    ]),
    Customer.countDocuments(),
    Mechanic.countDocuments({ status: { $in: ['available', 'busy'] } }),
    Booking.find().populate('customer', 'name').populate('mechanic', 'name').populate('service', 'name category').sort({ createdAt: -1 }).limit(8),
  ]);
  const stats = bookingStats[0];
  const totals = stats.totals[0] || { totalBookings: 0, totalRevenue: 0, completedBookings: 0, pendingBookings: 0, cancelledBookings: 0 };
  res.json({ success: true, data: { ...totals, activeMechanics, totalCustomers, bookingStatusDistribution: stats.statusDistribution, recentBookings, summary: { averageCompletedBookingValue: totals.completedBookings ? Math.round(totals.totalRevenue / totals.completedBookings) : 0, upcomingBookings: stats.upcomingBookings[0]?.count || 0, completionRate: totals.totalBookings ? Number(((totals.completedBookings / totals.totalBookings) * 100).toFixed(1)) : 0 } } });
}

module.exports = { getDashboard };
