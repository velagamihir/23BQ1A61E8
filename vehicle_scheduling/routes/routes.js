const express = require('express');
const router = express.Router();
const { allocateTasks } = require('../controllers/depotController');

router.post('/allocate', allocateTasks);
module.exports = router;