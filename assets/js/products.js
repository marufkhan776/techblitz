/**
 * TechBlitz Deals - Products Data Module
 * Handles loading and managing product data from JSON
 */

class ProductsDataManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.isLoaded = false;
        this.loadingCallbacks = [];
    }

    /**
     * Load products from JSON file
     * @returns {Promise<Array>} Promise that resolves to products array
     */
    async loadProducts() {
        if (this.isLoaded) {
            return this.products;
        }

        try {
            const response = await fetch('data/products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.products = data.products;
            this.categories = this.extractCategories();
            this.isLoaded = true;
            
            // Execute any pending callbacks
            this.loadingCallbacks.forEach(callback => callback(this.products));
            this.loadingCallbacks = [];
            
            console.log('✅ Products loaded successfully:', this.products.length, 'products');
            return this.products;
            
        } catch (error) {
            console.error('❌ Error loading products:', error);
            // Return empty array on error to prevent app crashes
            this.products = [];
            this.isLoaded = true;
            return this.products;
        }
    }

    /**
     * Get all products or wait for them to load
     * @returns {Promise<Array>} Promise that resolves to products array
     */
    getProducts() {
        if (this.isLoaded) {
            return Promise.resolve(this.products);
        }
        
        return this.loadProducts();
    }

    /**
     * Get products by category
     * @param {string} category - Category to filter by
     * @returns {Promise<Array>} Filtered products array
     */
    async getProductsByCategory(category) {
        const products = await this.getProducts();
        
        if (category === 'all' || !category) {
            return products;
        }
        
        return products.filter(product => product.category === category);
    }

    /**
     * Get featured products
     * @returns {Promise<Array>} Featured products array
     */
    async getFeaturedProducts() {
        const products = await this.getProducts();
        return products.filter(product => product.featured);
    }

    /**
     * Search products by title or description
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching products array
     */
    async searchProducts(query) {
        const products = await this.getProducts();
        
        if (!query || query.trim() === '') {
            return products;
        }
        
        const searchTerm = query.toLowerCase().trim();
        
        return products.filter(product => 
            product.title.toLowerCase().includes(searchTerm) ||
            product.shortDescription.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Get product by ID
     * @param {string} productId - Product ID to find
     * @returns {Promise<Object|null>} Product object or null if not found
     */
    async getProductById(productId) {
        const products = await this.getProducts();
        return products.find(product => product.id === productId) || null;
    }

    /**
     * Extract unique categories from products
     * @returns {Array} Array of category names
     */
    extractCategories() {
        const categories = [...new Set(this.products.map(product => product.category))];
        return categories.sort();
    }

    /**
     * Get all available categories
     * @returns {Promise<Array>} Array of category names
     */
    async getCategories() {
        if (this.isLoaded) {
            return this.categories;
        }
        
        await this.loadProducts();
        return this.categories;
    }

    /**
     * Filter and search products with multiple criteria
     * @param {Object} filters - Filter criteria
     * @param {string} filters.category - Category filter
     * @param {string} filters.search - Search query
     * @param {number} filters.minRating - Minimum rating filter
     * @returns {Promise<Array>} Filtered products array
     */
    async filterProducts(filters = {}) {
        const products = await this.getProducts();
        
        let filteredProducts = [...products];
        
        // Apply category filter
        if (filters.category && filters.category !== 'all') {
            filteredProducts = filteredProducts.filter(
                product => product.category === filters.category
            );
        }
        
        // Apply search filter
        if (filters.search && filters.search.trim() !== '') {
            const searchTerm = filters.search.toLowerCase().trim();
            filteredProducts = filteredProducts.filter(product =>
                product.title.toLowerCase().includes(searchTerm) ||
                product.shortDescription.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply rating filter
        if (filters.minRating && filters.minRating > 0) {
            filteredProducts = filteredProducts.filter(
                product => product.rating >= filters.minRating
            );
        }
        
        return filteredProducts;
    }

    /**
     * Register callback for when products are loaded
     * @param {Function} callback - Callback function
     */
    onProductsLoaded(callback) {
        if (this.isLoaded) {
            callback(this.products);
        } else {
            this.loadingCallbacks.push(callback);
        }
    }

    /**
     * Generate star rating HTML
     * @param {number} rating - Rating value (0-5)
     * @returns {string} HTML string for star rating
     */
    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star star"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt star"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star star empty"></i>';
        }
        
        return starsHTML;
    }

    /**
     * Format price with discount information
     * @param {Object} product - Product object
     * @returns {string} Formatted price HTML
     */
    formatPrice(product) {
        if (product.discount && product.discount !== '0%') {
            return `
                <span class="product-price">
                    ${product.price}
                    <span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.8em; margin-left: 0.5rem;">
                        ${product.originalPrice}
                    </span>
                    <span style="background: var(--neon-green); color: var(--bg-primary); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7em; margin-left: 0.5rem;">
                        -${product.discount}
                    </span>
                </span>
            `;
        }
        
        return `<span class="product-price">${product.price}</span>`;
    }

    /**
     * Get products statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics() {
        const products = await this.getProducts();
        const categories = await this.getCategories();
        
        const totalProducts = products.length;
        const featuredProducts = products.filter(p => p.featured).length;
        const averageRating = products.reduce((sum, p) => sum + p.rating, 0) / totalProducts;
        const productsWithDiscount = products.filter(p => p.discount && p.discount !== '0%').length;
        
        return {
            totalProducts,
            featuredProducts,
            averageRating: Math.round(averageRating * 10) / 10,
            totalCategories: categories.length,
            productsWithDiscount,
            discountPercentage: Math.round((productsWithDiscount / totalProducts) * 100)
        };
    }
}

// Create global instance
const productsManager = new ProductsDataManager();

// Auto-load products when the script loads
document.addEventListener('DOMContentLoaded', () => {
    productsManager.loadProducts().catch(error => {
        console.warn('Failed to auto-load products:', error);
    });
});

// Export for use in other modules
window.ProductsManager = productsManager;