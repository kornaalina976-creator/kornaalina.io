// Personal Cabinet functionality - COMPLETELY REWRITTEN
document.addEventListener('DOMContentLoaded', function () {
    console.log('=== PERSONAL CABINET INITIALIZATION STARTED ===');
    initializePersonalCabinet();
});

const selectedOrderIds = new Set();
let orderSelectionInitialized = false;

function getCurrentUserData() {
    if (typeof getStoredCurrentUser === 'function') {
        return getStoredCurrentUser();
    }
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
}

function persistCurrentUserData(user) {
    if (!user) return;
    if (typeof persistCurrentUser === 'function') {
        persistCurrentUser(user);
    } else {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
}

function initializePersonalCabinet() {
    console.log('Initializing personal cabinet...');

    // Check authentication
    const user = getCurrentUserData();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Redirect manager to admin panel
    if (user.role === 'manager') {
        window.location.href = 'admin.html';
        return;
    }

    // Initialize all components
    initializeUserProfile(user);
    initializeNavigation();
    initializeOrdersTab();
    initializeProfileTab();
    initializeCalculationsTab();
    initializeSettingsTab();
    showPendingUserNotifications(user);

    console.log('Personal cabinet initialized');
}

function initializeUserProfile(user) {
    console.log('Initializing user profile:', user.name);

    // Update user info
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (userName) userName.textContent = user.name;
    if (userEmail) userEmail.textContent = user.email;

    // Load profile data into form
    loadProfileData(user);
}

function initializeNavigation() {
    console.log('Initializing navigation...');

    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            // Add active class to clicked item
            this.classList.add('active');

            // Show corresponding tab
            const tabId = this.getAttribute('data-tab') + 'Tab';
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
}

function initializeOrdersTab() {
    console.log('Initializing orders tab...');

    // Order status filter
    const statusFilter = document.getElementById('orderStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterOrders);
    }

    // Load orders
    loadUserOrders();

    // Initialize order actions
    initializeOrderActions();
    initializeOrderSelectionControls();
}

function initializeOrderActions() {
    console.log('Initializing order actions...');

    // Cancel order buttons
    document.addEventListener('click', function (e) {
        if (e.target.closest('.btn-cancel-order')) {
            e.preventDefault();
            const orderCard = e.target.closest('.order-card');
            const orderId = orderCard ? orderCard.getAttribute('data-order-id') : null;
            cancelOrder(orderId, orderCard);
        }

        // Track order buttons
        if (e.target.closest('.btn-track-order')) {
            e.preventDefault();
            const orderCard = e.target.closest('.order-card');
            const orderId = orderCard ? orderCard.getAttribute('data-order-id') : null;
            trackOrder(orderId);
        }

        // Pickup order buttons
        if (e.target.closest('.btn-pickup-order')) {
            e.preventDefault();
            const orderCard = e.target.closest('.order-card');
            const orderId = orderCard ? orderCard.getAttribute('data-order-id') : null;
            pickupOrder(orderId, orderCard);
        }

        // Details buttons
        if (e.target.closest('.btn-order-details')) {
            e.preventDefault();
            const orderCard = e.target.closest('.order-card');
            showOrderDetails(orderCard);
        }
    });
}

function initializeProfileTab() {
    console.log('Initializing profile tab...');

    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveProfileChanges();
        });
    }
}

function initializeCalculationsTab() {
    console.log('Initializing calculations tab...');

    // Load saved calculations
    loadSavedCalculations();

    // Initialize calculation actions
    initializeCalculationActions();
}

function initializeCalculationActions() {
    console.log('Initializing calculation actions...');

    document.addEventListener('click', function (e) {
        // Repeat calculation buttons
        if (e.target.closest('.btn-repeat-calculation')) {
            e.preventDefault();
            const btn = e.target.closest('.btn-repeat-calculation');
            const calcId = btn.getAttribute('data-calc-id');
            const productType = btn.getAttribute('data-product-type') || 'visiting-card';
            repeatCalculation(calcId, productType);
        }

        // Add to cart buttons
        if (e.target.closest('.btn-add-calculation-to-cart')) {
            e.preventDefault();
            const btn = e.target.closest('.btn-add-calculation-to-cart');
            const calcId = btn.getAttribute('data-calc-id');
            addCalculationToCart(calcId);
        }
    });
}

