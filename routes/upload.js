const router = require('express').Router();
const cloudinary = require('cloudinary');
const fs = require('fs');
const auth = require('../middleware/auth');
const authAdmin = require('../middleware/authAdmin');


// Uploading image on cloudinary server
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});


// Upload image [[[**Only ADMIN can use it**]]]
router.post('/upload', auth, authAdmin, (req, res) => {
    try {
        console.log(req.files);
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ msg: "No files were uploaded" });     //DevChannel wrote 'send' instead of 'json'
        }

        const file = req.files.file;

        // File SIZE LESS THAN 1MB
        if (file.size > 1024 * 1024) {
            removeTmp(file.tempFilePath);
            return res.status(400).json({ msg: "File size too large. Please upload a file less than 1MB or 1024KB" });
        }

        //File Format PNG/JPG/JPEG
        if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg') {
            removeTmp(file.tempFilePath);
            return res.status(400).json({ msg: "File format is incorrect. Please upload a file with JPG/JPEG/PNG extension" });
        }

        // Setting the uploader
        cloudinary.v2.uploader.upload(file.tempFilePath, { folder: "test" }, async (err, result) => {
            if (err) {
                throw err;
            }

            removeTmp(file.tempFilePath);

            res.json({ public_id: result.public_id, url: result.secure_url });
        });

        // res.json({ msg: "test upload" });
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
});

// Delete image from cloudinary
router.post('/destroy', auth, authAdmin, (req, res) => {
    try {
        const { public_id } = req.body;
        if (!public_id) {
            return res.status(400).json({ msg: "No image Selected. Please select an image" });
        }

        cloudinary.v2.uploader.destroy(public_id, async (err, result) => {
            if (err) {
                throw err;
            }
            res.json({ msg: "The selected image has been deleted" })
        })
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
});

// Removing TMP files
const removeTmp = (path) => {
    fs.unlink(path, err => {
        if (err) {
            throw err;
        }
    });
}

module.exports = router;