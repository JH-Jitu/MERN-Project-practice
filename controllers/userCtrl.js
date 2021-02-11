const Users = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userCtrl = {

    // New User registration Object
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            const user = await Users.findOne({ email });
            if (user) {
                return res.status(400).json({ msg: "The email already exists." });
            }

            // if (password.length < 6) {
            //     return res.status(400).json({ msg: "Password should be at least 6 characters" });
            // }

            //Password security
            if (password.search(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/) < 0) {
                return res.status(400).json({ msg: "To check a password between 7 to 15 characters which contain at least one numeric digit and a special character" });
            }

            // Password Encryption
            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = new Users({
                name, email, password: passwordHash
            });

            // Save to MongoDB //
            await newUser.save();

            // Then Create jsonwebtoken to authentication security //
            const accessToken = createAccessToken({ id: newUser._id });
            const refreshtoken = createRefreshToken({ id: newUser._id });

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
        // res.json({ msg: "Test Router connected" });
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