function initializeSettingsTab() {
    console.log('Initializing settings tab...');

    // Change password button
    const changePasswordBtn = document.querySelector('.btn-change-password');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showChangePasswordModal();
        });
    }

    // Delete account button
    const deleteAccountBtn = document.querySelector('.btn-delete-account');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showDeleteAccountConfirmation();
        });
    }
}

// ORDER FUNCTIONS
function loadUserOrders() {
    console.log('Loading user orders...');

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const user = getCurrentUserData();
    const userOrders = orders.filter(order => order.userId === user.email);

    const ordersList = document.querySelector('.orders-list');
    if (!ordersList) return;

    if (userOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>Заказов пока нет</h3>
                <p>Сделайте свой первый заказ в нашем каталоге</p>
                <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>
            </div>
        `;
        resetOrderSelections();
        return;
    }

    ordersList.innerHTML = userOrders.map(order => {
        const orderItems = Array.isArray(order.items) ? order.items : [];
        // Collect all images from order items
        let orderImages = [];
        orderItems.forEach(item => {
            if (item.images && item.images.length > 0) {
                orderImages = orderImages.concat(item.images);
            }
        });
        
        return `
        <div class="order-card status-${order.status}" data-order-id="${order.id}">
            <div class="order-header">
                <div class="order-select">
                    <input type="checkbox" class="order-select-checkbox" data-order-id="${order.id}">
                </div>
                <div class="order-info">
                    <h3>Заказ #${order.id}</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px; align-items: center;">
                        <span class="order-date">
                            <i class="fas fa-calendar"></i>
                            ${new Date(order.date).toLocaleDateString('ru-RU')}
                        </span>
                        <span class="order-status status-${order.status}" style="padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                            <strong>Статус:</strong> ${getOrderStatusText(order.status)}
                        </span>
                        ${order.delivery ? `
                            <span class="order-user" style="color: #667eea;">
                                <i class="fas fa-map-marker-alt"></i>
                                ${order.delivery.city || ''} ${order.delivery.street || ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="order-details">
                ${orderItems.map(item => `
                    <div class="product-item">
                        <div style="flex: 1;">
                            <span>${item.name} (${item.params ? item.params.circulation : 0} шт.)</span>
                            ${item.images && item.images.length > 0 ? `
                                <div style="font-size: 12px; color: #667eea; margin-top: 5px;">
                                    <i class="fas fa-image"></i> Макетов: ${item.images.length}
                                </div>
                            ` : ''}
                        </div>
                        <span>${formatPrice(item.price)}</span>
                    </div>
                `).join('')}
                ${orderImages.length > 0 ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f8f9fa;">
                        <strong style="display: block; margin-bottom: 10px; color: #2c3e50;">Загруженные макеты:</strong>
                        <div class="order-images-preview">
                            ${orderImages.map(img => {
                                if (img.type && img.type.startsWith('image/')) {
                                    return `<img src="${img.data}" alt="${img.name}" title="${img.name}">`;
                                }
                                return `<div style="width: 100%; height: 80px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 6px; border: 2px solid #e0e0e0;"><i class="fas fa-file" style="font-size: 24px; color: #667eea;"></i></div>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                ${order.delivery ? `
                    <div class="order-delivery-info">
                        <strong><i class="fas fa-truck"></i> Доставка:</strong> ${order.delivery.method === 'courier' ? 'Курьером' : 'Самовывоз'}<br>
                        ${order.delivery.city ? `<strong><i class="fas fa-map-marker-alt"></i> Адрес:</strong> ${order.delivery.city}, ${order.delivery.street || ''}` : ''}
                    </div>
                ` : ''}
                ${order.payment ? `
                    <div class="order-payment-info">
                        <strong><i class="fas fa-credit-card"></i> Оплата:</strong> ${getPaymentMethodText(order.payment.method)}
                    </div>
                ` : ''}
                <div class="order-total">
                    Итого: ${formatPrice(order.total)}
                </div>
            </div>
            <div class="order-actions">
                ${order.status === 'new' ? `
                    <button class="btn btn-outline btn-cancel-order">
                        <i class="fas fa-times"></i>Отменить заказ
                    </button>
                ` : ''}
                ${order.status === 'processing' ? `
                    <button class="btn btn-primary btn-track-order">
                        <i class="fas fa-map-marker-alt"></i>Отследить
                    </button>
                ` : ''}
                ${order.status === 'ready' ? `
                    <button class="btn btn-primary btn-pickup-order">
                        <i class="fas fa-box"></i>Забрать заказ
                    </button>
                ` : ''}
                <button class="btn btn-outline btn-order-details">
                    <i class="fas fa-info-circle"></i>Подробнее
                </button>
            </div>
        </div>
        `;
    }).join('');
    resetOrderSelections();
}

function initializeOrderSelectionControls() {
    if (orderSelectionInitialized) return;
    orderSelectionInitialized = true;

    const ordersList = document.querySelector('.orders-list');
    if (ordersList) {
        ordersList.addEventListener('change', handleOrderCheckboxChange);
    }

    const selectAllCheckbox = document.getElementById('selectAllOrders');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAllOrders);
    }

    const createOrderBtn = document.getElementById('createOrderFromSelected');
    if (createOrderBtn) {
        createOrderBtn.addEventListener('click', function () {
            if (createOrderBtn.disabled) return;
            createOrderFromSelectedOrders();
        });
    }

    updateOrderSelectionUI();
}

function handleOrderCheckboxChange(e) {
    const target = e.target;
    if (!target || !target.classList || !target.classList.contains('order-select-checkbox')) return;

    const orderId = target.getAttribute('data-order-id');
    if (!orderId) return;

    if (target.checked) {
        selectedOrderIds.add(orderId);
    } else {
        selectedOrderIds.delete(orderId);
        const selectAllCheckbox = document.getElementById('selectAllOrders');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
    }

    updateOrderSelectionUI();
}

function handleSelectAllOrders(e) {
    const checkbox = e.target;
    if (!checkbox || checkbox.disabled) return;

    const shouldSelectAll = checkbox.checked;
    selectedOrderIds.clear();

    document.querySelectorAll('.order-select-checkbox').forEach(itemCheckbox => {
        itemCheckbox.checked = shouldSelectAll;
        if (shouldSelectAll && itemCheckbox.dataset.orderId) {
            selectedOrderIds.add(itemCheckbox.dataset.orderId);
        }
    });

    if (!shouldSelectAll) {
        selectedOrderIds.clear();
    }

    updateOrderSelectionUI();
}

function resetOrderSelections() {
    selectedOrderIds.clear();
    document.querySelectorAll('.order-select-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    const selectAllCheckbox = document.getElementById('selectAllOrders');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }
    updateOrderSelectionUI();
}

function updateOrderSelectionUI() {
    const count = selectedOrderIds.size;
    const createOrderBtn = document.getElementById('createOrderFromSelected');
    const counter = document.getElementById('selectedOrdersCount');
    const selectAllCheckbox = document.getElementById('selectAllOrders');
    const hasOrderCards = document.querySelectorAll('.order-select-checkbox').length > 0;

    if (createOrderBtn) {
        createOrderBtn.disabled = count === 0;
    }

    if (counter) {
        counter.textContent = count;
        counter.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.disabled = !hasOrderCards;
        if (!hasOrderCards) {
            selectAllCheckbox.checked = false;
        }
    }
}

function createOrderFromSelectedOrders() {
    const user = getCurrentUserData();
    if (!user) {
        showNotification('Не удалось определить пользователя', 'error');
        return;
    }

    if (selectedOrderIds.size === 0) {
        showNotification('Выберите заказы для оформления', 'warning');
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const selectedOrders = orders.filter(order => selectedOrderIds.has(String(order.id)));

    if (selectedOrders.length === 0) {
        showNotification('Выбранные заказы не найдены', 'warning');
        resetOrderSelections();
        return;
    }

    const combinedItems = [];
    selectedOrders.forEach(order => {
        (order.items || []).forEach(item => {
            combinedItems.push({ ...item });
        });
    });

    if (combinedItems.length === 0) {
        showNotification('В выбранных заказах нет позиций', 'warning');
        return;
    }

    const itemsTotal = combinedItems.reduce((sum, item) => {
        return sum + (item.price * (item.quantity || 1));
    }, 0);

    const templateOrder = selectedOrders.find(order => order.delivery) || selectedOrders[0] || {};

    const newOrder = {
        id: Date.now(),
        userId: user.email,
        items: combinedItems,
        total: itemsTotal,
        subtotal: itemsTotal,
        deliveryPrice: templateOrder.deliveryPrice || 0,
        status: 'new',
        date: new Date().toISOString(),
        delivery: templateOrder.delivery ? { ...templateOrder.delivery } : null,
        payment: templateOrder.payment ? { ...templateOrder.payment } : null,
        contact: templateOrder.contact ? { ...templateOrder.contact } : {
            name: user.name || '',
            phone: user.phone || '',
            email: user.email || ''
        },
        comment: `Повторный заказ из заказов: ${selectedOrders.map(o => '#' + o.id).join(', ')}`,
        createdFromSelection: true,
        sourceOrderIds: selectedOrders.map(o => o.id)
    };

    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));

    showOrderCreatedModal(newOrder.id);
    loadUserOrders();
}

function showOrderCreatedModal(orderId) {
    const modal = document.createElement('div');
    modal.className = 'order-created-modal';
    modal.innerHTML = `
        <div class="modal-box">
            <i class="fas fa-check-circle"></i>
            <h3>Заказ оформлен</h3>
            <p>Новый заказ #${orderId} отправлен менеджеру</p>
            <button class="btn btn-primary btn-full" id="closeOrderCreatedModal">
                Понятно
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    };

    const closeBtn = modal.querySelector('#closeOrderCreatedModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    setTimeout(closeModal, 4000);
}

function filterOrders() {
    const status = document.getElementById('orderStatusFilter').value;
    const orderCards = document.querySelectorAll('.order-card');

    orderCards.forEach(card => {
        const cardStatus = card.querySelector('.order-status').textContent.toLowerCase();

        if (status === 'all' || cardStatus.includes(status)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function cancelOrder(orderId, orderCard) {
    if (!orderId || !orderCard) return;
    console.log('Cancelling order:', orderId);

    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Вы уверены, что хотите отменить этот заказ?', 'Отмена заказа').then(confirmed => {
            if (confirmed) {
                const orders = JSON.parse(localStorage.getItem('orders')) || [];
                const numericOrderId = Number(orderId);
                const orderIndex = orders.findIndex(order => order.id === numericOrderId);

                if (orderIndex !== -1) {
                    orders[orderIndex].status = 'cancelled';
                    localStorage.setItem('orders', JSON.stringify(orders));

                    const statusBadge = orderCard.querySelector('.order-status');
                    if (statusBadge) {
                        statusBadge.className = 'order-status status-completed';
                        statusBadge.textContent = 'Отменен';
                    }

                    const cancelBtn = orderCard.querySelector('.btn-cancel-order');
                    if (cancelBtn) cancelBtn.remove();

                    selectedOrderIds.delete(String(orderId));
                    const checkbox = orderCard.querySelector('.order-select-checkbox');
                    if (checkbox) checkbox.checked = false;
                    updateOrderSelectionUI();

                    showNotification('Заказ успешно отменен', 'success');
                }
            }
        });
    }
}

function trackOrder(orderId) {
    if (!orderId) return;
    console.log('Tracking order:', orderId);
    showNotification(`Отслеживание заказа #${orderId}. Статус: В обработке`, 'info');
}

function pickupOrder(orderId, orderCard) {
    if (!orderId || !orderCard) return;
    console.log('Picking up order:', orderId);

    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Подтвердите получение заказа', 'Получение заказа').then(confirmed => {
            if (confirmed) {
                const orders = JSON.parse(localStorage.getItem('orders')) || [];
                const numericOrderId = Number(orderId);
                const orderIndex = orders.findIndex(order => order.id === numericOrderId);

                if (orderIndex !== -1) {
                    orders[orderIndex].status = 'completed';
                    localStorage.setItem('orders', JSON.stringify(orders));

                    const statusBadge = orderCard.querySelector('.order-status');
                    if (statusBadge) {
                        statusBadge.className = 'order-status status-completed';
                        statusBadge.textContent = 'Завершен';
                    }

                    const pickupBtn = orderCard.querySelector('.btn-pickup-order');
                    if (pickupBtn) pickupBtn.remove();

                    selectedOrderIds.delete(String(orderId));
                    const checkbox = orderCard.querySelector('.order-select-checkbox');
                    if (checkbox) checkbox.checked = false;
                    updateOrderSelectionUI();

                    showNotification('Заказ получен. Спасибо за покупку!', 'success');
                }
            }
        });
    }
}

