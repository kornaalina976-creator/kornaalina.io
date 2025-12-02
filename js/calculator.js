// Calculator functionality
function initCalculator() {
    console.log('Инициализация калькулятора...');

    const productTypeSelect = document.getElementById('productType');
    const paperTypeSelect = document.getElementById('paperType');
    const paperWeightSelect = document.getElementById('paperWeight');
    const colorTypeSelect = document.getElementById('colorType');
    const circulationSlider = document.getElementById('circulation');
    const circulationValue = document.getElementById('circulationValue');
    const totalPriceElement = document.getElementById('totalPrice');
    const basePriceElement = document.getElementById('basePrice');
    const optionsPriceElement = document.getElementById('optionsPrice');
    const addToCartBtn = document.getElementById('addToCartBtn');

    // Price configuration
    const priceConfig = {
        basePrices: {
            'visiting-card': 500,
            'flyer': 1200,
            'booklet': 2500,
            'poster': 800,
            'form': 1500,
            'envelope': 600,
            'calendar': 2000,
            'badge': 400
        },
        paperTypeMultipliers: {
            'offset': 1.0,
            'coated': 1.2,
            'design': 1.5
        },
        paperWeightMultipliers: {
            '130': 1.0,
            '170': 1.3,
            '250': 1.7,
            '300': 2.0
        },
        colorTypeMultipliers: {
            '1+0': 1.0,
            '1+1': 1.5,
            '4+0': 2.0,
            '4+4': 2.5
        }
    };

    function getCurrentUserSafe() {
        if (typeof getStoredCurrentUser === 'function') {
            return getStoredCurrentUser();
        }
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    }

    // Initialize circulation slider
    if (circulationSlider && circulationValue) {
        circulationSlider.addEventListener('input', function () {
            circulationValue.textContent = this.value;
            recalculatePrice();
        });
    }

    // Add event listeners to all parameter controls
    const parameterControls = [
        productTypeSelect,
        paperTypeSelect,
        paperWeightSelect,
        colorTypeSelect
    ];

    parameterControls.forEach(control => {
        if (control) {
            control.addEventListener('change', recalculatePrice);
        }
    });

    // Add to cart button
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCart);
    }

    // Save calculation button
    const saveCalculationBtn = document.getElementById('saveCalculation');
    if (saveCalculationBtn) {
        saveCalculationBtn.addEventListener('click', saveCalculation);
    }

    // Initialize file upload
    initializeFileUpload();

    // Check URL parameters for pre-selected product and load calculation
    checkUrlParameters();
    loadCalculationFromUrl();

    // Recalculate price function
    function recalculatePrice() {
        if (!totalPriceElement || !basePriceElement || !optionsPriceElement) return;

        // Get current values
        const productType = productTypeSelect ? productTypeSelect.value : 'visiting-card';
        const paperType = paperTypeSelect ? paperTypeSelect.value : 'offset';
        const paperWeight = paperWeightSelect ? paperWeightSelect.value : '130';
        const colorType = colorTypeSelect ? colorTypeSelect.value : '1+0';
        const circulation = circulationSlider ? parseInt(circulationSlider.value) : 100;

        // Calculate base price
        const basePricePerUnit = priceConfig.basePrices[productType] || 500;
        let basePrice = basePricePerUnit;

        // Apply multipliers
        basePrice *= priceConfig.paperTypeMultipliers[paperType] || 1.0;
        basePrice *= priceConfig.paperWeightMultipliers[paperWeight] || 1.0;
        basePrice *= priceConfig.colorTypeMultipliers[colorType] || 1.0;

        // Calculate total base price
        const totalBasePrice = basePrice * (circulation / 100);

        // Calculate additional options price (simplified)
        const optionsPrice = totalBasePrice * 0.2; // 20% of base price

        // Calculate total price
        const totalPrice = totalBasePrice + optionsPrice;

        // Update UI
        basePriceElement.textContent = formatPrice(totalBasePrice);
        optionsPriceElement.textContent = formatPrice(optionsPrice);
        totalPriceElement.textContent = formatPrice(totalPrice);
    }

    // Add to cart functionality
    function addToCart() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            document.getElementById('loginModal').style.display = 'block';
            return;
        }

        const productType = productTypeSelect ? productTypeSelect.value : 'visiting-card';
        const paperType = paperTypeSelect ? paperTypeSelect.value : 'offset';
        const paperWeight = paperWeightSelect ? paperWeightSelect.value : '130';
        const colorType = colorTypeSelect ? colorTypeSelect.value : '1+0';
        const circulation = circulationSlider ? parseInt(circulationSlider.value) : 100;
        const totalPrice = parseFloat(totalPriceElement.textContent.replace(/\s|₽/g, ''));

        // Get uploaded images
        const uploadedImages = getUploadedImages();

        const cartItem = {
            id: Date.now(),
            productId: productType,
            name: getProductName(productType),
            type: productType,
            price: totalPrice,
            quantity: 1,
            params: {
                paperType: paperType,
                paperWeight: paperWeight,
                colorType: colorType,
                circulation: circulation
            },
            images: uploadedImages
        };

        // Get current cart or initialize empty array
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.push(cartItem);

        // Save updated cart
        localStorage.setItem('cart', JSON.stringify(cart));

        // Update cart count
        updateCartCount();

        // Show minimal notification (toast style)
        showMinimalNotification('Товар добавлен в корзину');
    }

    // Check URL parameters
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const productParam = urlParams.get('product');

        if (productParam && productTypeSelect) {
            productTypeSelect.value = productParam;
            recalculatePrice();
        }
    }
    
    // Load calculation from URL parameter
    function loadCalculationFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const calcId = urlParams.get('calcId');
        
        if (!calcId) return;
        
        const calculations = JSON.parse(localStorage.getItem('calculations')) || [];
        const calc = calculations.find(c => c.id == calcId);
        
        if (!calc) {
            console.log('Calculation not found:', calcId);
            return;
        }
        
        // Load calculation parameters
        if (productTypeSelect && calc.productType) {
            productTypeSelect.value = calc.productType;
        }
        if (paperTypeSelect && calc.paperType) {
            paperTypeSelect.value = calc.paperType;
        }
        if (paperWeightSelect && calc.paperWeight) {
            paperWeightSelect.value = calc.paperWeight;
        }
        if (colorTypeSelect && calc.colorType) {
            colorTypeSelect.value = calc.colorType;
        }
        if (circulationSlider && calc.circulation) {
            circulationSlider.value = calc.circulation;
            if (circulationValue) {
                circulationValue.textContent = calc.circulation;
            }
        }
        
        recalculatePrice();
        
        if (typeof showNotification === 'function') {
            showNotification(`Расчет "${calc.name}" загружен`, 'success');
        }
    }

    // Helper functions
    function formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(Math.round(price)) + ' ₽';
    }

    function getProductName(productType) {
        const names = {
            'visiting-card': 'Визитки',
            'flyer': 'Листовки',
            'booklet': 'Брошюры',
            'poster': 'Плакаты',
            'form': 'Бланки',
            'envelope': 'Конверты',
            'calendar': 'Календари',
            'badge': 'Бейджи'
        };
        return names[productType] || 'Продукция';
    }

    // File upload functionality
    function initializeFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadedFiles = document.getElementById('uploadedFiles');
        let uploadedImages = [];

        if (!uploadArea || !fileInput) return;

        // Click to upload
        uploadArea.addEventListener('click', function(e) {
            if (e.target.closest('.upload-link') || !e.target.closest('.uploaded-files')) {
                fileInput.click();
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#667eea';
            uploadArea.style.background = 'rgba(102, 126, 234, 0.05)';
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#e0e0e0';
            uploadArea.style.background = 'transparent';
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#e0e0e0';
            uploadArea.style.background = 'transparent';
            
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        });

        // File input change
        fileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            handleFiles(files);
        });

        function handleFiles(files) {
            files.forEach(file => {
                if (file.size > 10 * 1024 * 1024) {
                    if (typeof showNotification === 'function') {
                        showNotification(`Файл ${file.name} слишком большой (макс. 10 МБ)`, 'error');
                    }
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    const imageData = {
                        name: file.name,
                        data: e.target.result,
                        type: file.type
                    };
                    uploadedImages.push(imageData);
                    displayUploadedFile(imageData, uploadedImages.length - 1);
                    saveUploadedImages();
                };
                reader.readAsDataURL(file);
            });
        }

        function displayUploadedFile(imageData, index) {
            const fileItem = document.createElement('div');
            fileItem.className = 'uploaded-file-item';
            fileItem.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; margin-top: 10px;';
            
            if (imageData.type.startsWith('image/')) {
                fileItem.innerHTML = `
                    <img src="${imageData.data}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                    <span style="flex: 1; font-size: 14px;">${imageData.name}</span>
                    <button type="button" class="remove-file-btn" data-index="${index}" style="background: #e74c3c; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            } else {
                fileItem.innerHTML = `
                    <i class="fas fa-file" style="font-size: 24px; color: #667eea;"></i>
                    <span style="flex: 1; font-size: 14px;">${imageData.name}</span>
                    <button type="button" class="remove-file-btn" data-index="${index}" style="background: #e74c3c; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }

            uploadedFiles.appendChild(fileItem);

            // Remove file handler
            fileItem.querySelector('.remove-file-btn').addEventListener('click', function() {
                uploadedImages.splice(index, 1);
                fileItem.remove();
                saveUploadedImages();
                updateFileDisplay();
            });
        }

        function updateFileDisplay() {
            uploadedFiles.innerHTML = '';
            uploadedImages.forEach((img, index) => {
                displayUploadedFile(img, index);
            });
        }

        function saveUploadedImages() {
            localStorage.setItem('calculatorUploadedImages', JSON.stringify(uploadedImages));
        }

        function getUploadedImages() {
            return uploadedImages;
        }

        // Load saved images
        const savedImages = localStorage.getItem('calculatorUploadedImages');
        if (savedImages) {
            try {
                uploadedImages = JSON.parse(savedImages);
                updateFileDisplay();
            } catch (e) {
                console.error('Error loading saved images:', e);
            }
        }

        // Expose function globally
        window.getUploadedImages = getUploadedImages;
    }

    function getUploadedImages() {
        const saved = localStorage.getItem('calculatorUploadedImages');
        return saved ? JSON.parse(saved) : [];
    }

    // Save calculation function
    function saveCalculation() {
        const user = getCurrentUserSafe();
        if (!user) {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'block';
            }
            showMinimalNotification('Войдите, чтобы сохранить расчет');
            return;
        }

        const productType = productTypeSelect ? productTypeSelect.value : 'visiting-card';
        const paperType = paperTypeSelect ? paperTypeSelect.value : 'offset';
        const paperWeight = paperWeightSelect ? paperWeightSelect.value : '130';
        const colorType = colorTypeSelect ? colorTypeSelect.value : '1+0';
        const circulation = circulationSlider ? parseInt(circulationSlider.value) : 100;
        const totalPrice = parseFloat(totalPriceElement.textContent.replace(/\s|₽/g, ''));

        const calculation = {
            id: Date.now(),
            name: getProductName(productType),
            productType: productType,
            paperType: paperType,
            paperWeight: paperWeight,
            colorType: colorType,
            circulation: circulation,
            price: totalPrice,
            date: new Date().toLocaleDateString('ru-RU'),
            userId: user.email
        };

        // Get saved calculations
        const calculations = JSON.parse(localStorage.getItem('calculations')) || [];
        calculations.push(calculation);
        localStorage.setItem('calculations', JSON.stringify(calculations));

        // Show success notification
        if (typeof showNotification === 'function') {
            showNotification('Расчет сохранен', 'success');
        }

        // Update history display
        updateCalculationHistory();
    }

    // Update calculation history display
    function updateCalculationHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        const user = getCurrentUserSafe();
        if (!user) {
            historyList.innerHTML = '<p class="no-history">Авторизуйтесь, чтобы сохранять расчеты</p>';
            return;
        }

        const calculations = JSON.parse(localStorage.getItem('calculations')) || [];
        const userCalculations = calculations.filter(calc => {
            if (!calc.userId) {
                return true;
            }
            return calc.userId === user.email;
        });

        if (userCalculations.length === 0) {
            historyList.innerHTML = '<p class="no-history">У вас пока нет сохраненных расчетов</p>';
            return;
        }

        // Show last 5 calculations
        const recentCalculations = userCalculations.slice(-5).reverse();
        historyList.innerHTML = recentCalculations.map(calc => `
            <div class="history-item" style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <strong>${calc.name}</strong>
                    <p style="margin: 5px 0; color: #7f8c8d; font-size: 14px;">
                        ${calc.circulation} шт. | ${calc.paperType} ${calc.paperWeight}г/м² | ${calc.colorType}
                    </p>
                    <span style="color: #bdc3c7; font-size: 12px;">${calc.date}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="font-size: 18px; font-weight: 700; color: #667eea;">
                        ${formatPrice(calc.price)}
                    </div>
                    <button class="btn btn-outline btn-sm delete-calculation-btn" data-calc-id="${calc.id}" style="padding: 6px 12px; font-size: 12px;" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add delete handlers
        historyList.querySelectorAll('.delete-calculation-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const calcId = parseInt(this.getAttribute('data-calc-id'));
                if (typeof showConfirmModal === 'function') {
                    showConfirmModal('Удалить этот расчет?', 'Удаление расчета').then(confirmed => {
                        if (confirmed) {
                            deleteCalculation(calcId);
                        }
                    });
                }
            });
        });
    }
    
    function deleteCalculation(calcId) {
        const calculations = JSON.parse(localStorage.getItem('calculations')) || [];
        const updatedCalculations = calculations.filter(calc => calc.id !== calcId);
        localStorage.setItem('calculations', JSON.stringify(updatedCalculations));
        
        if (typeof showNotification === 'function') {
            showNotification('Расчет удален', 'success');
        }
        
        updateCalculationHistory();
    }

    // Minimal notification function
    function showMinimalNotification(message) {
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
            animation: slideInUp 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Initial calculation
    recalculatePrice();
    updateCalculationHistory();
    console.log('Калькулятор инициализирован');
}