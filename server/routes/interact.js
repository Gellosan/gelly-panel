const express = require('express');
const router = express.Router();
const Gelly = require('../models/Gelly');
const express = require('express');
const router = express.Router();
const Gelly = require('../models/Gelly');

// POST /v1/interact
router.post('/', async (req, res) => {
  try {
    const { user, action } = req.body;
    if (!user || !action) {
      return res.status(400).json({ success: false, message: 'Missing user or action' });
    }

    let gelly = await Gelly.findOne({ userId: user });
    if (!gelly) {
      gelly = new Gelly({ userId: user });
    }

    // Update based on action
    if (action === 'feed') gelly.energy = Math.min(100, gelly.energy + 10);
    if (action === 'play') gelly.mood = Math.min(100, gelly.mood + 10);
    if (action === 'clean') gelly.cleanliness = Math.min(100, gelly.cleanliness + 10);
    if (action.startsWith('color:')) gelly.color = action.split(':')[1];

    gelly.lastUpdated = new Date();
    await gelly.save();

    res.json({ success: true, message: 'Action applied', state: gelly });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