function showOrderDetails(orderCard) {
    if (!orderCard) return;
    const orderId = orderCard.getAttribute('data-order-id');
    const statusElement = orderCard.querySelector('.order-status');
    const orderStatus = statusElement ? statusElement.textContent.trim() : 'Неизвестно';

    if (typeof showAlertModal === 'function') {
        showAlertModal(
            `Номер: #${orderId}<br>Статус: ${orderStatus}<br><br>Подробная информация доступна у менеджера.`,
            'Детали заказа',
            'info'
        );
    }
}

// PROFILE FUNCTIONS
function loadProfileData(user) {
    const profileName = document.getElementById('profileName');
    const profilePhone = document.getElementById('profilePhone');
    const profileEmail = document.getElementById('profileEmail');
    const profileAddress = document.getElementById('profileAddress');

    if (profileName) profileName.value = user.name || '';
    if (profilePhone) profilePhone.value = user.phone || '';
    if (profileEmail) profileEmail.value = user.email || '';
    if (profileAddress) profileAddress.value = user.address || '';
}

function saveProfileChanges() {
    const storedUser = getCurrentUserData();
    if (!storedUser) {
        showNotification('Пользователь не найден', 'error');
        return;
    }

    // Get form values
    const newName = document.getElementById('profileName').value;
    const newPhone = document.getElementById('profilePhone').value;
    const newEmail = document.getElementById('profileEmail').value;
    const newAddress = document.getElementById('profileAddress').value;

    const previousEmail = storedUser.email;
    const updatedUser = {
        ...storedUser,
        name: newName,
        phone: newPhone,
        email: newEmail,
        address: newAddress
    };

    persistCurrentUserData(updatedUser);

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.email === previousEmail);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        localStorage.setItem('users', JSON.stringify(users));
    }

    if (previousEmail !== updatedUser.email) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        let ordersChanged = false;
        orders.forEach(order => {
            if (order.userId === previousEmail) {
                order.userId = updatedUser.email;
                ordersChanged = true;
            }
        });
        if (ordersChanged) {
            localStorage.setItem('orders', JSON.stringify(orders));
        }

        const calculations = JSON.parse(localStorage.getItem('calculations')) || [];
        let calculationsChanged = false;
        calculations.forEach(calc => {
            if (calc.userId === previousEmail) {
                calc.userId = updatedUser.email;
                calculationsChanged = true;
            }
        });
        if (calculationsChanged) {
            localStorage.setItem('calculations', JSON.stringify(calculations));
        }
    }

    initializeUserProfile(updatedUser);

    showNotification('Профиль успешно обновлен', 'success');
}

