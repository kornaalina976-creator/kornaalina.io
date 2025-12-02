// Authentication functionality - COMPLETELY REWRITTEN
rehydrateCurrentUser();

const MANAGER_ROLES = ['manager', 'admin'];

document.addEventListener('DOMContentLoaded', function () {
    console.log('=== AUTH INITIALIZATION STARTED ===');
    initializeAuth();
});

function initializeAuth() {
    console.log('Initializing authentication system...');

    // Initialize demo user
    initDemoUser();

    // Setup modal functionality
    setupModals();

    // Setup form handlers
    setupForms();

    // Check current auth status
    checkAuthStatus();

    console.log('Authentication system initialized');
}

function initDemoUser() {
    const demoUsers = [
        {
            name: "Иван Иванов",
            email: "demo@example.com",
            phone: "+79991234567",
            password: "demo1234"
        },
        {
            name: "Клиент",
            email: "guest",
            phone: "guest",
            password: "guest123",
            role: "client"
        },
        {
            name: "Менеджер",
            email: "manager",
            phone: "manager",
            password: "manager123",
            role: "manager"
        }
    ];
    
    // Always ensure demo users exist
    let existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    
    // Add or update demo users
    demoUsers.forEach(demoUser => {
        const existingIndex = existingUsers.findIndex(u => 
            u.email === demoUser.email
        );
        if (existingIndex >= 0) {
            // Update existing user
            existingUsers[existingIndex] = demoUser;
        } else {
            // Add new user
            existingUsers.push(demoUser);
        }
    });
    
    localStorage.setItem('users', JSON.stringify(existingUsers));
    console.log('Demo users ensured');
}

function setupModals() {
    console.log('Setting up modals...');

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openModal('loginModal');
        });
    }

    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openModal('registerModal');
        });
    }

    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function () {
            closeAllModals();
        });
    });

    // Close on outside click
    window.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Switch between login/register
    const switchToRegister = document.getElementById('switchToRegister');
    if (switchToRegister) {
        switchToRegister.addEventListener('click', function (e) {
            e.preventDefault();
            switchModal('loginModal', 'registerModal');
        });
    }

    const switchToLogin = document.getElementById('switchToLogin');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function (e) {
            e.preventDefault();
            switchModal('registerModal', 'loginModal');
        });
    }

    // Forgot password - use event delegation
    document.addEventListener('click', function (e) {
        if (e.target && (e.target.classList.contains('forgot-password') || e.target.closest('.forgot-password'))) {
            e.preventDefault();
            showForgotPassword();
        }
    });
    
    // Also set up for existing links
    const forgotPassword = document.querySelector('.forgot-password');
    if (forgotPassword) {
        forgotPassword.addEventListener('click', function (e) {
            e.preventDefault();
            showForgotPassword();
        });
    }
}

function setupForms() {
    console.log('Setting up forms...');

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleLogin();
        });
    }

    // Register form - use event delegation for dynamic forms
    document.addEventListener('submit', function (e) {
        if (e.target && e.target.id === 'registerForm') {
            e.preventDefault();
            handleRegister();
        }
    });
    
    // Also set up for existing form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleRegister();
        });
    }

    // Password toggle functionality
    setupPasswordToggles();
    
    // Load saved credentials
    loadSavedCredentials();
    
    // Add real-time password validation
    setupPasswordValidation();
}

function openModal(modalId) {
    console.log('Opening modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        clearAllErrors();
        
        // Load saved credentials and setup password toggle when opening login modal
        if (modalId === 'loginModal') {
            loadSavedCredentials();
            setupPasswordToggles();
        } else if (modalId === 'registerModal') {
            // Setup password toggles for registration form
            setupPasswordToggles();
        }
    }
}

function closeAllModals() {
    console.log('Closing all modals');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
    clearAllErrors();
}

