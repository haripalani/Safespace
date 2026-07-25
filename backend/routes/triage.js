const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const triageController = require('../controllers/triageController');

// POST /api/triage
router.post('/', auth, triageController.handleTriage);

module.exports = router;
