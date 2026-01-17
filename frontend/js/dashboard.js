// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let editingProductId = null;
let productToDeleteId = null;
let productsData = [];

let originalRowHTML = {}; // Store row HTML for cancel

// -------------------- INIT --------------------

document.addEventListener('DOMContentLoaded', () => {
    // Session is checked by server middleware. If we load this page, we are authorized.

    loadProducts();

    setupEventListeners();
    setupSearchListeners();
});

// -------------------- EVENTS --------------------

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove after 3s
    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/logout`, { method: 'POST' });
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout failed', error);
            // Fallback redirect
            window.location.href = '/';
        }
    });

    // Modal Events
    document.getElementById('confirmDelete').addEventListener('click', confirmDeleteAction);
    document.getElementById('cancelDelete').addEventListener('click', hideConfirmModal);

    // Mobile Nav Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }

    document.getElementById('productForm')
        .addEventListener('submit', handleProductSubmit);

    document.getElementById('resetBtn')
        .addEventListener('click', resetProductForm);

    // Setup Form Validation Listeners
    const formFields = ['productName', 'productModel', 'productSize', 'productPrice', 'productCostPrice', 'productStock'];
    formFields.forEach(id => {
        const input = document.getElementById(id);
        const errorId = id + 'Error';
        const error = document.getElementById(errorId);

        if (input) {
            ['input', 'focus'].forEach(evt => {
                input.addEventListener(evt, () => {
                    if (error) error.style.display = 'none';
                });
            });
        }
    });
}

// -------------------- PRODUCTS --------------------

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        productsData = await res.json();
        renderProducts(productsData);
        updateSummaryCards();
    } catch (err) {
        console.error(err);
    }
}

function renderProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';

    if (!products.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">No products</td></tr>`;
        return;
    }

    products.forEach(p => {
        const row = document.createElement('tr');
        row.setAttribute('data-product-id', p._id);

        row.innerHTML = `
            <td data-label="Name">${p.name}</td>
            <td data-label="Category">
                <span class="category-badge">${p.category}</span>
            </td>
            <td data-label="Model">${p.model}</td>
            <td data-label="Size">${p.size}</td>
            <td data-label="Price">₹${p.price.toFixed(2)}</td>
            <td data-label="Cost Price">₹${(p.costPrice || 0).toFixed(2)}</td>
            <td data-label="Stock">${p.stock}</td>

            <td data-label="Actions">
                <button class="btn btn-edit" onclick="editProduct('${p._id}')">Edit</button>
                <button class="btn btn-delete" onclick="deleteProduct('${p._id}')">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}



// -------------------- SUMMARY --------------------

async function updateSummaryCards(filterType = 'all') {
    let totalSold = 0;
    let filteredProfit = 0;

    try {
        // Fetch sales for summary
        const res = await fetch(`${API_BASE_URL}/sales`);
        const sales = await res.json();

        // Total Sold Items (Always All Time for now, or can be filtered too if requested. 
        // User asked for "show profit only... select... profit". Keeping Total Sold as global for now 
        // unless specified otherwise, but usually "Complete Progress" implies overall.
        // Let's keep Total Sold as overall, only filter Profit as explicitly requested.)
        sales.forEach(sale => {
            totalSold += sale.quantity;
        });
        document.getElementById('totalItemsSold').textContent = totalSold;


        // Filter Profit
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7); // Last 7 days

        const startOfMonth = new Date(now);
        startOfMonth.setMonth(now.getMonth() - 1); // Last 30 days

        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            let include = false;

            if (filterType === 'all') {
                include = true;
            } else if (filterType === 'today') {
                include = saleDate >= startOfDay;
            } else if (filterType === 'week') {
                include = saleDate >= startOfWeek;
            } else if (filterType === 'month') {
                include = saleDate >= startOfMonth;
            }

            if (include) {
                filteredProfit += (sale.profit || 0);
            }
        });

        document.getElementById('totalProfit').textContent = `₹${filteredProfit.toFixed(2)}`;

        // Update Label
        const labelMap = {
            'all': 'Total Profit (All Time)',
            'today': 'Total Profit (Today)',
            'week': 'Total Profit (Last 7 Days)',
            'month': 'Total Profit (Last 30 Days)'
        };
        document.getElementById('profitLabel').textContent = labelMap[filterType];

    } catch (err) {
        console.error('Error updating summary', err);
    }
}

// Add Listener for Filter
document.addEventListener('DOMContentLoaded', () => {
    // ... existing init ...
    const filterSelect = document.getElementById('profitFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            updateSummaryCards(e.target.value);
        });
    }
});

// -------------------- PRODUCT FORM --------------------

async function handleProductSubmit(e) {
    e.preventDefault();

    // Validation
    let isValid = true;
    const fields = [
        { id: 'productName', errorId: 'productNameError', msg: 'Please fill in this field' },
        { id: 'productModel', errorId: 'productModelError', msg: 'Please fill in this field' },
        { id: 'productSize', errorId: 'productSizeError', msg: 'Please select a size' },
        { id: 'productPrice', errorId: 'productPriceError', msg: 'Please fill in this field' },
        { id: 'productCostPrice', errorId: 'productCostPriceError', msg: 'Please fill in this field' },
        { id: 'productStock', errorId: 'productStockError', msg: 'Please fill in this field' }
    ];

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const error = document.getElementById(field.errorId);
        if (!input.value.trim()) {
            error.textContent = field.msg;
            error.style.display = 'block';
            isValid = false;
        } else {
            error.style.display = 'none';
        }

        // Add listeners to clear error on interaction (only need to add once, checking if already added would be cleaner but this works for now or we can move it to init)
        // Better approach: Init listeners once. But for now, let's just ensure we don't block submission if valid.
    });

    if (!isValid) return;

    const data = {
        name: productName.value,
        category: productCategory.value,
        model: productModel.value,
        size: productSize.value,
        price: Number(productPrice.value),
        costPrice: Number(document.getElementById('productCostPrice').value),
        stock: Number(productStock.value)
    };

    if (editingProductId) {
        await fetch(`${API_BASE_URL}/products/${editingProductId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        editingProductId = null;
        submitBtn.textContent = 'Add Product';
        showToast('Product updated successfully!', 'info');
    } else {
        await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        showToast('Product added successfully!', 'success');
    }
    resetProductForm();
    loadProducts();

}

function editProduct(id) {
    // If already editing another row, cancel it first
    if (editingProductId && editingProductId !== id) {
        cancelEdit(editingProductId);
    }

    const p = productsData.find(p => p._id === id);
    if (!p) return;

    editingProductId = id;
    const row = document.querySelector(`tr[data-product-id="${id}"]`);
    originalRowHTML[id] = row.innerHTML; // Save state

    row.innerHTML = `
        <td><input type="text" id="edit-name-${id}" class="editable-input" value="${p.name}"></td>
        <td>
            <select id="edit-category-${id}" class="editable-input">
                <option value="boys" ${p.category === 'boys' ? 'selected' : ''}>Boys</option>
                <option value="girls" ${p.category === 'girls' ? 'selected' : ''}>Girls</option>
                <option value="men" ${p.category === 'men' ? 'selected' : ''}>Men</option>
                <option value="women" ${p.category === 'women' ? 'selected' : ''}>Women</option>
                <option value="combo 1" ${p.category === 'combo 1' ? 'selected' : ''}>Combo 1</option>
                <option value="combo 2" ${p.category === 'combo 2' ? 'selected' : ''}>Combo 2</option>
                <option value="combo 3" ${p.category === 'combo 3' ? 'selected' : ''}>Combo 3</option>
                <option value="combo 4" ${p.category === 'combo 4' ? 'selected' : ''}>Combo 4</option>
            </select>
        </td>
        <td><input type="text" id="edit-model-${id}" class="editable-input" value="${p.model}"></td>
        <td>
            <select id="edit-size-${id}" class="editable-input">
                <option value="XS" ${p.size === 'XS' ? 'selected' : ''}>XS</option>
                <option value="S" ${p.size === 'S' ? 'selected' : ''}>S</option>
                <option value="M" ${p.size === 'M' ? 'selected' : ''}>M</option>
                <option value="L" ${p.size === 'L' ? 'selected' : ''}>L</option>
                <option value="XL" ${p.size === 'XL' ? 'selected' : ''}>XL</option>
                <option value="XXL" ${p.size === 'XXL' ? 'selected' : ''}>XXL</option>
                <option value="XXXL" ${p.size === 'XXXL' ? 'selected' : ''}>XXXL</option>
                <option value="Free Size" ${p.size === 'Free Size' ? 'selected' : ''}>Free Size</option>
            </select>
        </td>
        <td><input type="number" id="edit-price-${id}" class="editable-input" value="${p.price}" step="0.01"></td>
        <td><input type="number" id="edit-costPrice-${id}" class="editable-input" value="${p.costPrice || 0}" step="0.01" placeholder="Cost"></td>
        <td><input type="number" id="edit-stock-${id}" class="editable-input" value="${p.stock}"></td>
        <td>
            <div style="display: flex; gap: 5px;">
                <button onclick="saveProductInline('${id}')" class="btn btn-save" style="padding: 6px 10px;">💾</button>
                <button onclick="cancelEdit('${id}')" class="btn btn-logout" style="padding: 6px 10px;">❌</button>
            </div>
        </td>
    `;
}

async function saveProductInline(id) {
    const name = document.getElementById(`edit-name-${id}`).value;
    const category = document.getElementById(`edit-category-${id}`).value;
    const model = document.getElementById(`edit-model-${id}`).value;
    const size = document.getElementById(`edit-size-${id}`).value;
    const price = Number(document.getElementById(`edit-price-${id}`).value);
    const costPrice = Number(document.getElementById(`edit-costPrice-${id}`).value);
    const stock = Number(document.getElementById(`edit-stock-${id}`).value);

    const data = { name, category, model, size, price, costPrice, stock };

    try {
        await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        editingProductId = null;
        showToast('Product updated successfully!', 'info');
        loadProducts(); // Re-render table

    } catch (err) {
        showToast('Failed to update product', 'error');
    }
}

function cancelEdit(id) {
    const row = document.querySelector(`tr[data-product-id="${id}"]`);
    if (row && originalRowHTML[id]) {
        row.innerHTML = originalRowHTML[id];
    }
    editingProductId = null;
}

async function deleteProduct(id) {
    productToDeleteId = id;
    const modal = document.getElementById('confirmModal');
    modal.classList.add('active');
}

function hideConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('active');
    productToDeleteId = null;
}

