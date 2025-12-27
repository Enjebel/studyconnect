const express = require('express');
const router = express.Router();
const { searchAll } = require('../controllers/searchController');
const auth = require('../middleware/auth');

// This makes the endpoint /api/search?query=math
router.get('/', auth, searchAll);

module.exports = router;