function switchModal(fromId, toId) {
    const fromModal = document.getElementById(fromId);
    const toModal = document.getElementById(toId);

    if (fromModal && toModal) {
        fromModal.style.display = 'none';
        toModal.style.display = 'block';
        clearAllErrors();
        
        // Setup password toggle when switching modals
        if (toId === 'loginModal') {
            loadSavedCredentials();
            setupPasswordToggles();
        } else if (toId === 'registerModal') {
            setupPasswordToggles();
        }
    }
}

function handleLogin() {
    console.log('Handling login...');

    const email = document.getElementById('loginEmail');
    const password = document.getElementById('loginPassword');

    if (!email || !password) {
        console.error('Login form elements not found');
        return;
    }

    // Clear previous errors
    clearAllErrors();

    // Validate
    let isValid = true;

    if (!email.value.trim()) {
        showError(email, 'Введите email или телефон');
        isValid = false;
    }

    if (!password.value) {
        showError(password, 'Введите пароль');
        isValid = false;
    } else {
        const passwordValidation = validatePassword(password.value);
        if (!passwordValidation.valid) {
            showError(password, passwordValidation.message);
            isValid = false;
        }
    }

    if (!isValid) return;

    // Show loading
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Вход...';
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        // Ensure demo users exist
        initDemoUser();
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const emailValue = email.value.trim().toLowerCase();
        const passwordValue = password.value;
        
        console.log('Login attempt:', emailValue, passwordValue);
        console.log('Available users:', users.map(u => ({ email: u.email, name: u.name })));
        
        const user = users.find(u => {
            const uEmail = (u.email || '').toLowerCase();
            const uPhone = (u.phone || '').toLowerCase();
            const uPassword = u.password || '';
            
            return (uEmail === emailValue || uPhone === emailValue) && uPassword === passwordValue;
        });

        if (user) {
            console.log('Login successful:', user.email);

            // Save current user
            persistCurrentUser({
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role || 'client'
            });

            // Always ask about saving password if not already saved
            const rememberMe = document.getElementById('rememberMe');
            const hasSavedPassword = localStorage.getItem('rememberMe') === 'true';
            
            const handlePasswordSave = async () => {
                if (!hasSavedPassword) {
                    if (typeof showConfirmModal === 'function') {
                        const shouldSave = await showConfirmModal('Сохранить пароль для быстрого входа?', 'Сохранение пароля');
                        if (shouldSave) {
                            localStorage.setItem('savedEmail', email.value);
                            localStorage.setItem('savedPassword', password.value);
                            localStorage.setItem('rememberMe', 'true');
                            if (rememberMe) rememberMe.checked = true;
                        } else {
                            localStorage.removeItem('savedEmail');
                            localStorage.removeItem('savedPassword');
                            localStorage.removeItem('rememberMe');
                            if (rememberMe) rememberMe.checked = false;
                        }
                    }
                } else if (rememberMe && rememberMe.checked) {
                    // Update saved credentials if checkbox is checked
                    localStorage.setItem('savedEmail', email.value);
                    localStorage.setItem('savedPassword', password.value);
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    // Clear saved credentials if checkbox is unchecked
                    localStorage.removeItem('savedEmail');
                    localStorage.removeItem('savedPassword');
                    localStorage.removeItem('rememberMe');
                }

                // Close modal and update UI
                closeAllModals();
                updateUIAfterAuth(user);

                showNotification('Вы успешно вошли в систему!', 'success');
            };
            
            handlePasswordSave();

        } else {
            console.log('Login failed: invalid credentials');
            showError(email, 'Такого аккаунта не нашли. Зарегистрируйтесь');
            showError(password, 'Такого аккаунта не нашли. Зарегистрируйтесь');
        }

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

    }, 1000);
}

