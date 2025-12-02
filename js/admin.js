// Admin Panel functionality
document.addEventListener('DOMContentLoaded', function () {
    console.log('=== ADMIN PANEL INITIALIZATION STARTED ===');
    try {
        initializeAdminPanel();
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        // Show error to user
        if (typeof showAlertModal === 'function') {
            showAlertModal('Ошибка инициализации панели администратора. Пожалуйста, обновите страницу.', 'Ошибка', 'error');
        } else {
            alert('Ошибка инициализации панели администратора. Пожалуйста, обновите страницу.');
        }
    }
});

function initializeAdminPanel() {
    console.log('Initializing admin panel...');

    // Check if user is manager or admin
    let user = null;
    if (typeof getStoredCurrentUser === 'function') {
        user = getStoredCurrentUser();
    } else {
        const userData = localStorage.getItem('currentUser');
        user = userData ? JSON.parse(userData) : null;
    }
    
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
        // Silently redirect without alert
        window.location.href = 'index.html';
        return;
    }

    // Update user info
    const adminName = document.getElementById('adminName');
    const adminEmail = document.getElementById('adminEmail');
    if (adminName) adminName.textContent = user.name || 'Менеджер';
    if (adminEmail) adminEmail.textContent = user.email || '';

    // Initialize all components
    try {
        if (typeof initializeNavigation === 'function') {
            initializeNavigation();
        } else {
            console.error('initializeNavigation is not defined');
        }
        
        if (typeof initializeStatisticsTab === 'function') {
            initializeStatisticsTab();
        } else {
            console.error('initializeStatisticsTab is not defined');
        }
        
        if (typeof initializeOrdersTab === 'function') {
            initializeOrdersTab();
        } else {
            console.error('initializeOrdersTab is not defined');
        }
        
        if (typeof initializeUsersTab === 'function') {
            initializeUsersTab();
        } else {
            console.error('initializeUsersTab is not defined');
        }
        
        if (typeof initializeSettingsTab === 'function') {
            initializeSettingsTab();
        } else {
            console.error('initializeSettingsTab is not defined');
        }
        
        // Set default tab to orders
        const ordersTab = document.getElementById('ordersTab');
        const statisticsTab = document.getElementById('statisticsTab');
        if (ordersTab) ordersTab.classList.add('active');
        if (statisticsTab) statisticsTab.classList.remove('active');

        console.log('Admin panel initialized successfully');
    } catch (error) {
        console.error('Error initializing admin components:', error);
        if (typeof showAlertModal === 'function') {
            showAlertModal('Ошибка при инициализации компонентов панели администратора: ' + error.message, 'Ошибка', 'error');
        }
        throw error;
    }
}

function initAdminUser() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const adminExists = users.find(u => u.email === 'admin@printhub.ru');
    
    if (!adminExists) {
        const adminUser = {
            name: 'Администратор',
            email: 'admin@printhub.ru',
            phone: '+7 (495) 000-00-00',
            password: 'admin123',
            role: 'admin'
        };
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Auto-login as admin
        const adminSession = {
            name: adminUser.name,
            email: adminUser.email,
            phone: adminUser.phone,
            role: 'admin'
        };
        if (typeof persistCurrentUser === 'function') {
            persistCurrentUser(adminSession);
        } else {
            localStorage.setItem('currentUser', JSON.stringify(adminSession));
        }
    }
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

function initializeStatisticsTab() {
    console.log('Initializing statistics tab...');
    loadStatistics();
}

function loadStatistics() {
    // Load orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const totalOrders = orders.length;
    
    // Calculate revenue
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Count orders by status
    const newOrders = orders.filter(o => o.status === 'new').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const readyOrders = orders.filter(o => o.status === 'ready').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    
    // Load users (only clients)
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const totalUsers = users.filter(u => u.role !== 'admin' && u.role !== 'manager').length;
    
    // Calculate average order value
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Update UI
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalUsersEl = document.getElementById('totalUsers');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const averageOrderEl = document.getElementById('averageOrder');
    
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    if (totalRevenueEl) totalRevenueEl.textContent = formatPrice(totalRevenue);
    if (averageOrderEl) averageOrderEl.textContent = formatPrice(averageOrder);
    
    document.getElementById('newOrdersCount').textContent = newOrders;
    document.getElementById('processingOrdersCount').textContent = processingOrders;
    document.getElementById('readyOrdersCount').textContent = readyOrders;
    document.getElementById('completedOrdersCount').textContent = completedOrders;
}

