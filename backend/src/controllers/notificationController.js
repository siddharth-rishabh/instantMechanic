const Notification = require('../models/Notification');
const { AppError } = require('../utils/AppError');
const { getPagination, getPaginationMetadata, requireObjectId } = require('../utils/api');

async function listNotifications(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user.id };
  if (req.query.unreadOnly === 'true') filter.isRead = false;
  if (req.query.unreadOnly && !['true', 'false'].includes(req.query.unreadOnly)) throw new AppError('unreadOnly must be true or false.', 400);
  const [notifications, total] = await Promise.all([
    Notification.find(filter).populate('booking', 'bookingId status').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);
  res.json({ success: true, data: { notifications, pagination: getPaginationMetadata(page, limit, total) } });
}

async function markAsRead(req, res) {
  const notification = await Notification.findOneAndUpdate({ _id: requireObjectId(req.params.id, 'Notification id'), user: req.user.id }, { isRead: true }, { returnDocument: 'after' }).populate('booking', 'bookingId status');
  if (!notification) throw new AppError('Notification not found.', 404);
  res.json({ success: true, data: { notification } });
}

async function markAllAsRead(req, res) {
  const result = await Notification.updateMany({ user: req.user.id, isRead: false }, { $set: { isRead: true } });
  res.json({ success: true, data: { modifiedCount: result.modifiedCount } });
}

module.exports = { listNotifications, markAllAsRead, markAsRead };
