const express = require('express');
const router = express.Router();
const { register, login, adminRegister } = require('../controllers/authController');

router.post('/register', register);          // public customer registration
router.post('/login', login);                // shared login for both
router.post('/admin/register', adminRegister); // separate admin registration

module.exports = router;