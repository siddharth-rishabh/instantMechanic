const mongoose = require('mongoose');
const { z } = require('zod');
const { AppError } = require('./AppError');

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function getPagination(query) {
  const parsed = paginationSchema.safeParse(query);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0].message, 400);
  }

  const { page, limit } = parsed.data;
  return { page, limit, skip: (page - 1) * limit };
}

function getPaginationMetadata(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

function requireObjectId(value, label = 'Resource id') {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`${label} is invalid.`, 400);
  }
  return new mongoose.Types.ObjectId(value);
}

function getSort(sort, allowedFields, fallback) {
  if (!sort) return fallback;

  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  if (!allowedFields.includes(field)) {
    throw new AppError(`Sorting by ${field} is not supported.`, 400);
  }
  return { [field]: descending ? -1 : 1 };
}

function parseDate(value, label) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${label} must be a valid date.`, 400);
  }
  return date;
}

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = {
  getPagination,
  getPaginationMetadata,
  getSort,
  parseDate,
  requireObjectId,
  safeUser,
};
