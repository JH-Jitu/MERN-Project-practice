const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: 'String',
        required: true,
        trim: true
    },
    phone: {
        type: 'String',
        required: true,
        unique: true
    },
    email: {
        type: 'String',
        required: true,
        unique: true
    },
    password: {
        type: 'String',
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    codeDig: {
        type: 'Number',
        required: true
    },
    VerifyCode: {
        type: 'Number'
    },
    role: {
        type: 'Number',
        default: 0
    },
    cart: {
        type: 'Array',
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Users', userSchema);