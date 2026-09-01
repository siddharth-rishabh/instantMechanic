const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { env } = require('../config/env');
const User = require('../models/User');
const { AppError } = require('../utils/AppError');

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email address is required.'),
  password: z.string().min(1, 'Password is required.'),
});

function toSafeUser(user) {
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

function createToken(user) {
  if (!env.jwtSecret) {
    throw new AppError('JWT configuration is unavailable.', 500);
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

async function login(req, res) {
  const parsedBody = loginSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new AppError(parsedBody.error.issues[0].message, 400);
  }

  const { email, password } = parsedBody.data;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  res.status(200).json({
    success: true,
    token: createToken(user),
    user: toSafeUser(user),
  });
}

async function getCurrentUser(req, res) {
  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    throw new AppError('User account no longer exists.', 401);
  }

  res.status(200).json({
    success: true,
    user: toSafeUser(user),
  });
}

module.exports = { getCurrentUser, login };