function handleRegister() {
    console.log('Handling registration...');

    const name = document.getElementById('registerName');
    const email = document.getElementById('registerEmail');
    const phone = document.getElementById('registerPhone');
    const password = document.getElementById('registerPassword');
    const confirm = document.getElementById('registerConfirm');

    if (!name || !email || !phone || !password || !confirm) {
        console.error('Register form elements not found');
        return;
    }

    // Clear previous errors
    clearAllErrors();

    // Validate
    let isValid = true;

    // Name validation
    if (!name.value.trim()) {
        showError(name, 'Введите ФИО');
        isValid = false;
    }

    // Email validation
    if (!email.value.trim()) {
        showError(email, 'Введите email');
        isValid = false;
    } else if (!isValidEmail(email.value)) {
        showError(email, 'Введите корректный email');
        isValid = false;
    }

    // Phone validation
    if (!phone.value.trim()) {
        showError(phone, 'Введите телефон');
        isValid = false;
    } else if (!isValidPhone(phone.value)) {
        showError(phone, 'Введите корректный номер телефона');
        isValid = false;
    }

    // Password validation
    if (!password.value) {
        showError(password, 'Введите пароль');
        isValid = false;
    } else {
        const passwordValidation = validatePassword(password.value);
        if (!passwordValidation.valid) {
            showError(password, passwordValidation.message);
            isValid = false;
        }
    }
    
    // Confirm password validation
    if (!confirm.value) {
        showError(confirm, 'Подтвердите пароль');
        isValid = false;
    } else if (password.value && confirm.value && password.value !== confirm.value) {
        showError(confirm, 'Пароли не совпадают');
        isValid = false;
    }

    // Confirm password
    if (!confirm.value) {
        showError(confirm, 'Подтвердите пароль');
        isValid = false;
    } else if (password.value !== confirm.value) {
        showError(confirm, 'Пароли не совпадают');
        isValid = false;
    }

    // Check if user already exists
    if (isValid) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const existingUser = users.find(u => u.email === email.value);
        if (existingUser) {
            showError(email, 'Пользователь с таким email уже существует');
            isValid = false;
        }
    }

    if (!isValid) return;

    // Show loading
    const submitBtn = document.querySelector('#registerForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Регистрация...';
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
        const newUser = {
            name: name.value.trim(),
            email: email.value.trim(),
            phone: phone.value.trim(),
            password: password.value
        };

        // Save user
        const users = JSON.parse(localStorage.getItem('users')) || [];
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Ask about saving password and complete registration
        const completeRegistration = async () => {
            if (typeof showConfirmModal === 'function') {
                const shouldSavePassword = await showConfirmModal('Сохранить пароль для быстрого входа?', 'Сохранение пароля');
                if (shouldSavePassword) {
                    localStorage.setItem('savedEmail', email.value);
                    localStorage.setItem('savedPassword', password.value);
                    localStorage.setItem('rememberMe', 'true');
                }
            }

            // Auto-login
            persistCurrentUser({
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone
            });

            console.log('Registration successful:', newUser.email);

            // Close modal and update UI
            closeAllModals();
            updateUIAfterAuth(newUser);

            showNotification('Регистрация прошла успешно! Добро пожаловать!', 'success');
        };
        
        completeRegistration();

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

    }, 1000);
}

function showForgotPassword() {
    console.log('Showing forgot password modal');

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Восстановление пароля</h2>
            <form id="forgotPasswordForm">
                <div class="form-group">
                    <label>Введите ваш email</label>
                    <input type="email" id="forgotEmail" required>
                    <div class="error-message"></div>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Восстановить пароль</button>
            </form>
            <div class="auth-switch">
                <p>Вспомнили пароль? <a href="#" class="show-login">Войти</a></p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Close handlers
    modal.querySelector('.close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Show login
    modal.querySelector('.show-login').addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        openModal('loginModal');
    });

    // Form submission
    modal.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = modal.querySelector('#forgotEmail');
        const email = emailInput.value.trim().toLowerCase();

        if (!isValidEmail(email)) {
            showError(emailInput, 'Введите корректный email');
            return;
        }

        // Find user by email
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email.toLowerCase() === email);

        if (!user) {
            showError(emailInput, 'Пользователь с таким email не найден');
            return;
        }

        // Show password reset options
        if (typeof showConfirmModal === 'function') {
            const resetOption = await showConfirmModal(
                `Пользователь найден: ${user.name || user.email}<br><br>Выберите действие:`,
                'Восстановление пароля'
            );
            
            if (resetOption) {
                // Show password reset modal
                modal.remove();
                showPasswordResetModal(user.email);
            } else {
                // Just show notification
                showNotification('Для восстановления пароля обратитесь к администратору', 'info');
                modal.remove();
            }
        } else {
            // Fallback - show password reset directly
            modal.remove();
            showPasswordResetModal(user.email);
        }
    });
}

