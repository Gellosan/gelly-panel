const express = require('express');
const router = express.Router();
const Gelly = require('../models/Gelly');

router.get('/', async (req, res) => {
  try {
    const leaderboard = await Gelly.find({})
      .sort({ mood: -1 })
      .limit(10)
      .select('displayName mood');

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
