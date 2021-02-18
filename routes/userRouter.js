const userCtrl = require('../controllers/userCtrl');
const router = require('express').Router();
const auth = require('../middleware/auth');

// Registration page
router.post('/register', userCtrl.register);

// Email Verification page
router.get('/verify', userCtrl.emailConfirm);
// console.log(userCtrl);

//Login page
router.post('/login', userCtrl.login);

// Log out (Removing the refresh token)
router.get('/logout', userCtrl.logout);

// Email Verification
router.get('/resend', userCtrl.emailVerifyResend);

// Forgot Password verification Code sending to email
router.get('/forgotPass', userCtrl.forgotPass);

// Forgotten password changing
router.get('/forgotPassVerify', userCtrl.forgotPassVerify);

// Change Password
router.get('/changePass', userCtrl.changePass);

// Token (security purpose)
router.get('/refresh_token', userCtrl.refreshToken);

// Information authenticator
router.get('/infor', auth, userCtrl.getUser);

module.exports = router;