function showPasswordResetModal(userEmail) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Сброс пароля</h2>
            <form id="resetPasswordForm">
                <div class="form-group">
                    <label>Новый пароль</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="resetNewPassword" required minlength="8">
                        <i class="fas fa-eye password-toggle" id="toggleResetPassword"></i>
                    </div>
                </div>
                <div class="form-group">
                    <label>Подтвердите новый пароль</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="resetConfirmPassword" required minlength="8">
                        <i class="fas fa-eye password-toggle" id="toggleResetConfirmPassword"></i>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Установить новый пароль</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Setup password toggles
    if (typeof setupPasswordToggles === 'function') {
        setupPasswordToggles(['resetNewPassword', 'resetConfirmPassword']);
    } else {
        // Manual toggle setup
        const toggle1 = modal.querySelector('#toggleResetPassword');
        const input1 = modal.querySelector('#resetNewPassword');
        const toggle2 = modal.querySelector('#toggleResetConfirmPassword');
        const input2 = modal.querySelector('#resetConfirmPassword');
        
        if (toggle1 && input1) {
            toggle1.addEventListener('click', () => {
                const type = input1.getAttribute('type') === 'password' ? 'text' : 'password';
                input1.setAttribute('type', type);
                toggle1.classList.toggle('fa-eye');
                toggle1.classList.toggle('fa-eye-slash');
            });
        }
        
        if (toggle2 && input2) {
            toggle2.addEventListener('click', () => {
                const type = input2.getAttribute('type') === 'password' ? 'text' : 'password';
                input2.setAttribute('type', type);
                toggle2.classList.toggle('fa-eye');
                toggle2.classList.toggle('fa-eye-slash');
            });
        }
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
    modal.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newPassword = modal.querySelector('#resetNewPassword').value;
        const confirmPassword = modal.querySelector('#resetConfirmPassword').value;

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            showNotification(passwordValidation.message, 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }

        // Update password
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.email.toLowerCase() === userEmail.toLowerCase());

        if (userIndex === -1) {
            showNotification('Пользователь не найден', 'error');
            closeModal();
            return;
        }

        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));

        // Update saved password if exists
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail && savedEmail.toLowerCase() === userEmail.toLowerCase()) {
            localStorage.setItem('savedPassword', newPassword);
        }

        showNotification('Пароль успешно изменен! Теперь вы можете войти с новым паролем.', 'success');
        closeModal();
        
        // Show login modal
        setTimeout(() => {
            if (typeof openModal === 'function') {
                openModal('loginModal');
            }
        }, 1000);
    });
}

function updateUIAfterAuth(user) {
    console.log('Updating UI after auth for user:', user.name);

    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.getElementById('userMenu');
    const isManager = user && MANAGER_ROLES.includes(user.role);

    if (authButtons) {
        authButtons.style.display = 'none';
    }

    if (userMenu) {
        const mainLink = isManager
            ? `<a href="admin.html"><i class="fas fa-user-shield"></i> Панель менеджера</a>`
            : `<a href="personal.html"><i class="fas fa-user-circle"></i> Личный кабинет</a>`;

        userMenu.innerHTML = `
            <div class="user-dropdown">
                <button class="btn btn-outline">
                    <i class="fas fa-user"></i> ${user.name.split(' ')[0]}
                </button>
                <div class="dropdown-menu">
                    ${mainLink}
                    <a href="#" class="logout-link"><i class="fas fa-sign-out-alt"></i> Выйти</a>
                </div>
            </div>
        `;
        userMenu.style.display = 'block';

        // Logout handler - use event delegation
        const logoutLink = userMenu.querySelector('.logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showLogoutConfirmation();
            });
        }
    }

    // Update cart count
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }

    applyManagerExperience(user);
}

