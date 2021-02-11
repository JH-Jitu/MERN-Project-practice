require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');


const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(fileUpload({
    useTempFiles: true
}));


//Routes 
app.use('/user', require('./routes/userRouter'));


//Connect to mongoDB 
const URI = process.env.MONGODB_URL
mongoose.connect(URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
},
    err => {
        if (err) {
            throw err;
            console.log("Not connected to mongoDB")
        };
        console.log('Connected to MongoDB');
    })

//FRONT PAGE
app.get('/', (req, res) => {
    res.json({ msg: 'Welcome to the front page of my e-commerce site. We will do it IN SHA ALLAH' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("server is running successfully on port", PORT);
});