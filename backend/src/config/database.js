const mongoose = require('mongoose');
const { env } = require('./env');

async function connectToDatabase() {
  if (!env.mongoUri) {
    console.warn('MONGODB_URI is not configured. Starting without a database connection.');
    return;
  }

  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

function getDatabaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

module.exports = { connectToDatabase, getDatabaseStatus };
