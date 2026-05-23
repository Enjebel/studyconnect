const express = require('express');
const router = express.Router();
const { 
    createGroup, 
    joinGroup, 
    updateGroupSettings, 
    acceptMember, 
    getGroups 
} = require('../controllers/groupController');
const auth = require('../middleware/auth');

// All group routes
router.get('/', auth, getGroups);
router.post('/create', auth, createGroup);
router.post('/join/:groupId', auth, joinGroup);
router.put('/update/:groupId', auth, updateGroupSettings); // Fixed Reference
router.post('/accept-request', auth, acceptMember);

module.exports = router;