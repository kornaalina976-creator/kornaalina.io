// Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация корзины...');
    
    // Check if we're on checkout page
    if (document.getElementById('checkoutForm')) {
        initCheckout();
    } else {
        initCart();
    }
});

function initCheckout() {
    console.log('Инициализация оформления заказа...');
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsSection = document.getElementById('cartItemsSection');
    const checkoutLayout = document.getElementById('checkoutLayout');
    const proceedToCheckoutBtn = document.getElementById('proceedToCheckout');

    // Show cart items first if cart is not empty
    if (cart.length > 0 && cartItemsSection && !localStorage.getItem('showCheckout')) {
        cartItemsSection.style.display = 'block';
        if (checkoutLayout) checkoutLayout.style.display = 'none';
        loadCartItemsForCheckout();
        
        // Proceed to checkout button
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (cartItemsSection) cartItemsSection.style.display = 'none';
                if (checkoutLayout) checkoutLayout.style.display = 'grid';
                localStorage.setItem('showCheckout', 'true');
                
                // Load checkout form data
                loadCheckoutItems();
                loadUserData();
                loadUploadedImages();
                setupAddressPreview();
                
                const checkoutForm = document.getElementById('checkoutForm');
                if (checkoutForm) {
                    checkoutForm.addEventListener('submit', handleCheckout);
                }
                
                document.querySelectorAll('input[name="deliveryMethod"]').forEach(radio => {
                    radio.addEventListener('change', updateDeliveryPrice);
                });
            });
        }
        
        // Back to cart button
        const backToCartBtn = document.getElementById('backToCartBtn');
        if (backToCartBtn) {
            backToCartBtn.addEventListener('click', function() {
                if (cartItemsSection) cartItemsSection.style.display = 'block';
                if (checkoutLayout) checkoutLayout.style.display = 'none';
                localStorage.removeItem('showCheckout');
                loadCartItemsForCheckout();
            });
        }
    } else {
        // Show checkout form directly
        if (cartItemsSection) cartItemsSection.style.display = 'none';
        if (checkoutLayout) checkoutLayout.style.display = 'grid';
        
        // Load cart items for summary
        loadCheckoutItems();
        
        // Load user data
        loadUserData();
        
        // Load uploaded images
        loadUploadedImages();
        
        // Address preview
        setupAddressPreview();
        
        // Form submission
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleCheckout);
        }
        
        // Delivery method change
        document.querySelectorAll('input[name="deliveryMethod"]').forEach(radio => {
            radio.addEventListener('change', updateDeliveryPrice);
        });
        
        // Back to cart button
        const backToCartBtn = document.getElementById('backToCartBtn');
        if (backToCartBtn) {
            backToCartBtn.addEventListener('click', function() {
                const cartItemsSection = document.getElementById('cartItemsSection');
                const checkoutLayout = document.getElementById('checkoutLayout');
                if (cartItemsSection) cartItemsSection.style.display = 'block';
                if (checkoutLayout) checkoutLayout.style.display = 'none';
                localStorage.removeItem('showCheckout');
                loadCartItemsForCheckout();
            });
        }
    }
}

function loadCartItemsForCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsList = document.getElementById('cartItemsList');
    
    if (!cartItemsList) return;
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<p style="text-align: center; color: #999;">Корзина пуста</p>';
        return;
    }
    
    cartItemsList.innerHTML = cart.map(item => `
        <div class="cart-item" style="display: flex; align-items: center; gap: 20px; padding: 20px; border: 2px solid #f8f9fa; border-radius: 12px; margin-bottom: 15px; cursor: pointer; transition: all 0.3s ease;" onclick="selectCartItem(${item.id})">
            <div style="width: 80px; height: 80px; border-radius: 10px; overflow: hidden; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
                ${item.images && item.images.length > 0 && item.images[0].type.startsWith('image/') 
                    ? `<img src="${item.images[0].data}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : `<i class="fas fa-${getProductIcon(item.type)}" style="font-size: 32px; color: #667eea;"></i>`
                }
            </div>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 18px;">${item.name}</h3>
                <div style="color: #7f8c8d; font-size: 14px;">
                    ${item.params ? `
                        <span>Бумага: ${item.params.paperType || 'Не указано'}</span> | 
                        <span>Цветность: ${item.params.colorType || 'Не указано'}</span> | 
                        <span>Тираж: ${item.params.circulation || 0} шт.</span>
                    ` : ''}
                </div>
                ${item.images && item.images.length > 0 ? `
                    <div style="margin-top: 8px; font-size: 12px; color: #667eea;">
                        <i class="fas fa-image"></i> Загружено макетов: ${item.images.length}
                    </div>
                ` : ''}
            </div>
            <div style="font-size: 22px; font-weight: 700; color: #667eea;">
                ${formatPrice(item.price * (item.quantity || 1))}
            </div>
            <button class="remove-btn" onclick="event.stopPropagation(); removeCartItem(${item.id})" style="background: #e74c3c; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}


