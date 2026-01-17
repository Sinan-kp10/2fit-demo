const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// GET ALL SALES
router.get('/', async (req, res) => {
    try {
        const sales = await Sale.find()
            .populate('productId') // Populate product details to get current stock
            .sort({ date: -1 });
        res.json(sales);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// RECORD NEW SALE (BULK / BILL)
router.post('/bulk', async (req, res) => {
    try {
        const { items, customerName, customerPhone } = req.body;
        const billId = new Date().getTime().toString(); // Simple Bill ID
        const savedSales = [];

        // 1. Validate All Stock First
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.productName}` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name} (Available: ${product.stock})` });
            }
        }

        // 2. Process Sales
        for (const item of items) {
            const product = await Product.findById(item.productId);

            // Use provided totalPrice or calculate
            const finalTotalPrice = item.totalPrice !== undefined ? Number(item.totalPrice) : (item.pricePerItem * item.quantity);
            const costPrice = product.costPrice || 0;
            const totalCost = costPrice * item.quantity;
            const profit = finalTotalPrice - totalCost;

            const newSale = new Sale({
                productId: product._id,
                productName: product.name,
                category: product.category,
                model: product.model,
                size: item.size || product.size,
                quantity: item.quantity,
                pricePerItem: item.pricePerItem,
                costPrice,
                profit,
                totalPrice: finalTotalPrice,
                customerName,
                customerPhone,
                billId,
                createdBy: req.session.user ? req.session.user.email : 'System'
            });

            await newSale.save();
            savedSales.push(newSale);

            // Update Stock
            product.stock -= item.quantity;
            await product.save();
        }

        res.status(201).json({ message: 'Bill saved successfully', sales: savedSales, billId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// RECORD NEW SALE (SINGLE - KEEPING FOR BACKWARD COMPATIBILITY IF NEEDED)
router.post('/', async (req, res) => {
    try {
        const { productId, size, quantity, pricePerItem } = req.body;

        // 1. Validate Product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // 2. Check Stock
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        // 3. Create Sale Record
        // Use provided totalPrice (for discounts) or calculate it
        const finalTotalPrice = req.body.totalPrice !== undefined ? Number(req.body.totalPrice) : (pricePerItem * quantity);

        const costPrice = product.costPrice || 0;
        const totalCost = costPrice * quantity;
        const profit = finalTotalPrice - totalCost;

        const newSale = new Sale({
            productId: product._id,
            productName: product.name,
            category: product.category,
            model: product.model,
            size: size || product.size, // Use selected size or product's default size
            quantity,
            pricePerItem,
            costPrice,
            profit,
            totalPrice: finalTotalPrice,
            createdBy: req.session.user ? req.session.user.email : 'System'
        });

        await newSale.save();

        // 4. Update Product Stock
        product.stock -= quantity;
        await product.save();

        res.status(201).json(newSale);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE SALE (Edit Size, etc)
router.put('/:id', async (req, res) => {
    try {
        const { size } = req.body;
        const sale = await Sale.findById(req.params.id);

        if (!sale) return res.status(404).json({ message: 'Sale not found' });

        if (size) sale.size = size;

        await sale.save();

        // Re-populate to return full object
        await sale.populate('productId');
        res.json(sale);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE SINGLE SALE
router.delete('/:id', async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({ message: 'Sale not found' });

        // Restore Stock
        const product = await Product.findById(sale.productId);
        if (product) {
            product.stock += sale.quantity;
            await product.save();
        }

        await sale.deleteOne();
        res.json({ message: 'Sale deleted and stock restored' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE ALL SALES (Clear History)
router.delete('/', async (req, res) => {
    try {
        await Sale.deleteMany({});
        res.json({ message: 'All sales history deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