// CALCULATIONS FUNCTIONS
function loadSavedCalculations() {
    console.log('Loading saved calculations...');

    const user = getCurrentUserData();
    const calculations = JSON.parse(localStorage.getItem('calculations')) || [];
    const calculationsList = document.querySelector('.calculations-list');

    if (!calculationsList) return;

    if (!user) {
        calculationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-lock"></i>
                <h3>Необходимо войти</h3>
                <p>Авторизуйтесь, чтобы просматривать сохраненные расчеты</p>
                <button class="btn btn-primary" id="openLoginFromCalculations">Войти</button>
            </div>
        `;
        const openLogin = document.getElementById('openLoginFromCalculations');
        if (openLogin) {
            openLogin.addEventListener('click', () => {
                const loginModal = document.getElementById('loginModal');
                if (loginModal) loginModal.style.display = 'block';
            });
        }
        return;
    }

    const userCalculations = calculations.filter(calc => {
        if (!calc.userId) {
            return true;
        }
        return calc.userId === user.email;
    });

    if (userCalculations.length === 0) {
        calculationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calculator"></i>
                <h3>Сохраненных расчетов нет</h3>
                <p>Создайте расчеты в калькуляторе стоимости</p>
                <a href="calculator.html" class="btn btn-primary">Перейти к калькулятору</a>
            </div>
        `;
        return;
    }

    calculationsList.innerHTML = userCalculations.map(calc => `
        <div class="calculation-item" data-calc-id="${calc.id}">
            <div class="calc-info">
                <h4>${calc.name}</h4>
                <p>Тираж: ${calc.circulation} шт. | Бумага: ${calc.paperType} ${calc.paperWeight}г/м²</p>
                <span class="calc-date">
                    <i class="fas fa-clock"></i>${calc.date}
                </span>
            </div>
            <div class="calc-price">${formatPrice(calc.price)}</div>
            <div class="calc-actions">
                <button class="btn btn-outline btn-sm btn-repeat-calculation" data-calc-id="${calc.id}" data-product-type="${calc.productType || 'visiting-card'}">
                    <i class="fas fa-redo"></i>Повторить
                </button>
                <button class="btn btn-primary btn-sm btn-add-calculation-to-cart" data-calc-id="${calc.id}">
                    <i class="fas fa-cart-plus"></i>В корзину
                </button>
            </div>
        </div>
    `).join('');
}