function initCart() {
    console.log('Инициализация корзины...');

    // Check authentication
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        showAuthRequired();
        return;
    }

    // Load cart items
    loadCartItems();

    // Quantity controls
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const item = this.closest('.cart-item');
            const quantityElement = item.querySelector('.quantity');
            let quantity = parseInt(quantityElement.textContent);

            if (this.textContent === '+' && quantity < 999) {
                quantity++;
            } else if (this.textContent === '-' && quantity > 1) {
                quantity--;
            }

            quantityElement.textContent = quantity;
            updateItemPrice(item);
            updateCartSummary();
        });
    });

    // Remove items
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const item = this.closest('.cart-item');
            const itemId = item.getAttribute('data-id');
            removeFromCart(itemId);
            item.remove();
            updateCartSummary();
            updateCartCount();
        });
    });

    // Checkout button
    const checkoutBtn = document.querySelector('.btn-primary.btn-large');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            window.location.href = 'cart.html';
        });
    }
}

// Global functions for cart item interaction
function selectCartItem(itemId) {
    // Store selected item and show checkout form
    localStorage.setItem('selectedCartItem', itemId);
    const cartItemsSection = document.getElementById('cartItemsSection');
    const checkoutLayout = document.getElementById('checkoutLayout');
    
    if (cartItemsSection) cartItemsSection.style.display = 'none';
    if (checkoutLayout) checkoutLayout.style.display = 'grid';
    localStorage.setItem('showCheckout', 'true');
    
    // Load checkout form
    loadCheckoutItems();
    loadUserData();
    loadUploadedImages();
    setupAddressPreview();
    
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
    
    document.querySelectorAll('input[name="deliveryMethod"]').forEach(radio => {
        radio.addEventListener('change', updateDeliveryPrice);
    });
    
    // Setup back button
    const backToCartBtn = document.getElementById('backToCartBtn');
    if (backToCartBtn) {
        // Remove existing listeners
        const newBackBtn = backToCartBtn.cloneNode(true);
        backToCartBtn.parentNode.replaceChild(newBackBtn, backToCartBtn);
        
        newBackBtn.addEventListener('click', function() {
            if (cartItemsSection) cartItemsSection.style.display = 'block';
            if (checkoutLayout) checkoutLayout.style.display = 'none';
            localStorage.removeItem('showCheckout');
            loadCartItemsForCheckout();
        });
    }
}

function removeCartItem(itemId) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = cart.filter(item => item.id != itemId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
    
    loadCartItemsForCheckout();
    
    if (updatedCart.length === 0) {
        const cartItemsSection = document.getElementById('cartItemsSection');
        if (cartItemsSection) {
            cartItemsSection.innerHTML = '<div style="text-align: center; padding: 40px;"><p>Корзина пуста</p><a href="catalog.html" class="btn btn-primary">Перейти в каталог</a></div>';
        }
    }
}

function loadCheckoutItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsSummary = document.getElementById('cartItemsSummary');
    
    if (!cartItemsSummary) return;
    
    if (cart.length === 0) {
        cartItemsSummary.innerHTML = '<p style="text-align: center; color: #999;">Корзина пуста</p>';
        return;
    }
    
    cartItemsSummary.innerHTML = cart.map(item => `
        <div class="summary-item">
            <div style="flex: 1;">
                <strong>${item.name}</strong>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    ${item.params ? `Тираж: ${item.params.circulation} шт.` : ''}
                </div>
            </div>
            <div style="font-weight: 600;">
                ${formatPrice(item.price * (item.quantity || 1))}
            </div>
        </div>
    `).join('');
    
    updateCheckoutSummary();
}

function loadUserData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;
    
    // Load user data from users array
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userData = users.find(u => u.email === user.email);
    
    if (userData) {
        if (document.getElementById('contactName')) {
            document.getElementById('contactName').value = userData.name || '';
        }
        if (document.getElementById('contactPhone')) {
            document.getElementById('contactPhone').value = userData.phone || '';
        }
        if (document.getElementById('contactEmail')) {
            document.getElementById('contactEmail').value = userData.email || '';
        }
    }
}

