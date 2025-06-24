const express = require('express');
const router = express.Router();
const TrackingData = require('../models/TrackingData');

// Get all tracking data
router.get('/', async (req, res) => {
  try {
    const data = await TrackingData.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new tracking data
router.post('/', async (req, res) => {
  const trackingData = new TrackingData({
    url: req.body.url,
    duration: req.body.duration,
    date: new Date(req.body.date),
    isProductive: req.body.isProductive
  });

  try {
    const newTrackingData = await trackingData.save();
    res.status(201).json(newTrackingData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get daily statistics
router.get('/daily-stats', async (req, res) => {
  try {
    const { date } = req.query;
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const stats = await TrackingData.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTime: { $sum: '$duration' },
          productiveTime: {
            $sum: {
              $cond: [{ $eq: ['$isProductive', true] }, '$duration', 0]
            }
          },
          unproductiveTime: {
            $sum: {
              $cond: [{ $eq: ['$isProductive', false] }, '$duration', 0]
            }
          }
        }
      }
    ]);

    res.json(stats[0] || { totalTime: 0, productiveTime: 0, unproductiveTime: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get site-specific statistics
router.get('/site-stats', async (req, res) => {
  try {
    const stats = await TrackingData.aggregate([
      {
        $group: {
          _id: '$url',
          totalTime: { $sum: '$duration' },
          productiveTime: {
            $sum: {
              $cond: [{ $eq: ['$isProductive', true] }, '$duration', 0]
            }
          },
          unproductiveTime: {
            $sum: {
              $cond: [{ $eq: ['$isProductive', false] }, '$duration', 0]
            }
          }
        }
      }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 