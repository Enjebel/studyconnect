const express = require('express');
const router = express.Router();
const { createGroup, getAllGroups } = require('../controllers/groupController');
const auth = require('../middleware/auth');

router.post('/create', auth, createGroup);
router.get('/all', getAllGroups);

module.exports = router;