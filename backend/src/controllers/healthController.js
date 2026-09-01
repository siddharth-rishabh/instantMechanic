const { getDatabaseStatus } = require('../config/database');

function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: 'Instant Mechanic API is operational.',
    data: {
      status: 'ok',
      database: getDatabaseStatus(),
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = { getHealth };