async function confirmDeleteAction() {
    if (!productToDeleteId) return;

    await fetch(`${API_BASE_URL}/products/${productToDeleteId}`, { method: 'DELETE' });
    showToast('Product deleted successfully', 'error');

    hideConfirmModal();
    loadProducts();

}

function resetProductForm() {
    productForm.reset();
    editingProductId = null;
}

// -------------------- SEARCH & FILTER --------------------

function setupSearchListeners() {
    // Product Search
    document.getElementById('searchBtn').addEventListener('click', filterProducts);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);

    // Progress Search

}

function clearSearch() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchCategory').value = '';
    document.getElementById('searchModel').value = '';
    document.getElementById('searchSize').value = '';
    renderProducts(productsData);
}




function filterProducts() {
    const termName = document.getElementById('searchName').value.toLowerCase();
    const termCategory = document.getElementById('searchCategory').value.toLowerCase();
    const termModel = document.getElementById('searchModel').value.toLowerCase();
    const termSize = document.getElementById('searchSize').value.toLowerCase();

    const filtered = productsData.filter(p => {
        const mName = p.name.toLowerCase().includes(termName);
        const mCategory = termCategory ? p.category.toLowerCase() === termCategory : true;
        const mModel = p.model.toLowerCase().includes(termModel);
        const mSize = p.size.toLowerCase().includes(termSize);
        return mName && mCategory && mModel && mSize;
    });

    renderProducts(filtered);
}