function repeatCalculation(calcId, productType) {
    console.log('Repeating calculation:', calcId);
    const calculations = JSON.parse(localStorage.getItem('calculations')) || [];
    const calc = calculations.find(c => c.id == calcId);
    
    if (calc) {
        showNotification(`Расчет "${calc.name}" открыт в калькуляторе`, 'info');
        setTimeout(() => {
            window.location.href = `calculator.html?product=${productType}&calcId=${calcId}`;
        }, 500);
    } else {
        showNotification('Расчет не найден', 'error');
    }
}

function addCalculationToCart(calcId) {
    console.log('Adding calculation to cart:', calcId);

    const user = getCurrentUserData();
    if (!user) {
        showNotification('Для добавления в корзину необходимо войти в систему', 'warning');
        return;
    }

    const calculations = JSON.parse(localStorage.getItem('calculations')) || [];
    const calc = calculations.find(c => c.id == calcId);
    
    if (!calc) {
        showNotification('Расчет не найден', 'error');
        return;
    }

    // Create cart item from calculation
    const cartItem = {
        id: Date.now(),
        name: calc.name,
        type: calc.productType || 'custom-calculation',
        price: calc.price,
        quantity: 1,
        params: {
            paperType: calc.paperType,
            paperWeight: calc.paperWeight,
            colorType: calc.colorType,
            circulation: calc.circulation
        }
    };

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update cart count
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }

    // Minimal notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        font-size: 14px;
    `;
    notification.textContent = 'Товар добавлен в корзину';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

// SETTINGS FUNCTIONS
function showChangePasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Смена пароля</h2>
            <form id="changePasswordForm">
                <div class="form-group">
                    <label>Текущий пароль</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="currentPassword" required>
                        <i class="fas fa-eye password-toggle" id="toggleCurrentPassword"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label>Новый пароль</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="newPassword" required>
                        <i class="fas fa-eye password-toggle" id="toggleNewPassword"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label>Подтвердите новый пароль</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="confirmNewPassword" required>
                        <i class="fas fa-eye password-toggle" id="toggleConfirmPassword"></i>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Сменить пароль</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Setup password toggles
    if (typeof setupPasswordToggles === 'function') {
        setupPasswordToggles(['currentPassword', 'newPassword', 'confirmNewPassword']);
    } else {
        // Manual toggle setup
        const toggles = ['toggleCurrentPassword', 'toggleNewPassword', 'toggleConfirmPassword'];
        const inputs = ['currentPassword', 'newPassword', 'confirmNewPassword'];
        toggles.forEach((toggleId, index) => {
            const toggle = modal.querySelector(`#${toggleId}`);
            const input = modal.querySelector(`#${inputs[index]}`);
            if (toggle && input) {
                toggle.addEventListener('click', () => {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    toggle.classList.toggle('fa-eye');
                    toggle.classList.toggle('fa-eye-slash');
                });
            }
        });
    }

    // Close handlers
    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    };
    
    modal.querySelector('.close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Form submission
    const form = modal.querySelector('#changePasswordForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const currentPassword = modal.querySelector('#currentPassword').value;
            const newPassword = modal.querySelector('#newPassword').value;
            const confirmPassword = modal.querySelector('#confirmNewPassword').value;

            // Validate
            if (!currentPassword) {
                showNotification('Введите текущий пароль', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showNotification('Новые пароли не совпадают', 'error');
                return;
            }

            if (typeof validatePassword === 'function') {
                const passwordValidation = validatePassword(newPassword);
                if (!passwordValidation.valid) {
                    showNotification(passwordValidation.message, 'error');
                    return;
                }
            } else {
                // Fallback validation
                if (newPassword.length < 8) {
                    showNotification('Пароль должен содержать не менее 8 символов', 'error');
                    return;
                }
                if (/^\d+$/.test(newPassword)) {
                    showNotification('Пароль не может состоять только из цифр', 'error');
                    return;
                }
            }

            // Verify current password and update
            const user = getCurrentUserData();
            if (!user) {
                showNotification('Пользователь не найден. Пожалуйста, войдите снова.', 'error');
                closeModal();
                return;
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.email === user.email);

            if (userIndex === -1) {
                showNotification('Пользователь не найден', 'error');
                return;
            }

            if (users[userIndex].password !== currentPassword) {
                showNotification('Неверный текущий пароль', 'error');
                return;
            }

            // Update password
            users[userIndex].password = newPassword;
            localStorage.setItem('users', JSON.stringify(users));

            // Also update saved password if it exists
            const savedEmail = localStorage.getItem('savedEmail');
            if (savedEmail && savedEmail.toLowerCase() === user.email.toLowerCase()) {
                localStorage.setItem('savedPassword', newPassword);
            }

            showNotification('Пароль успешно изменен', 'success');
            closeModal();
        });
    }
}

