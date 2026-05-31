const express = require('express');
const profileController = require('../controllers/profileController');

const router = express.Router();

router.get('/stats/summary', profileController.getProfilesSummary);
router.post('/:username/analyze', profileController.analyzeProfile);
router.get('/', profileController.listProfiles);
router.get('/:username', profileController.getProfile);

module.exports = router;
