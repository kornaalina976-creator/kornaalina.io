// Catalog functionality
function initCatalog() {
    console.log('Инициализация каталога...');

    const productsGrid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortSelect = document.getElementById('sortSelect');

    // Sample products data
    const products = [
        {
            id: 1,
            name: 'Визитки',
            category: 'visiting-cards',
            description: 'Стандартные визитки 90x50мм',
            price: 500,
            popular: true,
            type: 'visiting-card',
            image: 'id-card',
            imageUrl: 'imaage/viz5.jpg'
        },
        {
            id: 2,
            name: 'Листовки А4',
            category: 'flyers',
            description: 'Листовки формата А4',
            price: 1200,
            popular: true,
            type: 'flyer',
            image: 'file-alt',
            imageUrl: 'imaage/81BEB280B5BCB5BDBDB08F-BBB88182BEB2BAB0-organic-boho-0-1-fc559e7e9186.webp'
        },
        {
            id: 3,
            name: 'Брошюры А5',
            category: 'booklets',
            description: 'Брошюры с цветной печатью',
            price: 2500,
            popular: false,
            type: 'booklet',
            image: 'book',
            imageUrl: 'imaage/_-_-6.jpg'
        },
        {
            id: 4,
            name: 'Плакаты А3',
            category: 'posters',
            description: 'Яркие плакаты для мероприятий',
            price: 800,
            popular: true,
            type: 'poster',
            image: 'image',
            imageUrl: 'imaage/225_225_1_7d251ff8ae108cecf05b2c25c8b8d97b.jpg'
        },
        {
            id: 5,
            name: 'Бланки',
            category: 'forms',
            description: 'Фирменные бланки организации',
            price: 1500,
            popular: false,
            type: 'form',
            image: 'file-contract',
            imageUrl: 'imaage/9df8f920-71d8-40e6-898a-222330b4ef07.webp'
        },
        {
            id: 6,
            name: 'Конверты',
            category: 'envelopes',
            description: 'Конверты разных размеров',
            price: 600,
            popular: false,
            type: 'envelope',
            image: 'envelope',
            imageUrl: 'imaage/konverty-s-logotipom-015-01-750.webp'
        },
        {
            id: 7,
            name: 'Календари',
            category: 'calendars',
            description: 'Настенные и карманные календари',
            price: 2000,
            popular: true,
            type: 'calendar',
            image: 'calendar',
            imageUrl: 'imaage/kalendar-14.jpg'
        },
        {
            id: 8,
            name: 'Бейджи',
            category: 'badges',
            description: 'Бейджи для сотрудников',
            price: 400,
            popular: false,
            type: 'badge',
            image: 'id-badge',
            imageUrl: 'imaage/851_original.jpg'
        }
    ];

    // Render products
    function renderProducts(productsToRender) {
        if (!productsGrid) return;

        productsGrid.innerHTML = '';

        if (productsToRender.length === 0) {
            productsGrid.innerHTML = '<p class="no-products">Товары не найдены</p>';
            return;
        }

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    ${product.imageUrl ? 
                        `<img src="${product.imageUrl}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                         <div class="product-image-fallback" style="display: none;">
                            <i class="fas fa-${product.image}"></i>
                         </div>` :
                        `<div class="product-image-fallback">
                            <i class="fas fa-${product.image}"></i>
                         </div>`
                    }
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="product-price">
                        <span class="price">от ${formatPrice(product.price)}</span>
                        <button class="btn btn-primary btn-calculate" data-id="${product.id}">
                            Рассчитать
                        </button>
                    </div>
                </div>
            `;
            productsGrid.appendChild(productCard);
        });

        // Add event listeners to calculate buttons
        document.querySelectorAll('.btn-calculate').forEach(button => {
            button.addEventListener('click', function () {
                const productId = parseInt(this.getAttribute('data-id'));
                const product = products.find(p => p.id === productId);
                if (product) {
                    // Redirect to calculator with product pre-selected
                    window.location.href = `calculator.html?product=${product.type}`;
                }
            });
        });
    }

    // Filter and sort products
    function filterAndSortProducts() {
        let filteredProducts = [...products];

        // Apply search filter
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }

        // Apply category filter
        const category = categoryFilter ? categoryFilter.value : 'all';
        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(product =>
                product.category === category
            );
        }

        // Apply sorting
        const sortBy = sortSelect ? sortSelect.value : 'popular';
        switch (sortBy) {
            case 'price-low':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'popular':
            default:
                filteredProducts.sort((a, b) => {
                    if (a.popular && !b.popular) return -1;
                    if (!a.popular && b.popular) return 1;
                    return a.name.localeCompare(b.name);
                });
                break;
        }

        renderProducts(filteredProducts);
    }

    // Helper functions
    function formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', filterAndSortProducts);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterAndSortProducts);
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', filterAndSortProducts);
    }

    // Initial render
    renderProducts(products);
    console.log('Каталог инициализирован');
}