function showDeleteAccountConfirmation() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close">&times;</span>
            <h2 style="color: #e74c3c; margin-bottom: 20px;">
                <i class="fas fa-exclamation-triangle"></i> Удаление аккаунта
            </h2>
            <div style="padding: 20px; background: #fff3cd; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-weight: 600;">
                    ВНИМАНИЕ! Это действие нельзя отменить!
                </p>
            </div>
            <p style="margin-bottom: 20px; line-height: 1.6;">
                При удалении аккаунта будут безвозвратно удалены:
            </p>
            <ul style="margin-bottom: 20px; padding-left: 20px; line-height: 2;">
                <li>Все ваши персональные данные</li>
                <li>История заказов</li>
                <li>Сохраненные расчеты</li>
                <li>Настройки аккаунта</li>
            </ul>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-outline" id="cancelDelete">
                    Отмена
                </button>
                <button class="btn btn-danger" id="confirmDelete">
                    <i class="fas fa-trash-alt"></i> Удалить аккаунт
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Close handlers
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = modal.querySelector('#cancelDelete');
    
    function closeModal() {
        modal.remove();
        document.body.style.overflow = 'auto';
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Confirm delete
    modal.querySelector('#confirmDelete').addEventListener('click', function() {
        const user = getCurrentUserData();
        if (!user) {
            showNotification('Пользователь не найден', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const updatedUsers = users.filter(u => u.email !== user.email);
        localStorage.setItem('users', JSON.stringify(updatedUsers));

        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const filteredOrders = orders.filter(order => order.userId !== user.email);
        localStorage.setItem('orders', JSON.stringify(filteredOrders));

        const calculations = JSON.parse(localStorage.getItem('calculations')) || [];
        const filteredCalculations = calculations.filter(calc => calc.userId !== user.email);
        localStorage.setItem('calculations', JSON.stringify(filteredCalculations));

        const notifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
        if (notifications[user.email]) {
            delete notifications[user.email];
            localStorage.setItem('userNotifications', JSON.stringify(notifications));
        }

        localStorage.removeItem('cart');
        localStorage.removeItem('calculatorUploadedImages');
        if (typeof clearStoredCurrentUser === 'function') {
            clearStoredCurrentUser();
        } else {
            localStorage.removeItem('currentUser');
        }

        closeModal();
        showNotification('Аккаунт успешно удален', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    });
}


function getOrderStatusText(status) {
    const statusMap = {
        'new': 'Новый',
        'processing': 'В работе',
        'ready': 'Готов',
        'completed': 'Завершен',
        'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
}

function getPaymentMethodText(method) {
    const methods = {
        'card': 'Банковская карта',
        'cash': 'Наличными',
        'online': 'Онлайн оплата',
        'invoice': 'По счету'
    };
    return methods[method] || method;
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function showNotification(message, type = 'info') {
    // Use the notification function from main.js if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else if (typeof showAlertModal === 'function') {
        // Use modal as fallback
        showAlertModal(message, 'Уведомление', type);
    }
}

function showPendingUserNotifications(user) {
    if (!user || !user.email) return;

    const notificationsMap = JSON.parse(localStorage.getItem('userNotifications')) || {};
    const userNotifications = notificationsMap[user.email] || [];
    const unread = userNotifications.filter(notification => !notification.read);

    if (unread.length === 0) return;

    unread.forEach(notification => {
        showNotification(notification.message, notification.type || 'info');
    });

    notificationsMap[user.email] = userNotifications.map(notification => ({
        ...notification,
        read: true
    }));

    localStorage.setItem('userNotifications', JSON.stringify(notificationsMap));
}