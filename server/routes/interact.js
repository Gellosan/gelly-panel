const express = require('express');
const router = express.Router();
const Gelly = require('../models/Gelly');

router.post('/', async (req, res) => {
  try {
    const { user, action } = req.body;
    if (!user) {
      return res.status(400).json({ success: false, message: 'Missing user ID' });
    }

    // Find or create Gelly for user
    let gelly = await Gelly.findOne({ userId: user });
    if (!gelly) {
      gelly = new Gelly({ userId: user, displayName: user });
    }

    // Handle actions
    if (action === 'feed') gelly.energy = Math.min(100, gelly.energy + 10);
    if (action === 'play') gelly.mood = Math.min(100, gelly.mood + 10);
    if (action === 'clean') gelly.cleanliness = Math.min(100, gelly.cleanliness + 10);

    // Handle color change
    if (action.startsWith('color:')) {
      const newColor = action.split(':')[1];
      gelly.color = newColor;
    }

    gelly.lastUpdated = new Date();
    await gelly.save();

    res.json({ success: true, state: gelly });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
