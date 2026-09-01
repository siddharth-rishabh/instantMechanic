const Booking = require('../models/Booking');
const { parseDate } = require('../utils/api');

async function getAnalytics(req, res) {
  const startDate = parseDate(req.query.startDate, 'startDate');
  const endDate = parseDate(req.query.endDate, 'endDate');
  const match = startDate || endDate ? { scheduledAt: { ...(startDate && { $gte: startDate }), ...(endDate && { $lte: endDate }) } } : {};
  const [results] = await Booking.aggregate([
    { $match: match },
    {
      $facet: {
        bookingsByDate: [{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledAt' } }, bookings: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, date: '$_id', bookings: 1, revenue: 1 } }],
        bookingsByStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }, { $project: { _id: 0, status: '$_id', count: 1 } }],
        byService: [{ $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'serviceInfo' } }, { $unwind: '$serviceInfo' }, { $group: { _id: { service: '$serviceInfo.name', category: '$serviceInfo.category' }, bookings: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } } } }, { $project: { _id: 0, service: '$_id.service', category: '$_id.category', bookings: 1, revenue: 1 } }, { $sort: { bookings: -1 } }],
        monthlySummary: [{ $group: { _id: { $dateToString: { format: '%Y-%m', date: '$scheduledAt' } }, bookings: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }, revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } } } }, { $sort: { _id: 1 } }, { $project: { _id: 0, month: '$_id', bookings: 1, completed: 1, cancelled: 1, revenue: 1 } }],
      },
    },
  ]);
  const statusCounts = Object.fromEntries(results.bookingsByStatus.map((item) => [item.status, item.count]));
  res.json({ success: true, data: { ...results, completedVsCancelled: { completed: statusCounts.completed || 0, cancelled: statusCounts.cancelled || 0 } } });
}

module.exports = { getAnalytics };