function initializeOrdersTab() {
    console.log('Initializing orders tab...');
    
    // Order status filter
    const statusFilter = document.getElementById('adminOrderStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterAdminOrders);
    }
    
    loadAllOrders();
}

function loadAllOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const ordersList = document.getElementById('adminOrdersList');
    
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>Заказов пока нет</h3>
                <p>Заказы будут отображаться здесь</p>
            </div>
        `;
        return;
    }
    
    // Get users for display
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    ordersList.innerHTML = orders.map(order => {
        const user = users.find(u => u.email === order.userId);
        const userName = user ? user.name : order.userId;
        const userPhone = user ? user.phone : '';
        const deliveryAddress = order.delivery ? 
            `${order.delivery.city || ''}, ${order.delivery.street || ''}`.trim() : 
            'Адрес не указан';
        
        return `
            <div class="order-card status-${order.status}" data-status="${order.status}">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Заказ #${order.id}</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px;">
                            <span class="order-date">
                                <i class="fas fa-calendar"></i>
                                ${new Date(order.date).toLocaleDateString('ru-RU')}
                            </span>
                            <span class="order-user">
                                <i class="fas fa-user"></i>
                                <strong>Клиент:</strong> ${userName}
                            </span>
                            ${userPhone ? `
                                <span class="order-user">
                                    <i class="fas fa-phone"></i>
                                    ${userPhone}
                                </span>
                            ` : ''}
                            <span class="order-user" style="color: #667eea;">
                                <i class="fas fa-map-marker-alt"></i>
                                <strong>Адрес:</strong> ${deliveryAddress}
                            </span>
                        </div>
                    </div>
                    <div class="order-status status-${order.status}" style="margin-left: auto;">
                        <strong>Статус:</strong><br>
                        ${getOrderStatusText(order.status)}
                    </div>
                </div>
                <div class="order-details">
                    <div style="margin-bottom: 15px;">
                        <strong style="color: #2c3e50; font-size: 16px;">Состав заказа:</strong>
                    </div>
                    ${order.items ? order.items.map(item => `
                        <div class="product-item">
                            <div style="flex: 1;">
                                <span><strong>${item.name}</strong></span>
                                ${item.params ? `
                                    <div style="font-size: 13px; color: #7f8c8d; margin-top: 5px;">
                                        Тираж: ${item.params.circulation || 0} шт. | 
                                        Бумага: ${item.params.paperType || 'Не указано'} | 
                                        Цветность: ${item.params.colorType || 'Не указано'}
                                    </div>
                                ` : ''}
                            </div>
                            <span style="font-weight: 600;">${formatPrice(item.price * (item.quantity || 1))}</span>
                        </div>
                    `).join('') : ''}
                    ${order.delivery ? `
                        <div class="order-delivery-info" style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                            <strong><i class="fas fa-truck"></i> Способ получения:</strong> ${order.delivery.method === 'courier' ? 'Курьером' : 'Самовывоз'}<br>
                            ${order.delivery.city ? `<strong><i class="fas fa-map-marker-alt"></i> Адрес доставки:</strong> ${order.delivery.city}, ${order.delivery.street || ''} ${order.delivery.postcode ? `(${order.delivery.postcode})` : ''}` : ''}
                            ${order.delivery.comment ? `<br><strong>Комментарий:</strong> ${order.delivery.comment}` : ''}
                        </div>
                    ` : ''}
                    ${order.payment ? `
                        <div class="order-payment-info" style="margin-top: 10px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                            <strong><i class="fas fa-credit-card"></i> Способ оплаты:</strong> ${getPaymentMethodText(order.payment.method)}
                        </div>
                    ` : ''}
                    ${order.comment ? `
                        <div style="margin-top: 10px; padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 3px solid #ffc107;">
                            <strong><i class="fas fa-comment-alt"></i> Комментарий к заказу:</strong> ${order.comment}
                        </div>
                    ` : ''}
                    <div class="order-total">
                        Итого: ${formatPrice(order.total)}
                    </div>
                </div>
                <div class="order-actions">
                    <select class="status-select" data-order-id="${order.id}" style="padding: 10px 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                        <option value="new" ${order.status === 'new' ? 'selected' : ''}>Новый</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>В работе</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Готов</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Завершен</option>
                    </select>
                    <div style="display:flex; flex-wrap:wrap; gap:10px;">
                        <button class="btn btn-primary btn-update-status" data-order-id="${order.id}">
                            <i class="fas fa-save"></i>Обновить статус
                        </button>
                        <button 
                            class="btn btn-outline btn-contact-client" 
                            data-order-id="${order.id}"
                            data-client-name="${userName}"
                            data-client-email="${user ? user.email : order.userId}"
                            data-client-phone="${userPhone}">
                            <i class="fas fa-headset"></i>Связаться с клиентом
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners using event delegation
    const ordersContainer = document.getElementById('adminOrdersList');
    if (ordersContainer) {
        ordersContainer.addEventListener('click', function(e) {
            if (e.target.closest('.btn-update-status')) {
                const btn = e.target.closest('.btn-update-status');
                const orderId = btn.getAttribute('data-order-id');
                const orderCard = btn.closest('.order-card');
                
                // Try to find status select in the same order card
                let statusSelect = null;
                if (orderCard) {
                    statusSelect = orderCard.querySelector(`.status-select[data-order-id="${orderId}"]`);
                    // If not found, try to find any status select in the card
                    if (!statusSelect) {
                        statusSelect = orderCard.querySelector('.status-select');
                    }
                }
                
                // Fallback: search by order ID in the entire document
                if (!statusSelect) {
                    statusSelect = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
                }
                
                if (statusSelect && statusSelect.value) {
                    updateOrderStatus(orderId, statusSelect.value);
                } else {
                    showNotification('Не удалось найти выбранный статус', 'error');
                    console.error('Status select not found for order:', orderId);
                }
                return;
            }
            
            if (e.target.closest('.btn-contact-client')) {
                const contactBtn = e.target.closest('.btn-contact-client');
                const clientData = {
                    orderId: contactBtn.dataset.orderId,
                    name: contactBtn.dataset.clientName || 'Клиент',
                    email: contactBtn.dataset.clientEmail || '',
                    phone: contactBtn.dataset.clientPhone || ''
                };
                openContactClientModal(clientData);
            }
        });
    }
}

