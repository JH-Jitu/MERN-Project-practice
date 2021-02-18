const Users = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// Node Mailer
var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport({
    host: "mail.google.com",
    port: 587,
    service: "Gmail",
    // secure: false,
    auth: {
        user: `${process.env.VERIFY_MAIL_USER}`,
        pass: `${process.env.VERIFY_MAIL_PASSWORD}`
    }
});
var rand, mailOptions, host, link;

let getRandomNumber = function (start, range) {
    let getRandom = Math.floor((Math.random() * range) + start);
    while (getRandom > range) {
        getRandom = Math.floor((Math.random() * range) + start);
    }
    return getRandom;

}



const userCtrl = {

    // New User registration Object
    register: async (req, res) => {
        try {
            const { name, phone, email, password } = req.body;

            const user = await Users.findOne({ email });
            if (user) {
                return res.status(400).json({ msg: "The email already exists." });
            }

            if (phone.length != 11) {
                return res.status(400).json({ msg: "Phone number has 11 digit. Please check your phone number again" });
            }

            //Password security
            if (password.search(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/) < 0) {
                return res.status(400).json({ msg: "To check a password between 7 to 15 characters which contain at least one numeric digit and a special character" });
            }

            // *************Sending Email Verification mail to the New User email address*****************

            const randomNum = getRandomNumber(10000, 99999);
            console.log(randomNum);


            // Password Encryption
            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = new Users({
                name, phone, email, password: passwordHash, codeDig: randomNum
            });



            // Save to MongoDB //
            await newUser.save();


            mailOptions = {
                from: '"DA Shortcut" <dashortcutdemo@gmail.com>',
                to: newUser.email,
                subject: "Please confirm your Email account",
                html: `Your Verification Code is ${randomNum}`
            }
            console.log(mailOptions);
            smtpTransport.sendMail(mailOptions, function (error, response) {
                // console.log(response);
                if (error) {
                    console.log(error);
                    res.json("error");
                } else {
                    console.log("Message sent: " + response);
                    res.json("sent");
                }
            });




            // //    Comment For some time**************************************
            // // Then Create jsonwebtoken to authentication security //
            // const accessToken = createAccessToken({ id: newUser._id });
            // const refreshtoken = createRefreshToken({ id: newUser._id });

            // // REFRESH TOKEN
            // res.cookie('refreshtoken', refreshtoken, {
            //     httpOnly: true,
            //     path: '/user/refresh_token'
            // });
            // // ACCESS TOKEN
            // res.json({ accessToken }); //Successful msg
            // //    Comment For some time***************************************



            res.json({ msg: "We have sent you a VERIFICATION CODE to your email address. Please Verify your account by the CODE" }); //Successful msg

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
        // res.json({ msg: "Test Router connected" });
    },

    // Confirm Verification Code
    emailConfirm: async (req, res) => {
        try {
            const { verifyCode, email } = req.body
            const user = await Users.findOne({
                email
            });

            if (!user) {
                return res.status(401).json({ msg: "We were unable to find a user for this verification. Please SignUp!" });
            }
            // user is already verified
            else if (user.isVerified) {
                return res.status(200).json({ msg: "User has been already verified. Please Login" });
            }

            if (verifyCode == user.codeDig) {
                // console.log(verifyCheck);
                user.isVerified = true;
                user.save(function (err) {
                    // error occur
                    if (err) {
                        return res.status(500).send({ msg: err.message });
                    }
                    // account successfully verified
                    else {
                        //    Comment For some time**************************************
                        // Then Create jsonwebtoken to authentication security //
                        const accessToken = createAccessToken({ id: user._id });
                        const refreshtoken = createRefreshToken({ id: user._id });

                        // REFRESH TOKEN
                        res.cookie('refreshtoken', refreshtoken, {
                            httpOnly: true,
                            path: '/user/refresh_token'
                        });
                        // ACCESS TOKEN
                        res.json({ accessToken }); //Successful msg
                        //    Comment For some time***************************************
                        // return res.status(200).send('Your account has been successfully verified');
                    }
                });
            }
            else {
                console.log("There was an error");
                res.json("Verification Error");
            }
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Login Object
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await Users.findOne({ email }); //Email Check
            if (!user) {
                return res.status(400).json({ msg: "User does not exist" })
            }

            const isMatch = await bcrypt.compare(password, user.password); //Password check
            if (!isMatch) {
                return res.status(400).json({ msg: "Password did not match" })
            }

            // Is verified or not
            if (!user.isVerified) {
                // console.log(user.isVerified)
                return res.status(401).json({ msg: 'Your Email has not been verified. Please click on resend' });
            }

            //If Login success, create an access token and a refresh token.//
            const accessToken = createAccessToken({ id: user._id });
            const refreshtoken = createRefreshToken({ id: user._id });

            // REFRESH TOKEN
            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/user/refresh_token'
            });
            // ACCESS TOKEN
            res.json({ accessToken }); //Successful msg
            // res.json({ msg: "Registration success!" }); //Successful msg
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Logout Object
    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/user/refresh_token' });
            return res.json({ msg: "Logged out!" }); //Successful msg
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Refresh Token object (For Security Purpose) // //different path//
    refreshToken: (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken;
            if (!rf_token) {
                return res.status(400).json({ msg: "Please login or register" });
            }

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if (err) {
                    return res.status(400).json({ msg: "Please login or register" });
                }

                const accessToken = createAccessToken({ id: user.id });

                res.json({ accessToken });
            })

            // res.json({ rf_token });

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Email Verification practice
    emailVerifyResend: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await Users.findOne({ email }); //Email Check
            const randomNum = getRandomNumber(10000, 99999);
            if (!user) {
                return res.status(400).json({ msg: "User does not exist" })
            }
            // If Verified
            if (user.isVerified) {
                return res.status(200).json({ msg: 'This account has been already verified. Please log in.' });
            }
            // Is verified or not
            if (!user.isVerified) {
                mailOptions = {
                    from: '"DA Shortcut" <dashortcutdemo@gmail.com>',
                    to: user.email,
                    subject: "Please confirm your Email account",
                    html: `Your Verification Code is ${randomNum}`
                }
                console.log(mailOptions);
                smtpTransport.sendMail(mailOptions, function (error, response) {
                    // console.log(response);
                    if (error) {
                        console.log(error);
                        res.json("error");
                    } else {
                        console.log("Message sent: " + response);
                        // Code Changed
                        user.codeDig = randomNum;
                        user.save();
                        // res.json("sent");
                    }
                });
                res.json({ msg: 'Message Sent Successfully' });
            }

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Change Password
    changePass: async (req, res) => {
        try {
            const { email, password, changedPass } = req.body;

            const user = await Users.findOne({ email }); //Email Check

            if (!user) {
                return res.status(400).json({ msg: "User does not exist" })
            }

            const isMatch = await bcrypt.compare(password, user.password); //Password check
            if (!isMatch) {
                return res.status(400).json({ msg: "Password did not match" })
            }

            // Is verified or not
            if (!user.isVerified) {
                // console.log(user.isVerified)
                return res.status(401).json({ msg: 'Your Email has not been verified. Please click on resend' });
            }

            // Matched
            if (isMatch) {
                if (changedPass.search(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/) < 0) {
                    return res.status(400).json({ msg: "To check a password between 7 to 15 characters which contain at least one numeric digit and a special character" });
                }
                const changedPassHash = await bcrypt.hash(changedPass, 10);
                user.password = changedPassHash;
                user.save(function (err) {
                    // error occur
                    if (err) {
                        return res.status(500).send({ msg: err.message });
                    }
                    // account successfully verified
                    else {
                        //    Comment For some time**************************************
                        // Then Create jsonwebtoken to authentication security //
                        const accessToken = createAccessToken({ id: user._id });
                        const refreshtoken = createRefreshToken({ id: user._id });

                        // REFRESH TOKEN
                        res.cookie('refreshtoken', refreshtoken, {
                            httpOnly: true,
                            path: '/user/refresh_token'
                        });
                        // ACCESS TOKEN
                        res.json({ accessToken }); //Successful msg
                        //    Comment For some time***************************************
                        // return res.status(200).send('Your account has been successfully verified');
                    }
                });
            }

            // //If Login success, create an access token and a refresh token.//
            // const accessToken = createAccessToken({ id: user._id });
            // const refreshtoken = createRefreshToken({ id: user._id });

            // // REFRESH TOKEN
            // res.cookie('refreshtoken', refreshtoken, {
            //     httpOnly: true,
            //     path: '/user/refresh_token'
            // });
            // // ACCESS TOKEN
            // res.json({ accessToken }); //Successful msg
            // // res.json({ msg: "Registration success!" }); //Successful msg
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Forgot Password Verification Code 
    forgotPass: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await Users.findOne({ email }); //Email Check
            const randomNum = getRandomNumber(10000, 99999);
            if (!user) {
                return res.status(400).json({ msg: "User does not exist" })
            }

            // Is verified or not
            if (user) {
                mailOptions = {
                    from: '"DA Shortcut" <dashortcutdemo@gmail.com>',
                    to: user.email,
                    subject: "Forgot password verification of DA Shortcut",
                    html: `Your Verification code for changing password is ${randomNum}`
                }
                console.log(mailOptions);
                smtpTransport.sendMail(mailOptions, function (error, response) {
                    // console.log(response);
                    if (error) {
                        console.log(error);
                        res.json("error");
                    } else {
                        console.log("Message sent: " + response);
                        // Code Changed
                        user.codeDig = randomNum;
                        user.save();
                        // res.json("sent");
                    }
                });
                res.json({ msg: 'Your Verification code for changing password is sent' });
            }

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Change Password of Forgotten Password
    forgotPassVerify: async (req, res) => {
        try {
            const { email, passChangeCode, changedPass } = req.body;

            const user = await Users.findOne({ email }); //Email Check

            if (!user) {
                return res.status(400).json({ msg: "User does not exist" })
            }

            if (passChangeCode != user.codeDig) {
                return res.status(400).json({ msg: "You have put wrong password verification code" });
            }
            // Verification code of changing password equals to the input Code
            if (passChangeCode == user.codeDig) {
                if (changedPass.search(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/) < 0) {
                    return res.status(400).json({ msg: "To check a password between 7 to 15 characters which contain at least one numeric digit and a special character" });
                }
                const changedPassHash = await bcrypt.hash(changedPass, 10);
                user.password = changedPassHash;
                user.isVerified = true;
                user.save(function (err) {
                    // error occur
                    if (err) {
                        return res.status(500).send({ msg: err.message });
                    }
                    // account successfully verified
                    else {
                        //    Comment For some time**************************************
                        // Then Create jsonwebtoken to authentication security //
                        const accessToken = createAccessToken({ id: user._id });
                        const refreshtoken = createRefreshToken({ id: user._id });

                        // REFRESH TOKEN
                        res.cookie('refreshtoken', refreshtoken, {
                            httpOnly: true,
                            path: '/user/refresh_token'
                        });
                        // ACCESS TOKEN
                        res.json({ accessToken }); //Successful msg
                        //    Comment For some time***************************************
                        // return res.status(200).send('Your account has been successfully verified');
                    }
                });
            }

            // //If Login success, create an access token and a refresh token.//
            // const accessToken = createAccessToken({ id: user._id });
            // const refreshtoken = createRefreshToken({ id: user._id });

            // // REFRESH TOKEN
            // res.cookie('refreshtoken', refreshtoken, {
            //     httpOnly: true,
            //     path: '/user/refresh_token'
            // });
            // // ACCESS TOKEN
            // res.json({ accessToken }); //Successful msg
            // // res.json({ msg: "Registration success!" }); //Successful msg
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Information authenticator
    getUser: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id).select('-password');
            if (!user) {
                return res.status(400).json({ msg: "User does not exist" });
            }
            res.json(user);
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

const createAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
}
const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
}


module.exports = userCtrl;