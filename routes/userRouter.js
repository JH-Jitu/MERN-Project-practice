const userCtrl = require('../controllers/userCtrl');
const router = require('express').Router();
const auth = require('../middleware/auth');

// Registration page
router.post('/register', userCtrl.register);

//Login page
router.post('/login', userCtrl.login);

// Log out (Removing the refresh token)
router.get('/logout', userCtrl.logout);

// Token (security purpose)
router.get('/refresh_token', userCtrl.refreshToken);

// Information authenticator
router.get('/infor', auth, userCtrl.getUser);

module.exports = router;