function filterAdminOrders() {
    const status = document.getElementById('adminOrderStatusFilter').value;
    const orderCards = document.querySelectorAll('.order-card');
    
    orderCards.forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        
        if (status === 'all' || cardStatus === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function updateOrderStatus(orderId, newStatus) {
    if (!orderId || !newStatus) {
        showNotification('Ошибка: не указан ID заказа или статус', 'error');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const normalizedId = Number(String(orderId).replace('#', ''));
    const orderIndex = orders.findIndex(o => Number(o.id) === normalizedId);
    
    if (orderIndex === -1) {
        showNotification('Заказ не найден', 'error');
        return;
    }
    
    const previousStatus = orders[orderIndex].status;
    orders[orderIndex].status = newStatus;
    orders[orderIndex].managerUpdatedAt = new Date().toISOString();
    localStorage.setItem('orders', JSON.stringify(orders));

    if (newStatus === 'processing' && previousStatus !== 'processing') {
        pushUserNotification(orders[orderIndex].userId, `Менеджер принял ваш заказ #${orders[orderIndex].id}`, 'success');
    }
    
    showNotification('Статус заказа обновлен', 'success');
    loadAllOrders();
    loadStatistics(); // Refresh statistics
}

function openContactClientModal({ orderId, name, email, phone }) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 520px;">
            <span class="close">&times;</span>
            <h2 style="margin-bottom: 10px;">
                <i class="fas fa-headset"></i> Связаться с клиентом
            </h2>
            <p style="margin-bottom: 20px; color: #7f8c8d;">
                Заказ #${orderId}
            </p>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div style="padding: 14px; border-radius: 10px; background: #f8f9fa;">
                    <div style="font-size: 13px; color: #7f8c8d;">Клиент</div>
                    <div style="font-weight: 600; font-size: 16px;">${name}</div>
                </div>
                <div style="padding: 14px; border-radius: 10px; background: #e8f5e9;">
                    <div style="font-size: 13px; color: #388e3c;">Телефон</div>
                    ${phone ? `
                        <div style="display:flex; justify-content: space-between; align-items: center; margin-top:6px;">
                            <strong>${phone}</strong>
                            <a href="tel:${phone}" class="btn btn-primary" style="padding:8px 14px;">
                                <i class="fas fa-phone"></i> Позвонить
                            </a>
                        </div>
                    ` : '<div>Клиент не указал телефон</div>'}
                </div>
                <div style="padding: 14px; border-radius: 10px; background: #e3f2fd;">
                    <div style="font-size: 13px; color: #1976d2;">Email</div>
                    ${email ? `
                        <div style="display:flex; justify-content: space-between; align-items: center; margin-top:6px; flex-wrap:wrap; gap:10px;">
                            <strong>${email}</strong>
                            <a href="mailto:${email}?subject=По заказу%20%23${orderId}" class="btn btn-outline" style="padding:8px 14px;">
                                <i class="fas fa-envelope"></i> Написать письмо
                            </a>
                        </div>
                    ` : '<div>Клиент не указал email</div>'}
                </div>
                <div style="padding: 14px; border-radius: 10px; background: #fff3e0;">
                    <div style="font-size: 13px; color: #f57c00;">Быстрая заметка клиенту</div>
                    <textarea id="managerQuickMessage" style="width: 100%; margin-top: 8px; min-height: 90px; border-radius: 8px; border: 1px solid #ffd59f; padding: 8px;" placeholder="Например: 'Добрый день! Уточните, пожалуйста, данные по макету...'"></textarea>
                    <button class="btn btn-primary" id="copyQuickMessage" style="margin-top: 10px;">
                        <i class="fas fa-copy"></i> Скопировать текст
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    function closeModal() {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
    
    modal.querySelector('.close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    const copyBtn = modal.querySelector('#copyQuickMessage');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const textarea = modal.querySelector('#managerQuickMessage');
            if (!textarea || !textarea.value.trim()) {
                showNotification('Введите текст сообщения', 'warning');
                return;
            }
            navigator.clipboard.writeText(textarea.value.trim())
                .then(() => showNotification('Сообщение скопировано', 'success'))
                .catch(() => showNotification('Не удалось скопировать текст', 'error'));
        });
    }
}

function initializeUsersTab() {
    console.log('Initializing users tab...');
    
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
    
    loadAllUsers();
}

function loadAllUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const usersList = document.getElementById('usersList');
    
    if (!usersList) return;
    
    // Filter out admin and manager - only show clients
    const clients = users.filter(u => u.role !== 'admin' && u.role !== 'manager');
    
    if (clients.length === 0) {
        usersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Клиентов пока нет</h3>
                <p>Зарегистрированные клиенты будут отображаться здесь</p>
            </div>
        `;
        return;
    }
    
    // Get orders for each client
    const clientsWithOrders = clients.map(client => {
        const clientOrders = orders.filter(o => o.userId === client.email);
        const totalSpent = clientOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const lastOrder = clientOrders.length > 0 ? 
            clientOrders.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
        const lastAddress = lastOrder && lastOrder.delivery ? 
            `${lastOrder.delivery.city || ''}, ${lastOrder.delivery.street || ''}`.trim() : 
            'Адрес не указан';
        
        return {
            ...client,
            ordersCount: clientOrders.length,
            totalSpent: totalSpent,
            lastOrderDate: lastOrder ? new Date(lastOrder.date).toLocaleDateString('ru-RU') : 'Нет заказов',
            lastAddress: lastAddress
        };
    });
    
    usersList.innerHTML = clientsWithOrders.map(client => {
        return `
            <div class="user-card" style="border: 2px solid #f8f9fa; border-radius: 16px; padding: 25px; margin-bottom: 20px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease;" data-email="${client.email}" onclick="viewClientCabinet('${client.email}')" onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.15)'" onmouseout="this.style.borderColor='#f8f9fa'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'">
                <div style="display: flex; gap: 20px; align-items: flex-start;">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; flex-shrink: 0;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 20px;">
                            <strong>${client.name}</strong>
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                            <div style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                                <div style="color: #7f8c8d; font-size: 13px; margin-bottom: 5px;"><i class="fas fa-envelope"></i> Email:</div>
                                <div style="color: #2c3e50; font-weight: 600;">${client.email}</div>
                            </div>
                            <div style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                                <div style="color: #7f8c8d; font-size: 13px; margin-bottom: 5px;"><i class="fas fa-phone"></i> Телефон:</div>
                                <div style="color: #2c3e50; font-weight: 600;">${client.phone || 'Не указан'}</div>
                            </div>
                            <div style="padding: 12px; background: #e3f2fd; border-radius: 8px;">
                                <div style="color: #1976d2; font-size: 13px; margin-bottom: 5px;"><i class="fas fa-shopping-bag"></i> Заказов:</div>
                                <div style="color: #1976d2; font-weight: 700; font-size: 18px;">${client.ordersCount}</div>
                            </div>
                            <div style="padding: 12px; background: #e8f5e8; border-radius: 8px;">
                                <div style="color: #388e3c; font-size: 13px; margin-bottom: 5px;"><i class="fas fa-ruble-sign"></i> Всего потрачено:</div>
                                <div style="color: #388e3c; font-weight: 700; font-size: 18px;">${formatPrice(client.totalSpent)}</div>
                            </div>
                        </div>
                        ${client.lastAddress !== 'Адрес не указан' ? `
                            <div style="margin-top: 15px; padding: 12px; background: #fff3e0; border-radius: 8px; border-left: 3px solid #f57c00;">
                                <div style="color: #f57c00; font-size: 13px; margin-bottom: 5px;"><i class="fas fa-map-marker-alt"></i> Последний адрес доставки:</div>
                                <div style="color: #2c3e50; font-weight: 600;">${client.lastAddress}</div>
                            </div>
                        ` : ''}
                        ${client.ordersCount > 0 ? `
                            <div style="margin-top: 15px; padding: 12px; background: #f3e5f5; border-radius: 8px;">
                                <div style="color: #7b1fa2; font-size: 13px;"><i class="fas fa-calendar"></i> Последний заказ: ${client.lastOrderDate}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add delete handlers
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card click
            const userEmail = this.getAttribute('data-email');
            deleteUser(userEmail);
        });
    });
}

// View client cabinet function
function viewClientCabinet(clientEmail) {
    // Get client data
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const client = users.find(u => u.email === clientEmail);
    
    if (!client) {
        showNotification('Клиент не найден', 'error');
        return;
    }
    
    const clientOrders = orders.filter(o => o.userId === clientEmail);
    
    // Create modal with client cabinet view
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
            <span class="close">&times;</span>
            <h2 style="margin-bottom: 20px; color: #2c3e50;">
                <i class="fas fa-user"></i> Личный кабинет клиента
            </h2>
            
            <!-- Client Info -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 20px;">${client.name}</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <div style="color: #7f8c8d; font-size: 13px; margin-bottom: 5px;"><i class="fas fa-envelope"></i> Email:</div>
                        <div style="color: #2c3e50; font-weight: 600;">${client.email}</div>
                    </div>
                    <div>
                        <div style="color: #7f8c8d; font-size: 13px; margin-bottom: 5px;"><i class="fas fa-phone"></i> Телефон:</div>
                        <div style="color: #2c3e50; font-weight: 600;">${client.phone || 'Не указан'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Client Orders -->
            <div>
                <h3 style="margin-bottom: 20px; color: #2c3e50; font-size: 18px;">
                    <i class="fas fa-shopping-bag"></i> Заказы клиента (${clientOrders.length})
                </h3>
                ${clientOrders.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                        <i class="fas fa-shopping-bag" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                        <p>У клиента пока нет заказов</p>
                    </div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        ${clientOrders.map(order => `
                            <div class="order-card status-${order.status}" style="border: 2px solid #f8f9fa; border-radius: 12px; padding: 20px; background: white;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                    <div>
                                        <h4 style="margin: 0 0 8px 0; color: #2c3e50;">Заказ #${order.id}</h4>
                                        <div style="color: #7f8c8d; font-size: 14px;">
                                            <i class="fas fa-calendar"></i> ${new Date(order.date).toLocaleDateString('ru-RU')}
                                        </div>
                                    </div>
                                    <div class="order-status status-${order.status}" style="padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                        ${getOrderStatusText(order.status)}
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    ${order.items ? order.items.map(item => `
                                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f8f9fa;">
                                            <span>${item.name} (${item.params ? item.params.circulation : 0} шт.)</span>
                                            <span style="font-weight: 600;">${formatPrice(item.price * (item.quantity || 1))}</span>
                                        </div>
                                    `).join('') : ''}
                                    <div style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #f8f9fa; text-align: right; font-size: 18px; font-weight: 700; color: #667eea;">
                                        Итого: ${formatPrice(order.total)}
                                    </div>
                                </div>
                                ${order.delivery ? `
                                    <div style="padding: 12px; background: #fff3e0; border-radius: 8px; margin-bottom: 10px; font-size: 14px;">
                                        <strong><i class="fas fa-map-marker-alt"></i> Адрес доставки:</strong><br>
                                        ${order.delivery.city || ''}, ${order.delivery.street || ''} ${order.delivery.postcode ? `(${order.delivery.postcode})` : ''}
                                        ${order.delivery.method ? `<br><strong>Способ:</strong> ${order.delivery.method === 'courier' ? 'Курьером' : 'Самовывоз'}` : ''}
                                    </div>
                                ` : ''}
                                ${order.payment ? `
                                    <div style="padding: 12px; background: #e3f2fd; border-radius: 8px; font-size: 14px;">
                                        <strong><i class="fas fa-credit-card"></i> Способ оплаты:</strong> ${getPaymentMethodText(order.payment.method)}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #f8f9fa; text-align: right;">
                <button class="btn btn-outline" id="closeClientCabinet">
                    Закрыть
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Close handlers
    const closeBtn = modal.querySelector('.close');
    const closeClientBtn = modal.querySelector('#closeClientCabinet');
    
    function closeModal() {
        modal.remove();
        document.body.style.overflow = 'auto';
    }

    closeBtn.addEventListener('click', closeModal);
    if (closeClientBtn) closeClientBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Make function global
window.viewClientCabinet = viewClientCabinet;

function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const userCards = document.querySelectorAll('.user-card');
    
    userCards.forEach(card => {
        const userInfo = card.textContent.toLowerCase();
        if (userInfo.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function deleteUser(userEmail) {
    if (typeof showConfirmModal === 'function') {
        showConfirmModal(`Вы уверены, что хотите удалить пользователя ${userEmail}?`, 'Удаление пользователя').then(confirmed => {
            if (confirmed) {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const updatedUsers = users.filter(u => u.email !== userEmail);
                localStorage.setItem('users', JSON.stringify(updatedUsers));
                
                showNotification('Пользователь удален', 'success');
                loadAllUsers();
                loadStatistics();
            }
        });
    }
}

function initializeCalculationsTab() {
    console.log('Initializing calculations tab...');
    
    const calculationSearch = document.getElementById('calculationSearch');
    if (calculationSearch) {
        calculationSearch.addEventListener('input', filterCalculations);
    }
    
    loadAllCalculations();
}

function loadAllCalculations() {
    const calculations = JSON.parse(localStorage.getItem('calculations')) || [];
    const calculationsList = document.getElementById('adminCalculationsList');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (!calculationsList) return;
    
    if (calculations.length === 0) {
        calculationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calculator"></i>
                <h3>Расчетов пока нет</h3>
                <p>Сохраненные расчеты будут отображаться здесь</p>
            </div>
        `;
        return;
    }
    
    calculationsList.innerHTML = calculations.map(calc => {
        const owner = calc.userId ? users.find(u => u.email === calc.userId) : null;
        const ownerName = owner ? owner.name : 'Не указан';
        const ownerEmail = calc.userId || '—';
        return `
        <div class="calculation-item" data-name="${calc.name}">
            <div class="calc-info">
                <h4>${calc.name}</h4>
                <p>Тираж: ${calc.circulation} шт. | Бумага: ${calc.paperType} ${calc.paperWeight}г/м²</p>
                <p style="color:#7f8c8d; font-size:13px;">
                    <i class="fas fa-user"></i> ${ownerName} (${ownerEmail})
                </p>
                <span class="calc-date">
                    <i class="fas fa-clock"></i>${calc.date}
                </span>
            </div>
            <div class="calc-price">${formatPrice(calc.price)}</div>
        </div>
        `;
    }).join('');
}

function filterCalculations() {
    const searchTerm = document.getElementById('calculationSearch').value.toLowerCase();
    const calcItems = document.querySelectorAll('.calculation-item');
    
    calcItems.forEach(item => {
        const calcName = item.getAttribute('data-name').toLowerCase();
        if (calcName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function initializeSettingsTab() {
    console.log('Initializing settings tab...');
    
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    const clearBtn = document.getElementById('clearDataBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearData);
    }
    
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleAdminLogout);
    }
}

function exportData() {
    const data = {
        users: JSON.parse(localStorage.getItem('users')) || [],
        orders: JSON.parse(localStorage.getItem('orders')) || [],
        calculations: JSON.parse(localStorage.getItem('calculations')) || [],
        cart: JSON.parse(localStorage.getItem('cart')) || []
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'printhub_data_' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    
    showNotification('Данные экспортированы', 'success');
}

function clearData() {
    if (typeof showConfirmModal === 'function') {
        showConfirmModal(
            'ВНИМАНИЕ! Вы уверены, что хотите очистить все данные (кроме администратора)? Это действие нельзя отменить.',
            'Очистка данных'
        ).then(confirmed => {
            if (confirmed) {
                showConfirmModal('Это последнее предупреждение. Очистить все данные?', 'Подтверждение очистки').then(finalConfirmed => {
                    if (finalConfirmed) {
                        // Keep admin user
                        const users = JSON.parse(localStorage.getItem('users')) || [];
                        const adminUser = users.find(u => u.email === 'admin@printhub.ru');
                        
                        // Clear all data
                        localStorage.setItem('users', JSON.stringify(adminUser ? [adminUser] : []));
                        localStorage.setItem('orders', JSON.stringify([]));
                        localStorage.setItem('calculations', JSON.stringify([]));
                        localStorage.setItem('cart', JSON.stringify([]));
                        
                        showNotification('Данные очищены', 'success');
                        
                        // Reload all tabs
                        loadStatistics();
                        loadAllOrders();
                        loadAllUsers();
                        loadAllCalculations();
                    }
                });
            }
        });
    }
}

function handleAdminLogout() {
    if (typeof showConfirmModal === 'function') {
        showConfirmModal('Выйти из панели администратора?', 'Выход').then(confirmed => {
            if (confirmed) {
                if (typeof clearStoredCurrentUser === 'function') {
                    clearStoredCurrentUser();
                } else {
                    localStorage.removeItem('currentUser');
                }
                window.location.href = 'index.html';
            }
        });
    }
}

function pushUserNotification(userId, message, type = 'info') {
    if (!userId) return;

    const notifications = JSON.parse(localStorage.getItem('userNotifications')) || {};
    const userNotifications = notifications[userId] || [];

    userNotifications.push({
        id: Date.now(),
        message,
        type,
        read: false,
        date: new Date().toISOString()
    });

    notifications[userId] = userNotifications;
    localStorage.setItem('userNotifications', JSON.stringify(notifications));
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

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
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

function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else if (typeof showAlertModal === 'function') {
        // Use modal as fallback
        showAlertModal(message, 'Уведомление', type);
    }
}

