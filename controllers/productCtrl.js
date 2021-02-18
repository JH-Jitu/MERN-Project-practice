const Products = require('../models/productModel.js');

const productCtrl = {
    getProducts: async (req, res) => {
        try {
            const products = await Products.find();


            res.json(products);
            // res.json({ msg: 'Product link test' });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    createProduct: async (req, res) => {
        try {
            const { product_id, title, price, description, content, images, category, subCategory } = req.body;

            // Select image
            if (!images) {
                return res.status(400).json({ msg: "No image uploaded" });
            }

            // Product existing
            const product = await Products.findOne({ product_id });
            if (product) {
                return res.status(400).json({ msg: "The product already exists" });
            }

            const newProduct = new Products({
                product_id, title: title.toLowerCase(), price, description, content, images, category, subCategory
            });

            await newProduct.save();
            res.json({ msg: "Product created successfully" });

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    deleteProduct: async (req, res) => {
        try {

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    updateProduct: async (req, res) => {
        try {

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}


module.exports = productCtrl;