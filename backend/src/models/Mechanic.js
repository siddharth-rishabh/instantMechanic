const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline',
      index: true,
    },
    specializations: {
      type: [String],
      default: [],
    },
    jobsCompleted: {
      type: Number,
      default: 0,
    },
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Mechanic', mechanicSchema);
