const Category = require("../models/categoryModel");

const categoryCtrl = {
    // Getting the Categories
    getCategories: async (req, res) => {
        try {
            const categories = await Category.find();
            res.json(categories);
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Create a new Category
    createCategory: async (req, res) => {
        try {
            // If user have role = 1, then He is an ====> ADMIN
            // only admin can create, delete and update the categories
            const { name } = req.body;
            const category = await Category.findOne({ name });
            if (category) {
                return res.status(400).json({ msg: "This category already exists" });
            }

            const newCategory = new Category({ name });

            await newCategory.save();

            res.json({ msg: "created a new category" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Delete a Category
    deleteCategory: async (req, res) => {
        try {
            await Category.findByIdAndDelete(req.params.id);
            res.json({ msg: "deleted the category" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Update a Category
    updateCategory: async (req, res) => {
        try {
            const { name } = req.body;
            await Category.findOneAndUpdate({ _id: req.params.id }, { name });

            res.json({ msg: 'Category updated' })
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

module.exports = categoryCtrl;