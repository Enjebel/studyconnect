const express = require('express');
const router = express.Router();
const { addSession } = require('../controllers/timetableController');

// POST /groups/:groupId/sessions  → add new session
router.post('/:groupId/sessions', addSession);

module.exports = router;