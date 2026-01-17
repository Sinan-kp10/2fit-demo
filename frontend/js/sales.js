// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Session is checked by server middleware. If we load this page, we are authorized.

    loadProductsForDropdown();
    setupEventListeners();

    // Initialize Flatpickr if present (removed from this page, but kept generic if needed future)
});

let currentProducts = [];

// -------------------- LOAD DATA --------------------

async function loadProductsForDropdown() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        currentProducts = await res.json();

        const select = document.getElementById('saleProduct');
        select.innerHTML = '<option value="">Select Product...</option>';

        currentProducts.forEach(p => {
            const option = document.createElement('option');
            option.value = p._id;
            // Basic text layout
            option.textContent = `${p.name} (${p.model}) - Size: ${p.size} - Stock: ${p.stock}`;

            // Store data attributes for easy access
            option.dataset.price = p.price;
            option.dataset.stock = p.stock;
            option.dataset.productSize = p.size;

            select.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load products', err);
    }
}


// -------------------- EVENTS --------------------

function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/logout`, { method: 'POST' });
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout failed', error);
            window.location.href = '/';
        }
    });

    // Mobile Nav Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Form Interactions
    setupBillingEventListeners();

    // Form Submit (Add to Bill)
    document.getElementById('addItemForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addToBill();
    });

    // Checkout
    document.getElementById('checkoutBtn').addEventListener('click', checkoutBill);
    document.getElementById('clearBillBtn').addEventListener('click', clearBill);
}


let billCart = [];

function setupBillingEventListeners() {
    const productSelect = document.getElementById('saleProduct');
    const quantityInput = document.getElementById('saleQuantity');
    const mrpInput = document.getElementById('saleMRP');
    const productError = document.getElementById('productError');

    // Auto-fill price & Clear Error
    productSelect.addEventListener('change', () => {
        if (productSelect.value) {
            productError.style.display = 'none';
        }

        const selectedOption = productSelect.options[productSelect.selectedIndex];
        if (selectedOption && selectedOption.value) {
            const price = parseFloat(selectedOption.dataset.price);
            document.getElementById('saleMRP').value = price.toFixed(2);
            calculateItemTotal();
        } else {
            document.getElementById('saleMRP').value = '';
            document.getElementById('saleAmount').value = '';
        }
    });

    productSelect.addEventListener('click', () => {
        productError.style.display = 'none';
    });

    quantityInput.addEventListener('input', calculateItemTotal);
    mrpInput.addEventListener('input', calculateItemTotal);

    // Customer Name Error Clear
    document.getElementById('billCustomerName').addEventListener('input', () => {
        document.getElementById('customerNameError').style.display = 'none';
    });
    document.getElementById('billCustomerName').addEventListener('click', () => {
        document.getElementById('customerNameError').style.display = 'none';
    });

    // Bill Discount Listener
    document.getElementById('billDiscount').addEventListener('input', updateBillTotals);
}

function calculateItemTotal() {
    const mrpInput = document.getElementById('saleMRP');
    const amountInput = document.getElementById('saleAmount');
    const quantityInput = document.getElementById('saleQuantity');

    const price = parseFloat(mrpInput.value) || 0;
    const quantity = parseInt(quantityInput.value) || 0;

    // Stock Validation Visual Feedback
    const productSelect = document.getElementById('saleProduct');
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    if (selectedOption && selectedOption.value) {
        const stock = parseInt(selectedOption.dataset.stock) || 0;
        if (quantity > stock) {
            quantityInput.style.borderColor = 'red';
            quantityInput.title = `Max available stock: ${stock}`;
        } else {
            quantityInput.style.borderColor = '';
            quantityInput.title = '';
        }
    }

    amountInput.value = (price * quantity).toFixed(2);
}

function addToBill() {
    // Validate Customer Name First
    const customerNameInput = document.getElementById('billCustomerName');
    const customerNameError = document.getElementById('customerNameError');

    if (!customerNameInput.value.trim()) {
        customerNameError.style.display = 'block';
        customerNameInput.focus();
        return;
    } else {
        customerNameError.style.display = 'none';
    }

    const productSelect = document.getElementById('saleProduct');
    const productId = productSelect.value;
    const selectedOption = productSelect.options[productSelect.selectedIndex];

    // Safety check if nothing selected
    if (!selectedOption || !productId) {
        const productError = document.getElementById('productError');
        productError.style.display = 'block';
        return;
    }

    const productName = selectedOption.text.split(' - ')[0]; // Basic parse
    const size = selectedOption.dataset.productSize;
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const pricePerItem = parseFloat(document.getElementById('saleMRP').value);
    const totalPrice = parseFloat(document.getElementById('saleAmount').value);

    // Customize validation
    const productError = document.getElementById('productError');
    if (!productId) {
        productError.style.display = 'block';
        return;
    } else {
        productError.style.display = 'none';
    }

    if (!quantity) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    // Stock Validation
    const stock = parseInt(selectedOption.dataset.stock) || 0;
    if (quantity > stock) {
        showToast(`Cannot sell more than available stock (${stock})`, 'error');
        document.getElementById('saleQuantity').style.borderColor = 'red';
        return;
    }

    // Add to Cart Array
    billCart.push({
        productId,
        productName,
        size,
        quantity,
        pricePerItem,
        totalPrice
    });

    renderBillTable();

    // Reset Item Form
    document.getElementById('addItemForm').reset();
    document.getElementById('saleMRP').value = '';
    document.getElementById('saleAmount').value = '';
    showToast('Item added to bill', 'info');
}

function renderBillTable() {
    const tbody = document.getElementById('billTableBody');
    tbody.innerHTML = '';

    if (billCart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">No items in bill</td></tr>';
        updateBillTotals();
        return;
    }

    billCart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Product">${item.productName} (${item.size})</td>
            <td data-label="Quantity">${item.quantity}</td>
            <td data-label="Price">₹${item.pricePerItem.toFixed(2)}</td>
            <td data-label="Grand Total">₹${item.totalPrice.toFixed(2)}</td>
            <td data-label="Actions"><button class="btn btn-logout" onclick="removeFromBill(${index})">X</button></td>
        `;
        tbody.appendChild(row);
    });

    updateBillTotals();
}

