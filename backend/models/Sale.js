const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: { type: String, required: true }, // Snapshot of name in case product is deleted
    category: { type: String, required: true },
    model: { type: String },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerItem: { type: Number, required: true },
    costPrice: { type: Number, default: 0 }, // Cost per item at time of sale
    profit: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    customerName: { type: String, default: 'Walk-in' },
    customerPhone: { type: String, default: '' },
    billId: { type: String }, // To group items
    createdBy: { type: String, default: 'System' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
