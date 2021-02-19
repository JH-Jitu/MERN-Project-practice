const Products = require('../models/productModel.js');

// Filter, sorting and paginating products

class APIfeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    // Filtering the products
    filtering() {
        const queryObj = { ...this.queryString } //queryString = req.query
        // console.log({ before: queryObj });          //before delete page

        const excludedFields = ['page', 'sort', 'limit'];
        excludedFields.forEach(el => delete (queryObj[el]));

        // console.log({ after: queryObj });          //after delete page

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte|regex)\b/g, match => '$' + match);

        // gte => greater than or equal
        // lte => less than or equal
        // gt => greater than
        // lt => less than
        //regex => Slightly equal. It will show if at least one character or letter matched. Example: if you search 'man' => It will show 'man' with 'woman'

        this.query.find(JSON.parse(queryStr));

        return this;
    }

    // Sorting the products
    sorting() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }
        else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    // Paginating the products
    paginating() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 8;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}


const productCtrl = {
    getProducts: async (req, res) => {
        try {
            const features = new APIfeatures(Products.find(), req.query)
                .filtering().sorting().paginating();
            const products = await features.query;


            res.json({
                status: 'success',
                result: products.length,
                products: products
            });
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
            await Products.findByIdAndDelete(req.params.id);
            res.json({ msg: 'Product deleted successfully' });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    updateProduct: async (req, res) => {
        try {
            const { title, price, description, content, images, category, subCategory } = req.body;

            if (!images) {
                return res.status(400).json({ msg: "No image uploaded" });
            }

            await Products.findOneAndUpdate({ _id: req.params.id }, {
                title: title.toLowerCase(), price, description, content, images, category, subCategory
            });

            res.json({ msg: "Product updated successfully" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}


module.exports = productCtrl;