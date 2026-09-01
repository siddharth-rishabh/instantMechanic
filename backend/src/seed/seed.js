const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { connectToDatabase } = require('../config/database');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Mechanic = require('../models/Mechanic');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const SEED_VALUE = 20260902;
let randomState = SEED_VALUE;

function random() {
  randomState = (randomState * 1664525 + 1013904223) % 4294967296;
  return randomState / 4294967296;
}

function pick(items) {
  return items[Math.floor(random() * items.length)];
}

function between(minimum, maximum) {
  return Math.floor(random() * (maximum - minimum + 1)) + minimum;
}

function dateOffset(daysFromToday, hour = between(8, 18)) {
  const date = new Date();
  date.setHours(hour, between(0, 59), 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date;
}

const firstNames = [
  'Aarav', 'Aditi', 'Akash', 'Ananya', 'Arjun', 'Bhavna', 'Dev', 'Diya', 'Ishaan',
  'Kavya', 'Kiran', 'Meera', 'Neha', 'Nikhil', 'Pooja', 'Rahul', 'Riya', 'Rohan',
  'Saanvi', 'Siddharth', 'Sneha', 'Tanvi', 'Varun', 'Vikram', 'Yash',
];
const lastNames = [
  'Agarwal', 'Bhat', 'Chauhan', 'Das', 'Gupta', 'Iyer', 'Jain', 'Kapoor', 'Khan',
  'Malhotra', 'Mehta', 'Nair', 'Patel', 'Rao', 'Shah', 'Sharma', 'Singh', 'Verma',
];
const localities = [
  'Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Jayanagar', 'Malleshwaram',
  'Marathahalli', 'Hebbal', 'Banashankari', 'Rajajinagar',
];
const vehicleTypes = ['Hatchback', 'Sedan', 'SUV', 'Motorcycle', 'Scooter'];
const vehicleCatalog = [
  ['Maruti Suzuki', 'Swift'], ['Hyundai', 'i20'], ['Tata', 'Nexon'], ['Honda', 'City'],
  ['Mahindra', 'XUV 3XO'], ['Kia', 'Seltos'], ['Toyota', 'Innova Crysta'],
  ['Royal Enfield', 'Classic 350'], ['Honda', 'Activa 6G'], ['TVS', 'Ntorq 125'],
];
const specializations = [
  'General Service', 'Battery Service', 'Tyre Repair', 'Engine Diagnostics', 'Brake Repair',
  'AC Service', 'Electrical Systems', 'Two-Wheeler Service', 'Roadside Assistance',
];
const serviceDefinitions = [
  ['Standard Car Service', 'Periodic Maintenance', 'Multi-point inspection, oil change, and routine maintenance.', 2499, 180],
  ['Premium Car Service', 'Periodic Maintenance', 'Comprehensive maintenance with engine and cabin checks.', 4499, 300],
  ['Bike Service', 'Two-Wheeler', 'Routine two-wheeler inspection and maintenance.', 999, 90],
  ['Battery Replacement', 'Battery', 'On-site battery testing and replacement service.', 3500, 60],
  ['Tyre Puncture Repair', 'Tyres', 'Mobile puncture assessment and repair.', 499, 45],
  ['Tyre Replacement', 'Tyres', 'Tyre inspection and replacement support.', 5500, 75],
  ['AC Service', 'Air Conditioning', 'Vehicle AC performance inspection and service.', 1999, 120],
  ['Brake Inspection', 'Brakes', 'Brake pads, fluid, and system inspection.', 1299, 90],
  ['Engine Diagnostics', 'Diagnostics', 'Computerized engine diagnostics and fault assessment.', 1499, 75],
  ['Emergency Roadside Assistance', 'Roadside Assistance', 'Rapid on-site assistance for immobilized vehicles.', 1799, 60],
  ['Car Wash and Detailing', 'Detailing', 'Exterior wash and interior detailing.', 1399, 150],
  ['Wheel Alignment', 'Tyres', 'Wheel alignment and steering balance check.', 1099, 60],
];
const statuses = [
  'completed', 'completed', 'completed', 'completed', 'completed', 'completed',
  'assigned', 'assigned', 'mechanic_on_the_way', 'in_progress', 'pending', 'cancelled',
];

function fullName() {
  return `${pick(firstNames)} ${pick(lastNames)}`;
}

function createCustomers() {
  return Array.from({ length: 120 }, (_, index) => {
    const name = fullName();
    return {
      name,
      email: `customer${String(index + 1).padStart(3, '0')}@instantmechanic.test`,
      phone: `+91 9${String(100000000 + index).slice(-9)}`,
      address: `${between(10, 999)}, ${pick(localities)}, Bengaluru, Karnataka`,
    };
  });
}

function createMechanics() {
  const statusesByMechanic = [
    ...Array(12).fill('available'),
    ...Array(8).fill('busy'),
    ...Array(5).fill('offline'),
  ];

  return statusesByMechanic.map((status, index) => ({
    name: fullName(),
    email: `mechanic${String(index + 1).padStart(2, '0')}@instantmechanic.test`,
    phone: `+91 8${String(100000000 + index).slice(-9)}`,
    profileImage: '',
    status,
    specializations: [pick(specializations), pick(specializations)].filter(
      (value, position, values) => values.indexOf(value) === position,
    ),
    location: {
      latitude: Number((12.8500 + random() * 0.1800).toFixed(6)),
      longitude: Number((77.5200 + random() * 0.1800).toFixed(6)),
    },
  }));
}

function createBookings(customers, mechanics, services) {
  const bookingDocuments = [];
  const activeMechanics = mechanics.filter((mechanic) => mechanic.status !== 'offline');

  for (let index = 0; index < 540; index += 1) {
    const status = index < 6
      ? ['pending', 'assigned', 'mechanic_on_the_way', 'in_progress', 'completed', 'cancelled'][index]
      : pick(statuses);
    const service = pick(services);
    const [brand, model] = pick(vehicleCatalog);
    const isAssigned = !['pending', 'cancelled'].includes(status) || random() < 0.35;
    const scheduledAt = dateOffset(between(-150, 45));
    const amount = Math.round(service.basePrice * (0.9 + random() * 0.3));
    const booking = {
      bookingId: `BK-${10001 + index}`,
      customer: pick(customers)._id,
      mechanic: isAssigned ? pick(activeMechanics)._id : null,
      service: service._id,
      vehicle: {
        type: pick(vehicleTypes),
        brand,
        model,
        registrationNumber: `KA ${between(1, 59)} ${pick(['AB', 'CD', 'EF', 'GH', 'JK', 'MN'])} ${between(1000, 9999)}`,
      },
      status,
      amount,
      scheduledAt,
      pickupAddress: `${between(10, 999)}, ${pick(localities)}, Bengaluru, Karnataka`,
      notes: random() < 0.18 ? pick(['Please call on arrival.', 'Customer requested an evening slot.', 'Vehicle is parked in the basement.', 'Carry standard diagnostic tools.']) : '',
    };

    if (status === 'completed') {
      booking.startedAt = new Date(scheduledAt.getTime() + between(0, 30) * 60000);
      booking.completedAt = new Date(booking.startedAt.getTime() + service.estimatedDuration * 60000);
    }

    if (status === 'in_progress') {
      booking.startedAt = new Date(scheduledAt.getTime() + between(0, 30) * 60000);
    }

    bookingDocuments.push(booking);
  }

  return bookingDocuments;
}

async function seedDatabase() {
  await connectToDatabase();

  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB connection is not available. Ensure MONGODB_URI is configured.');
  }

  await Promise.all([
    Notification.deleteMany({}),
    Booking.deleteMany({}),
    Mechanic.deleteMany({}),
    Customer.deleteMany({}),
    Service.deleteMany({}),
    User.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('InstantMechanic2026!', 12);
  const users = await User.insertMany([
    { name: 'Aisha Menon', email: 'admin@instantmechanic.test', password: passwordHash, role: 'admin' },
    { name: 'Rohan Kapoor', email: 'operations@instantmechanic.test', password: passwordHash, role: 'operations' },
  ]);
  const customers = await Customer.insertMany(createCustomers());
  const mechanics = await Mechanic.insertMany(createMechanics());
  const services = await Service.insertMany(
    serviceDefinitions.map(([name, category, description, basePrice, estimatedDuration]) => ({
      name,
      category,
      description,
      basePrice,
      estimatedDuration,
    })),
  );
  const bookings = await Booking.insertMany(createBookings(customers, mechanics, services));

  const customerTotals = new Map();
  const mechanicCompletedCounts = new Map();
  const activeBookingByMechanic = new Map();

  for (const booking of bookings) {
    const customerId = booking.customer.toString();
    const total = customerTotals.get(customerId) || { totalBookings: 0, totalSpent: 0 };
    total.totalBookings += 1;
    if (booking.status === 'completed') {
      total.totalSpent += booking.amount;
    }
    customerTotals.set(customerId, total);

    if (booking.mechanic && booking.status === 'completed') {
      const mechanicId = booking.mechanic.toString();
      mechanicCompletedCounts.set(mechanicId, (mechanicCompletedCounts.get(mechanicId) || 0) + 1);
    }

    if (booking.mechanic && ['assigned', 'mechanic_on_the_way', 'in_progress'].includes(booking.status)) {
      activeBookingByMechanic.set(booking.mechanic.toString(), booking._id);
    }
  }

  await Promise.all(customers.map((customer) => {
    const totals = customerTotals.get(customer._id.toString()) || { totalBookings: 0, totalSpent: 0 };
    return Customer.updateOne({ _id: customer._id }, { $set: totals });
  }));

  await Promise.all(mechanics.map((mechanic) => Mechanic.updateOne(
    { _id: mechanic._id },
    {
      $set: {
        jobsCompleted: mechanicCompletedCounts.get(mechanic._id.toString()) || 0,
        currentBooking: mechanic.status === 'busy'
          ? activeBookingByMechanic.get(mechanic._id.toString()) || null
          : null,
      },
    },
  )));

  const notifications = bookings.slice(-36).map((booking, index) => ({
    user: users[index % users.length]._id,
    type: booking.status === 'completed' ? 'booking_completed' : 'booking_update',
    message: booking.status === 'completed'
      ? `Booking ${booking.bookingId} has been completed.`
      : `Booking ${booking.bookingId} status is ${booking.status.replaceAll('_', ' ')}.`,
    booking: booking._id,
    isRead: index % 3 === 0,
  }));
  await Notification.insertMany(notifications);

  const counts = await Promise.all([
    User.countDocuments(),
    Customer.countDocuments(),
    Mechanic.countDocuments(),
    Service.countDocuments(),
    Booking.countDocuments(),
    Notification.countDocuments(),
  ]);

  console.log('Seed completed successfully.');
  console.log(`Users: ${counts[0]}`);
  console.log(`Customers: ${counts[1]}`);
  console.log(`Mechanics: ${counts[2]}`);
  console.log(`Services: ${counts[3]}`);
  console.log(`Bookings: ${counts[4]}`);
  console.log(`Notifications: ${counts[5]}`);
}

seedDatabase()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