function loadUploadedImages() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const imagesSection = document.getElementById('imagesSection');
    const uploadedImagesPreview = document.getElementById('uploadedImagesPreview');
    
    if (!imagesSection || !uploadedImagesPreview) return;
    
    // Collect all images from cart items
    let allImages = [];
    cart.forEach(item => {
        if (item.images && item.images.length > 0) {
            allImages = allImages.concat(item.images);
        }
    });
    
    if (allImages.length === 0) {
        imagesSection.style.display = 'none';
        return;
    }
    
    imagesSection.style.display = 'block';
    uploadedImagesPreview.innerHTML = allImages.map((img, index) => {
        if (img.type && img.type.startsWith('image/')) {
            return `
                <div class="image-preview-item">
                    <img src="${img.data}" alt="${img.name}">
                    <button type="button" class="remove-image" onclick="removeImage(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="image-preview-item" style="display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
                    <i class="fas fa-file" style="font-size: 32px; color: #667eea;"></i>
                </div>
            `;
        }
    }).join('');
}

function setupAddressPreview() {
    const cityInput = document.getElementById('deliveryCity');
    const streetInput = document.getElementById('deliveryStreet');
    const postcodeInput = document.getElementById('deliveryPostcode');
    const addressPreview = document.getElementById('addressPreview');
    const addressText = document.getElementById('addressText');
    
    function updatePreview() {
        const city = cityInput ? cityInput.value : '';
        const street = streetInput ? streetInput.value : '';
        const postcode = postcodeInput ? postcodeInput.value : '';
        
        if (city || street || postcode) {
            const address = [postcode, city, street].filter(Boolean).join(', ');
            if (addressText) addressText.textContent = address;
            if (addressPreview) addressPreview.style.display = 'block';
        } else {
            if (addressPreview) addressPreview.style.display = 'none';
        }
    }
    
    if (cityInput) cityInput.addEventListener('input', updatePreview);
    if (streetInput) streetInput.addEventListener('input', updatePreview);
    if (postcodeInput) postcodeInput.addEventListener('input', updatePreview);
}

function updateDeliveryPrice() {
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
    const deliveryPriceEl = document.getElementById('deliveryPrice');
    
    if (!deliveryPriceEl) return;
    
    const deliveryPrice = deliveryMethod && deliveryMethod.value === 'courier' ? 300 : 0;
    deliveryPriceEl.textContent = deliveryPrice === 0 ? '0 ₽' : formatPrice(deliveryPrice);
    
    updateCheckoutSummary();
}

function updateCheckoutSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
    const deliveryPrice = deliveryMethod && deliveryMethod.value === 'courier' ? 300 : 0;
    
    const total = subtotal + deliveryPrice;
    
    const subtotalPriceEl = document.getElementById('subtotalPrice');
    const deliveryPriceEl = document.getElementById('deliveryPrice');
    const totalPriceEl = document.getElementById('totalPrice');
    
    if (subtotalPriceEl) subtotalPriceEl.textContent = formatPrice(subtotal);
    if (deliveryPriceEl) deliveryPriceEl.textContent = deliveryPrice === 0 ? '0 ₽' : formatPrice(deliveryPrice);
    if (totalPriceEl) totalPriceEl.textContent = formatPrice(total);
}

function handleCheckout(e) {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('Корзина пуста', 'warning');
        }
        return;
    }
    
    // Get form data
    const deliveryCity = document.getElementById('deliveryCity').value;
    const deliveryStreet = document.getElementById('deliveryStreet').value;
    const deliveryPostcode = document.getElementById('deliveryPostcode').value;
    const deliveryComment = document.getElementById('deliveryComment').value;
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const contactName = document.getElementById('contactName').value;
    const contactPhone = document.getElementById('contactPhone').value;
    const contactEmail = document.getElementById('contactEmail').value;
    const orderComment = document.getElementById('orderComment').value;
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const deliveryPrice = deliveryMethod === 'courier' ? 300 : 0;
    const total = subtotal + deliveryPrice;
    
    // Create order
    const order = {
        id: Date.now(),
        userId: user.email,
        items: cart,
        total: total,
        subtotal: subtotal,
        deliveryPrice: deliveryPrice,
        status: 'new',
        date: new Date().toISOString(),
        delivery: {
            city: deliveryCity,
            street: deliveryStreet,
            postcode: deliveryPostcode,
            comment: deliveryComment,
            method: deliveryMethod
        },
        payment: {
            method: paymentMethod
        },
        contact: {
            name: contactName,
            phone: contactPhone,
            email: contactEmail
        },
        comment: orderComment
    };
    
    // Save order
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart and uploaded images
    localStorage.removeItem('cart');
    localStorage.removeItem('calculatorUploadedImages');
    localStorage.removeItem('showCheckout');
    localStorage.removeItem('selectedCartItem');
    updateCartCount();
    
    if (typeof showNotification === 'function') {
        showNotification('Заказ успешно отправлен менеджеру!', 'success');
    }
    
    setTimeout(() => {
        window.location.href = 'personal.html';
    }, 2000);
}

function loadCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.querySelector('.cart-items');

    if (cart.length === 0) {
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Корзина пуста</h3>
                    <p>Добавьте товары из каталога</p>
                    <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>
                </div>
            `;
        }
        if (document.querySelector('.order-summary')) {
            document.querySelector('.order-summary').style.display = 'none';
        }
        return;
    }

    // Render cart items
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-image">
                    ${item.images && item.images.length > 0 && item.images[0].type.startsWith('image/') 
                        ? `<img src="${item.images[0].data}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">`
                        : `<i class="fas fa-${getProductIcon(item.type)}"></i>`
                    }
                </div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <div class="item-params">
                        ${item.params ? `
                            <span>Бумага: ${item.params.paperType || 'Не указано'}</span>
                            <span>Цветность: ${item.params.colorType || 'Не указано'}</span>
                            <span>Тираж: ${item.params.circulation || 0} шт.</span>
                        ` : ''}
                    </div>
                    ${item.images && item.images.length > 0 ? `
                        <div style="margin-top: 8px; font-size: 12px; color: #667eea;">
                            <i class="fas fa-image"></i> Загружено макетов: ${item.images.length}
                        </div>
                    ` : ''}
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn">-</button>
                    <span class="quantity">${item.quantity || 1}</span>
                    <button class="quantity-btn">+</button>
                </div>
                <div class="item-price">
                    <span class="price">${formatPrice(item.price * (item.quantity || 1))}</span>
                    <button class="remove-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateCartSummary();
}

function removeFromCart(itemId) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = cart.filter(item => item.id != itemId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    if (typeof showNotification === 'function') {
        showNotification('Товар удален из корзины', 'success');
    }
}

function updateItemPrice(item) {
    const quantity = parseInt(item.querySelector('.quantity').textContent);
    const basePrice = 3200; // This should come from item data
    const priceElement = item.querySelector('.price');

    priceElement.textContent = formatPrice(basePrice * quantity);
}

function updateCartSummary() {
    const items = document.querySelectorAll('.cart-item');
    let subtotal = 0;

    items.forEach(item => {
        const priceText = item.querySelector('.price').textContent;
        const price = parseInt(priceText.replace(/\s|₽/g, ''));
        subtotal += price;
    });

    const delivery = subtotal >= 5000 ? 0 : 300;
    const total = subtotal + delivery;

    const summaryDetails = document.querySelector('.summary-details');
    if (summaryDetails) {
        summaryDetails.innerHTML = `
            <div class="summary-row">
                <span>Товары (${items.length})</span>
                <span>${formatPrice(subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Доставка</span>
                <span>${delivery === 0 ? '0 ₽' : formatPrice(delivery)}</span>
            </div>
            <div class="summary-row total">
                <strong>Итого</strong>
                <strong>${formatPrice(total)}</strong>
            </div>
        `;
    }
}

function showAuthRequired() {
    const cartLayout = document.querySelector('.cart-layout');
    if (cartLayout) {
        cartLayout.innerHTML = `
            <div class="auth-required">
                <div class="auth-message">
                    <i class="fas fa-lock"></i>
                    <h3>Требуется авторизация</h3>
                    <p>Для добавления товаров в корзину необходимо войти в систему</p>
                    <div class="auth-buttons">
                        <button class="btn btn-primary" id="loginFromCart">Войти</button>
                        <button class="btn btn-outline" id="registerFromCart">Регистрация</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('loginFromCart').addEventListener('click', function () {
            document.getElementById('loginModal').style.display = 'block';
        });

        document.getElementById('registerFromCart').addEventListener('click', function () {
            document.getElementById('registerModal').style.display = 'block';
        });
    }
}

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

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// Make functions global for onclick handlers
window.selectCartItem = selectCartItem;
window.removeCartItem = removeCartItem;

console.log('Корзина инициализирована');