function removeFromBill(index) {
    billCart.splice(index, 1);
    renderBillTable();
}

function updateBillTotals() {
    let total = billCart.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = parseFloat(document.getElementById('billDiscount').value) || 0;
    const grandTotal = Math.max(0, total - discount);

    document.getElementById('billTotalDisplay').textContent = `₹${total.toFixed(2)}`;
    document.getElementById('billGrandTotalDisplay').textContent = `₹${grandTotal.toFixed(2)}`;
}

function clearBill() {
    if (confirm('Clear current bill?')) {
        billCart = [];
        document.getElementById('billCustomerName').value = '';
        document.getElementById('billCustomerPhone').value = '';
        renderBillTable();
    }
}

async function checkoutBill() {
    if (billCart.length === 0) {
        showToast('Bill is empty!', 'error');
        return;
    }

    const customerName = document.getElementById('billCustomerName').value;
    const customerPhone = document.getElementById('billCustomerPhone').value || '';
    const customerNameError = document.getElementById('customerNameError');

    // Validate Customer Name
    if (!customerName.trim()) {
        customerNameError.style.display = 'block';
        return;
    } else {
        customerNameError.style.display = 'none';
    }

    // Validate Phone if present
    if (customerPhone && !/^\d{10}$/.test(customerPhone)) {
        showToast('Phone number must be exactly 10 digits', 'error');
        return;
    }

    const totalBillAmount = billCart.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = parseFloat(document.getElementById('billDiscount').value) || 0;

    let finalItems = [...billCart];

    if (discount > 0 && totalBillAmount > 0) {
        // Distribute discount proportionally
        const ratio = (totalBillAmount - discount) / totalBillAmount;
        finalItems = finalItems.map(item => ({
            ...item,
            totalPrice: Number((item.totalPrice * ratio).toFixed(2)) // Adjusted price
        }));
    }

    try {
        const res = await fetch(`${API_BASE_URL}/sales/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: finalItems,
                customerName,
                customerPhone
            })
        });

        const data = await res.json();

        if (res.ok) {
            showToast('Bill Saved Successfully!', 'success');
            billCart = [];
            renderBillTable();
            loadProductsForDropdown(); // Refresh Stock
            // No history to reload here
            document.getElementById('billDiscount').value = 0;
            document.getElementById('billCustomerName').value = '';
            document.getElementById('billCustomerPhone').value = '';
        } else {
            showToast(data.message || 'Error saving bill', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server error', 'error');
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}