function applyManagerExperience(user) {
    const isManager = user && MANAGER_ROLES.includes(user.role);
    updateNavigationForManager(isManager);

    if (isManager) {
        const onAdminPage = window.location.pathname.includes('admin.html');
        if (!onAdminPage) {
            window.location.href = 'admin.html';
        }
    }
}

function updateNavigationForManager(isManager) {
    const navItems = document.querySelectorAll('nav li');
    navItems.forEach(item => {
        if (!item) return;
        if (!item.dataset.originalDisplay) {
            item.dataset.originalDisplay = item.style.display || '';
        }
        const link = item.querySelector('a');
        const isAdminLink = link && link.getAttribute('href') === 'admin.html';
        if (isManager) {
            item.style.display = isAdminLink ? item.dataset.originalDisplay : 'none';
        } else {
            item.style.display = item.dataset.originalDisplay;
        }
    });

    const cartIcons = document.querySelectorAll('.cart-icon');
    cartIcons.forEach(icon => {
        if (!icon.dataset.originalDisplay) {
            icon.dataset.originalDisplay = icon.style.display || '';
        }
        icon.style.display = isManager ? 'none' : icon.dataset.originalDisplay;
    });
}

function showLogoutConfirmation() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <span class="close">&times;</span>
            <h2 style="margin-bottom: 20px;">
                <i class="fas fa-sign-out-alt"></i> Выход из системы
            </h2>
            <p style="margin-bottom: 25px; font-size: 16px;">
                Вы уверены, что хотите выйти?
            </p>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-outline" id="cancelLogout">
                    Отмена
                </button>
                <button class="btn btn-primary" id="confirmLogout">
                    <i class="fas fa-sign-out-alt"></i> Выйти
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Close handlers
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = modal.querySelector('#cancelLogout');
    
    function closeModal() {
        modal.remove();
        document.body.style.overflow = 'auto';
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Confirm logout
    modal.querySelector('#confirmLogout').addEventListener('click', function() {
        handleLogout();
        closeModal();
    });
}

function handleLogout() {
    console.log('Logging out...');
    clearStoredCurrentUser();
    updateNavigationForManager(false);
    showNotification('Вы вышли из системы', 'info');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 800);
}

function checkAuthStatus() {
    const user = getStoredCurrentUser();
    if (user) {
        console.log('User is logged in:', user.name);
        updateUIAfterAuth(user);
    } else {
        console.log('No user logged in');
        updateNavigationForManager(false);
    }
}

