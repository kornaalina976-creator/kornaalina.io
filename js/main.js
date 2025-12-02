// Main application functionality
document.addEventListener('DOMContentLoaded', function () {
    console.log('Инициализация главного скрипта...');

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function () {
            nav.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function (e) {
            nav.classList.remove('active');
            
            // Check authentication for personal cabinet and cart
            const href = this.getAttribute('href');
            if (href && (href.includes('personal.html') || href.includes('cart.html'))) {
                const user = JSON.parse(localStorage.getItem('currentUser'));
                if (!user) {
                    e.preventDefault();
                    const loginModal = document.getElementById('loginModal');
                    if (loginModal) {
                        loginModal.style.display = 'block';
                    }
                }
            }
        });
    });

    // Check authentication for cart icon
    const cartIcons = document.querySelectorAll('.cart-icon');
    cartIcons.forEach(icon => {
        icon.addEventListener('click', function (e) {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            if (!user) {
                e.preventDefault();
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.style.display = 'block';
                }
            }
        });
    });

    // Check authentication status and update UI
    updateAuthUI();

    // Cart functionality
    updateCartCount();

    // Notification system
    initializeNotifications();

    // Initialize all modules based on current page
    initializePageModules();

    console.log('Главный скрипт инициализирован');
});

// Update authentication UI
function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.getElementById('userMenu');

    if (user && authButtons) {
        authButtons.style.display = 'none';

        if (userMenu) {
            userMenu.style.display = 'block';
        }
    } else if (authButtons) {
        authButtons.style.display = 'flex';
        if (userMenu) {
            userMenu.style.display = 'none';
        }
    }
}

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
        element.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// Initialize notifications
function initializeNotifications() {
    // Notification system is already defined in the function below
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 3000;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid #3498db;
                max-width: 350px;
            }
            .notification-success {
                border-left-color: #2ecc71;
            }
            .notification-warning {
                border-left-color: #f39c12;
            }
            .notification-error {
                border-left-color: #e74c3c;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'warning': return 'exclamation-triangle';
        case 'error': return 'exclamation-circle';
        default: return 'info-circle';
    }
}

// Modal confirmation dialog (replaces confirm)
function showConfirmModal(message, title = 'Подтверждение') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <span class="close">&times;</span>
                <h2 style="margin-bottom: 20px; color: #2c3e50;">
                    <i class="fas fa-question-circle"></i> ${title}
                </h2>
                <p style="margin-bottom: 25px; font-size: 16px; line-height: 1.6; color: #555;">
                    ${message}
                </p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn btn-outline" id="modalCancel">
                        Отмена
                    </button>
                    <button class="btn btn-primary" id="modalConfirm">
                        <i class="fas fa-check"></i> Подтвердить
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const closeModal = (result) => {
            modal.remove();
            document.body.style.overflow = 'auto';
            resolve(result);
        };

        modal.querySelector('.close').addEventListener('click', () => closeModal(false));
        modal.querySelector('#modalCancel').addEventListener('click', () => closeModal(false));
        modal.querySelector('#modalConfirm').addEventListener('click', () => closeModal(true));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(false);
        });
    });
}

// Modal alert dialog (replaces alert)
function showAlertModal(message, title = 'Уведомление', type = 'info') {
    return new Promise((resolve) => {
        const icons = {
            'info': 'fa-info-circle',
            'warning': 'fa-exclamation-triangle',
            'error': 'fa-exclamation-circle',
            'success': 'fa-check-circle'
        };
        const colors = {
            'info': '#3498db',
            'warning': '#f39c12',
            'error': '#e74c3c',
            'success': '#2ecc71'
        };

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <span class="close">&times;</span>
                <h2 style="margin-bottom: 20px; color: ${colors[type] || colors.info};">
                    <i class="fas ${icons[type] || icons.info}"></i> ${title}
                </h2>
                <div style="margin-bottom: 25px; font-size: 16px; line-height: 1.6; color: #555;">
                    ${message}
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button class="btn btn-primary" id="modalOk">
                        <i class="fas fa-check"></i> Понятно
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = 'auto';
            resolve();
        };

        modal.querySelector('.close').addEventListener('click', closeModal);
        modal.querySelector('#modalOk').addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    });
}

// Make functions global
window.showConfirmModal = showConfirmModal;
window.showAlertModal = showAlertModal;

// Initialize page-specific modules
function initializePageModules() {
    const currentPage = window.location.pathname;

    console.log('Инициализация модулей для страницы:', currentPage);

    if (currentPage.includes('catalog.html') && typeof initCatalog === 'function') {
        initCatalog();
    }

    if (currentPage.includes('calculator.html') && typeof initCalculator === 'function') {
        initCalculator();
    }

    if (currentPage.includes('personal.html') && typeof initPersonal === 'function') {
        initPersonal();
    }

    if (currentPage.includes('cart.html') && typeof initCart === 'function') {
        initCart();
    }

    // Auth module should be initialized on all pages
    if (typeof initAuth === 'function') {
        initAuth();
    }
}

// Utility function to format prices
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// Utility function to get product icon
function getProductIcon(type) {
    const icons = {
        'visiting-card': 'id-card',
        'flyer': 'file-alt',
        'booklet': 'book',
        'poster': 'image',
        'form': 'file-contract',
        'envelope': 'envelope',
        'calendar': 'calendar',
        'badge': 'id-badge'
    };
    return icons[type] || 'box';
}