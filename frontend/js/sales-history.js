// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Session is checked by server middleware. If we load this page, we are authorized.

    loadSalesHistory();
    setupEventListeners();

    // Initialize Flatpickr
    flatpickr("#searchDate", {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        theme: "dark"
    });
});

let salesData = [];

// -------------------- LOAD DATA --------------------

async function loadSalesHistory() {
    try {
        const res = await fetch(`${API_BASE_URL}/sales`);
        salesData = await res.json();
        renderSalesTable(salesData);
    } catch (err) {
        console.error('Failed to load sales', err);
    }
}

function renderSalesTable(sales) {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';

    if (!sales.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center">No sales recorded</td></tr>'; // Adjusted colspan to 9
        document.getElementById('totalSalesAmount').textContent = '₹0.00';
        return;
    }

    let totalAmount = 0;

    const groups = {};

    sales.forEach(sale => {
        // Use billId as key, or fallback to unique _id if no billId (legacy support)
        const key = sale.billId || sale._id;

        if (!groups[key]) {
            groups[key] = {
                ids: [],
                date: sale.date,
                customerName: sale.customerName,
                customerPhone: sale.customerPhone,
                items: [], // Store objects instead of strings
                totalQuantity: 0,
                totalPrice: 0,
                totalPrice: 0,
                billId: sale.billId,
                createdBy: sale.createdBy
            };
        }

        const group = groups[key];
        group.ids.push(sale._id);
        group.items.push({
            name: sale.productName,
            size: sale.size,
            qty: sale.quantity,
            category: sale.category,
            price: sale.pricePerItem
        });
        group.totalQuantity += sale.quantity;
        group.totalPrice += sale.totalPrice;
    });

    const sortedGroups = Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedGroups.forEach(group => {
        totalAmount += group.totalPrice;

        const row = document.createElement('tr');
        const date = new Date(group.date).toLocaleDateString() + ' ' + new Date(group.date).toLocaleTimeString();

        // Render Columns with vertical alignment
        // Product Display with Category Badge (Mobile Only) and separate Category Column (Desktop Only)

        // Product Column: Contains Name and Inline Badge (hidden on desktop via CSS)
        const productDisplay = `<div>${group.items.map(i => `
            <div style="display: flex; justify-content: space-between; align-items: center; min-height: 25px; margin-bottom: 2px;">
                <span>${i.name} (${i.size}) x${i.qty}</span>
                <span class="category-badge mobile-only">${i.category}</span>
            </div>
        `).join('')}</div>`;

        // Category Column: Contains only Badges (hidden on mobile via CSS)
        const categoryDisplay = `<div>${group.items.map(i => `<div style="height: 25px; line-height: 25px;"><span class="category-badge">${i.category}</span></div>`).join('')}</div>`;

        const priceDisplay = `<div class="price-list-container">${group.items.map(i => `<div style="height: 25px; line-height: 25px;">₹${i.price.toFixed(2)}</div>`).join('')}</div>`;

        // IDs for bulk delete
        const idsString = group.ids.join(',');

        row.innerHTML = `
            <td><input type="checkbox" class="sale-checkbox" value="${idsString}" data-count="${group.ids.length}"></td>
            <td data-label="Date">${date}</td>
            <td data-label="Customer">${group.customerName || '-'}</td>
            <td data-label="Phone">${group.customerPhone || '-'}</td>
            <td data-label="Product">${productDisplay}</td>
            <td data-label="Category" class="desktop-only">${categoryDisplay}</td>
            <td data-label="Quantity">${group.totalQuantity}</td>
            <td data-label="MRP (₹)">${priceDisplay}</td> 
            <td data-label="NET AMOUNT (₹)">₹${group.totalPrice.toFixed(2)}</td>
            <td data-label="Billed By">${(group.createdBy || '').split('@')[0]}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('totalSalesAmount').textContent = `₹${totalAmount.toFixed(2)}`;

    // Re-attach listeners for checkboxes
    updateDeleteButtonState();
    document.querySelectorAll('.sale-checkbox').forEach(cb => {
        cb.addEventListener('change', updateDeleteButtonState);
    });
}

function updateDeleteButtonState() {
    const checkboxes = document.querySelectorAll('.sale-checkbox:checked');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const cancelBtn = document.getElementById('cancelSelectionBtn');

    if (checkboxes.length > 0) {
        deleteBtn.style.display = 'block';
        cancelBtn.style.display = 'block';
        deleteBtn.textContent = `Delete Selected (${checkboxes.length})`;
    } else {
        deleteBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
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

    // Search & History
    document.getElementById('searchBtn').addEventListener('click', filterSales);
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchName').value = '';

        const dateInput = document.getElementById('searchDate');
        if (dateInput._flatpickr) {
            dateInput._flatpickr.clear();
        } else {
            dateInput.value = '';
        }

        renderSalesTable(salesData);
    });

    setupHistoryClearListeners();
    setupBulkDeleteListeners();
}


function setupBulkDeleteListeners() {
    const selectAllCb = document.getElementById('selectAllSales');

    selectAllCb.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll('.sale-checkbox').forEach(cb => {
            cb.checked = isChecked;
        });
        updateDeleteButtonState();
    });

    // Cancel Selection Listener
    document.getElementById('cancelSelectionBtn').addEventListener('click', () => {
        document.querySelectorAll('.sale-checkbox').forEach(cb => {
            cb.checked = false;
        });
        document.getElementById('selectAllSales').checked = false;
        updateDeleteButtonState();
    });

    let pendingDeleteIds = [];

    document.getElementById('deleteSelectedBtn').addEventListener('click', () => {
        // Collect all IDs from all selected checkboxes
        let allIds = [];
        document.querySelectorAll('.sale-checkbox:checked').forEach(cb => {
            if (cb.value) {
                const ids = cb.value.split(','); // Value is "id1,id2,..."
                allIds = allIds.concat(ids);
            }
        });

        if (!allIds.length) return;

        pendingDeleteIds = allIds;
        document.getElementById('bulkDeleteMessage').textContent = `Are you sure you want to delete ${pendingDeleteIds.length} items?`;
        document.getElementById('bulkDeleteModal').classList.add('active');
    });

    document.getElementById('cancelBulkDelete').addEventListener('click', () => {
        document.getElementById('bulkDeleteModal').classList.remove('active');
        pendingDeleteIds = [];
    });

    document.getElementById('confirmBulkDelete').addEventListener('click', async () => {
        if (!pendingDeleteIds.length) return;

        try {
            const deletePromises = pendingDeleteIds.map(id =>
                fetch(`${API_BASE_URL}/sales/${id}`, { method: 'DELETE' })
            );

            await Promise.all(deletePromises);

            showToast(`${pendingDeleteIds.length} items deleted`, 'success');
            loadSalesHistory();
            document.getElementById('selectAllSales').checked = false;
            updateDeleteButtonState();

        } catch (err) {
            console.error(err);
            showToast('Error deleting items', 'error');
        } finally {
            document.getElementById('bulkDeleteModal').classList.remove('active');
            pendingDeleteIds = [];
        }
    });
}


function setupHistoryClearListeners() {
    // Clear History
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        document.getElementById('confirmModal').classList.add('active');
    });

    document.getElementById('cancelDelete').addEventListener('click', () => {
        document.getElementById('confirmModal').classList.remove('active');
    });

    document.getElementById('confirmDelete').addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/sales`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Sales history cleared', 'success');
                loadSalesHistory();
            } else {
                showToast('Failed to clear history', 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        }
        document.getElementById('confirmModal').classList.remove('active');
    });
}

function filterSales() {
    const nameTerm = document.getElementById('searchName').value.toLowerCase();
    const dateTerm = document.getElementById('searchDate').value;

    const filtered = salesData.filter(sale => {
        const productName = (sale.productName || '').toLowerCase();
        const customerName = (sale.customerName || '').toLowerCase();

        // Match Name
        const matchesName = productName.includes(nameTerm) || customerName.includes(nameTerm);

        // Match Date (Local YYYY-MM-DD comparison)
        let matchesDate = true;
        if (dateTerm) {
            const saleDate = new Date(sale.date);
            const year = saleDate.getFullYear();
            const month = String(saleDate.getMonth() + 1).padStart(2, '0');
            const day = String(saleDate.getDate()).padStart(2, '0');
            const saleDateString = `${year}-${month}-${day}`;
            matchesDate = saleDateString === dateTerm;
        }

        return matchesName && matchesDate;
    });

    renderSalesTable(filtered);
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