// Utility functions
function showError(input, message) {
    if (!input) return;

    input.classList.add('error');
    
    // Try to find error message element - check parent and parent's parent
    let errorElement = input.parentNode.querySelector('.error-message');
    
    // If not found in direct parent, check parent's parent (for password-input-wrapper case)
    if (!errorElement && input.parentNode && input.parentNode.parentNode) {
        errorElement = input.parentNode.parentNode.querySelector('.error-message');
    }
    
    // If still not found, try to find in form-group
    if (!errorElement) {
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            errorElement = formGroup.querySelector('.error-message');
        }
    }
    
    // If error element doesn't exist, create it
    if (!errorElement) {
        const formGroup = input.closest('.form-group') || input.parentNode;
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearError(input) {
    if (!input) return;

    input.classList.remove('error');
    const errorElement = input.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function clearAllErrors() {
    document.querySelectorAll('input').forEach(input => {
        clearError(input);
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    if (!password) {
        return { valid: false, message: 'Введите пароль' };
    }
    
    if (password.length < 8) {
        return { valid: false, message: 'Пароль должен содержать не менее 8 символов' };
    }
    
    // Check if password contains only digits
    if (/^\d+$/.test(password)) {
        return { valid: false, message: 'Пароль не может состоять только из цифр' };
    }
    
    return { valid: true, message: '' };
}

// Make function global
window.validatePassword = validatePassword;

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto remove
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Password toggle functionality
// Load saved credentials
function loadSavedCredentials() {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    const rememberMe = localStorage.getItem('rememberMe');
    
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    if (rememberMe === 'true' && savedEmail && savedPassword) {
        if (emailInput) emailInput.value = savedEmail;
        if (passwordInput) passwordInput.value = savedPassword;
        if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
    }
}

const DEFAULT_PASSWORD_FIELDS = ['loginPassword', 'registerPassword', 'registerConfirm'];

function setupPasswordToggles(extraFieldIds = []) {
    const fieldIds = Array.from(new Set([...DEFAULT_PASSWORD_FIELDS, ...(extraFieldIds || [])]));

    fieldIds.forEach(id => {
        const input = document.getElementById(id);
        ensurePasswordToggle(input);
    });
}

function ensurePasswordToggle(input) {
    if (!input) return;

    if (!input.id) {
        input.id = `password-field-${Date.now()}`;
    }

    let wrapper = input.closest('.password-input-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'password-input-wrapper';
        if (input.parentNode) {
            input.parentNode.insertBefore(wrapper, input);
        }
        wrapper.appendChild(input);
    }

    let toggle = wrapper.querySelector(`.password-toggle[data-target="${input.id}"]`) || wrapper.querySelector('.password-toggle');
    if (!toggle) {
        toggle = document.createElement('i');
        toggle.className = 'fas fa-eye password-toggle';
        wrapper.appendChild(toggle);
    }

    toggle.setAttribute('data-target', input.id);
    toggle.classList.remove('fa-eye-slash');
    toggle.classList.add('fa-eye');

    if (toggle.dataset.toggleInit === 'true') {
        return;
    }

    toggle.dataset.toggleInit = 'true';
    toggle.addEventListener('click', function () {
        togglePasswordVisibility(input, toggle);
    });
}

function togglePasswordVisibility(input, toggle) {
    if (!input || !toggle) return;

    const showText = input.getAttribute('type') === 'password';
    input.setAttribute('type', showText ? 'text' : 'password');

    if (showText) {
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
}

function setupPasswordValidation() {
    // Add real-time validation for password fields
    document.addEventListener('input', function(e) {
        if (e.target && (e.target.id === 'registerPassword' || e.target.id === 'newPassword' || e.target.id === 'resetNewPassword')) {
            const input = e.target;
            const value = input.value;
            
            // Clear previous error if validation passes
            if (value && typeof validatePassword === 'function') {
                const validation = validatePassword(value);
                if (validation.valid) {
                    clearError(input);
                } else {
                    showError(input, validation.message);
                }
            } else if (!value) {
                clearError(input);
            }
        }
    });
    
    // Also validate on blur
    document.addEventListener('blur', function(e) {
        if (e.target && (e.target.id === 'registerPassword' || e.target.id === 'newPassword' || e.target.id === 'resetNewPassword') && e.target.value) {
            const input = e.target;
            if (typeof validatePassword === 'function') {
                const validation = validatePassword(input.value);
                if (!validation.valid) {
                    showError(input, validation.message);
                } else {
                    clearError(input);
                }
            }
        }
    }, true);
}

function persistCurrentUser(user) {
    if (!user) return;
    try {
        const payload = JSON.stringify(user);
        localStorage.setItem('currentUser', payload);
        sessionStorage.setItem('currentUser', payload);
    } catch (error) {
        console.error('Не удалось сохранить пользователя', error);
    }
}

function clearStoredCurrentUser() {
    try {
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
    } catch (error) {
        console.error('Не удалось очистить данные пользователя', error);
    }
}

function getStoredCurrentUser() {
    try {
        let payload = localStorage.getItem('currentUser');
        if (!payload) {
            payload = sessionStorage.getItem('currentUser');
            if (payload) {
                localStorage.setItem('currentUser', payload);
            }
        }
        return payload ? JSON.parse(payload) : null;
    } catch (error) {
        console.error('Не удалось восстановить пользователя', error);
        return null;
    }
}

function rehydrateCurrentUser() {
    getStoredCurrentUser();
}

window.persistCurrentUser = persistCurrentUser;
window.clearStoredCurrentUser = clearStoredCurrentUser;
window.getStoredCurrentUser = getStoredCurrentUser;