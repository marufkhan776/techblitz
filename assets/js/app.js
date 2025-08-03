/**
 * TechBlitz Deals - Main Application
 * Handles UI interactions, product rendering, and modal functionality
 */

class TechBlitzApp {
    constructor() {
        this.currentFilters = {
            category: 'all',
            search: '',
            minRating: 0
        };
        this.modal = null;
        this.modalOverlay = null;
        this.isModalOpen = false;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.initializeElements();
        this.bindEvents();
        this.loadInitialContent();
        
        console.log('🚀 TechBlitz Deals App initialized');
    }

    /**
     * Initialize DOM elements and references
     */
    initializeElements() {
        // Modal elements
        this.modal = document.getElementById('review-modal');
        this.modalClose = document.getElementById('modal-close');
        this.modalBody = document.getElementById('modal-body');
        
        // Filter elements
        this.searchInput = document.getElementById('search-input');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        
        // Product containers
        this.featuredProductsContainer = document.getElementById('featured-products');
        this.productsGrid = document.getElementById('products-grid');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.noResults = document.getElementById('no-results');
        
        // Mobile navigation
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('.nav-menu');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Modal events
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }
        
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }
        
        // Keyboard events for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) {
                this.closeModal();
            }
        });
        
        // Search functionality
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.search = this.searchInput.value;
                this.filterProducts();
            }, 300));
        }
        
        // Filter buttons
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.setActiveFilter(button);
                this.currentFilters.category = button.dataset.category;
                this.filterProducts();
            });
        });
        
        // Mobile navigation
        if (this.hamburger && this.navMenu) {
            this.hamburger.addEventListener('click', () => {
                this.navMenu.classList.toggle('active');
                this.hamburger.classList.toggle('active');
            });
        }
        
        // Smooth scroll for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    /**
     * Load initial content based on current page
     */
    loadInitialContent() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'index':
                this.loadFeaturedProducts();
                break;
            case 'showcase':
                this.loadAllProducts();
                break;
            case 'about':
                // About page doesn't need product loading
                break;
            default:
                this.loadFeaturedProducts();
        }
    }

    /**
     * Determine current page based on URL
     * @returns {string} Page identifier
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().split('.')[0];
        
        if (filename === '' || filename === 'index') return 'index';
        if (filename === 'showcase') return 'showcase';
        if (filename === 'about') return 'about';
        
        return 'index';
    }

    /**
     * Load and display featured products
     */
    async loadFeaturedProducts() {
        if (!this.featuredProductsContainer) return;
        
        try {
            const products = await window.ProductsManager.getFeaturedProducts();
            this.renderProducts(products, this.featuredProductsContainer);
        } catch (error) {
            console.error('Error loading featured products:', error);
            this.showError(this.featuredProductsContainer, 'Failed to load featured products');
        }
    }

    /**
     * Load and display all products
     */
    async loadAllProducts() {
        if (!this.productsGrid) return;
        
        this.showLoading();
        
        try {
            const products = await window.ProductsManager.getProducts();
            this.hideLoading();
            this.renderProducts(products, this.productsGrid);
        } catch (error) {
            console.error('Error loading products:', error);
            this.hideLoading();
            this.showError(this.productsGrid, 'Failed to load products');
        }
    }

    /**
     * Filter products based on current filters
     */
    async filterProducts() {
        if (!this.productsGrid) return;
        
        this.showLoading();
        
        try {
            const products = await window.ProductsManager.filterProducts(this.currentFilters);
            this.hideLoading();
            
            if (products.length === 0) {
                this.showNoResults();
            } else {
                this.hideNoResults();
                this.renderProducts(products, this.productsGrid);
            }
        } catch (error) {
            console.error('Error filtering products:', error);
            this.hideLoading();
            this.showError(this.productsGrid, 'Failed to filter products');
        }
    }

    /**
     * Render products in the specified container
     * @param {Array} products - Products to render
     * @param {HTMLElement} container - Container element
     */
    renderProducts(products, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        products.forEach(product => {
            const productCard = this.createProductCard(product);
            container.appendChild(productCard);
        });
        
        // Add scroll reveal animation
        this.addScrollRevealAnimation(container);
    }

    /**
     * Create a product card element
     * @param {Object} product - Product data
     * @returns {HTMLElement} Product card element
     */
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                ${product.image}
            </div>
            <div class="product-info">
                <h3>${product.title}</h3>
                <p class="product-description">${product.shortDescription}</p>
                ${window.ProductsManager.formatPrice(product)}
                <div class="product-rating">
                    ${window.ProductsManager.generateStarRating(product.rating)}
                </div>
                <div class="product-buttons">
                    <a href="${product.affiliateLink}" target="_blank" rel="noopener" class="btn btn-primary">
                        <i class="fas fa-shopping-cart"></i>
                        Buy Now
                    </a>
                    <button class="btn btn-secondary read-review-btn" data-product-id="${product.id}">
                        <i class="fas fa-eye"></i>
                        Read Review
                    </button>
                </div>
            </div>
        `;
        
        // Bind review button event
        const reviewBtn = card.querySelector('.read-review-btn');
        reviewBtn.addEventListener('click', () => this.openProductModal(product.id));
        
        return card;
    }

    /**
     * Open product review modal
     * @param {string} productId - Product ID
     */
    async openProductModal(productId) {
        try {
            const product = await window.ProductsManager.getProductById(productId);
            if (!product) {
                console.error('Product not found:', productId);
                return;
            }
            
            this.renderModalContent(product);
            this.showModal();
        } catch (error) {
            console.error('Error opening product modal:', error);
        }
    }

    /**
     * Render modal content for a product
     * @param {Object} product - Product data
     */
    renderModalContent(product) {
        if (!this.modalBody) return;
        
        this.modalBody.innerHTML = `
            <div class="modal-header">
                <div class="modal-image">
                    ${product.image}
                </div>
                <div class="modal-info">
                    <h2>${product.title}</h2>
                    <div class="modal-rating">
                        ${window.ProductsManager.generateStarRating(product.rating)}
                        <span style="margin-left: 0.5rem; color: var(--text-secondary);">(${product.rating}/5)</span>
                    </div>
                    ${window.ProductsManager.formatPrice(product)}
                </div>
            </div>
            
            <div class="modal-summary">
                <h4><i class="fas fa-lightbulb" style="color: var(--neon-blue); margin-right: 0.5rem;"></i>Review Summary</h4>
                <p>${product.review.summary}</p>
            </div>
            
            <div class="pros-cons">
                <div class="pros">
                    <h4><i class="fas fa-thumbs-up"></i> Pros</h4>
                    <ul>
                        ${product.review.pros.map(pro => `<li>${pro}</li>`).join('')}
                    </ul>
                </div>
                <div class="cons">
                    <h4><i class="fas fa-thumbs-down"></i> Cons</h4>
                    <ul>
                        ${product.review.cons.map(con => `<li>${con}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="modal-verdict">
                <h4><i class="fas fa-gavel" style="margin-right: 0.5rem;"></i>Final Verdict</h4>
                <p>${product.review.verdict}</p>
            </div>
            
            <div class="modal-actions">
                <a href="${product.affiliateLink}" target="_blank" rel="noopener" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i>
                    Get This Product
                </a>
            </div>
        `;
    }

    /**
     * Show the modal
     */
    showModal() {
        if (!this.modal) return;
        
        this.modal.classList.add('show');
        this.isModalOpen = true;
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Focus trap for accessibility
        this.modalClose?.focus();
    }

    /**
     * Close the modal
     */
    closeModal() {
        if (!this.modal) return;
        
        this.modal.classList.remove('show');
        this.isModalOpen = false;
        document.body.style.overflow = ''; // Restore scrolling
    }

    /**
     * Set active filter button
     * @param {HTMLElement} activeButton - Button that was clicked
     */
    setActiveFilter(activeButton) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'block';
        }
        if (this.productsGrid) {
            this.productsGrid.style.display = 'none';
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
        if (this.productsGrid) {
            this.productsGrid.style.display = 'grid';
        }
    }

    /**
     * Show no results message
     */
    showNoResults() {
        if (this.noResults) {
            this.noResults.style.display = 'block';
        }
        if (this.productsGrid) {
            this.productsGrid.style.display = 'none';
        }
    }

    /**
     * Hide no results message
     */
    hideNoResults() {
        if (this.noResults) {
            this.noResults.style.display = 'none';
        }
    }

    /**
     * Show error message
     * @param {HTMLElement} container - Container to show error in
     * @param {string} message - Error message
     */
    showError(container, message) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i>
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Add scroll reveal animation to products
     * @param {HTMLElement} container - Container with products
     */
    addScrollRevealAnimation(container) {
        const cards = container.querySelectorAll('.product-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    /**
     * Debounce function for search input
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Handle smooth scrolling for navigation links
     */
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Add floating animation to hero cards
     */
    initFloatingAnimation() {
        const floatingCards = document.querySelectorAll('.floating-card');
        
        floatingCards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) rotate(10deg) scale(1.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /**
     * Initialize navbar scroll effect
     */
    initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                navbar.style.background = 'rgba(11, 12, 16, 0.95)';
                navbar.style.backdropFilter = 'blur(20px)';
            } else {
                navbar.style.background = 'rgba(11, 12, 16, 0.9)';
                navbar.style.backdropFilter = 'blur(10px)';
            }
            
            lastScrollY = currentScrollY;
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for products to load
    setTimeout(() => {
        window.TechBlitzApp = new TechBlitzApp();
    }, 100);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh data when page becomes visible
        console.log('👁️ Page visible - refreshing data');
    }
});

// Add global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});