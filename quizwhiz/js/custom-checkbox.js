// Custom Checkbox Component for QuizWhiz
class CustomCheckbox {
    // Static array to track all checkbox instances
    static instances = [];
    
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            window.debugLog?.error('customCheckbox', `Custom checkbox container with id '${containerId}' not found`);
            return;
        }
        
        this.options = {
            size: 'normal', // small, normal, large
            variant: 'default', // default, success, warning, danger
            disabled: false,
            checked: false,
            label: '',
            onChange: null,
            ...options
        };
        
        this.checkbox = null;
        this.checkboxBox = null;
        this.label = null;
        this.onChangeCallback = null;
        
        // Add this instance to the static array
        CustomCheckbox.instances.push(this);
        
        this.init();
    }
    
    init() {
        this.createCheckbox();
        this.setupEventListeners();
        this.setupExistingCheckbox();
    }
    
    createCheckbox() {
        // Check if container already has a checkbox structure
        const existingCheckbox = this.container.querySelector('input[type="checkbox"]');
        if (existingCheckbox) {
            this.convertExistingCheckbox(existingCheckbox);
            return;
        }
        
        this.createNewCheckbox();
    }
    
    createNewCheckbox() {
        // Create new checkbox structure without inner label
        this.container.innerHTML = `
            <input type="checkbox" id="${this.container.id}-input" ${this.options.checked ? 'checked' : ''} ${this.options.disabled ? 'disabled' : ''}>
            <div class="custom-checkbox-box"></div>
        `;
        
        this.checkbox = this.container.querySelector('input[type="checkbox"]');
        this.checkboxBox = this.container.querySelector('.custom-checkbox-box');
        
        // Look for external label
        this.externalLabel = document.querySelector(`label[for="${this.container.id}-input"]`);
        
        // Add classes
        this.container.classList.add('custom-checkbox');
        if (this.options.size !== 'normal') {
            this.container.classList.add(this.options.size);
        }
        if (this.options.variant !== 'default') {
            this.container.classList.add(this.options.variant);
        }
    }
    
    convertExistingCheckbox(existingCheckbox) {
        // Get existing external label
        const externalLabel = document.querySelector(`label[for="${existingCheckbox.id}"]`);
        
        const isChecked = existingCheckbox.checked;
        const isDisabled = existingCheckbox.disabled;
        const checkboxId = existingCheckbox.id || `${this.container.id}-input`;
        
        // Create new structure without inner label
        this.container.innerHTML = `
            <input type="checkbox" id="${checkboxId}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
            <div class="custom-checkbox-box"></div>
        `;
        
        this.checkbox = this.container.querySelector('input[type="checkbox"]');
        this.checkboxBox = this.container.querySelector('.custom-checkbox-box');
        this.externalLabel = externalLabel;
        
        // Add classes
        this.container.classList.add('custom-checkbox');
        if (this.options.size !== 'normal') {
            this.container.classList.add(this.options.size);
        }
        if (this.options.variant !== 'default') {
            this.container.classList.add(this.options.variant);
        }
    }
    
    setupEventListeners() {
        // Click on container toggles checkbox
        this.container.addEventListener('click', (e) => {
            // Prevent double-triggering if clicking directly on the input
            if (e.target === this.checkbox) return;
            
            e.preventDefault();
            this.toggle();
        });
        
        // Click on external label also toggles checkbox
        if (this.externalLabel) {
            this.externalLabel.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        }
        
        // Make entire setting-item clickable if this checkbox is inside one
        const settingItem = this.container.closest('.setting-item');
        if (settingItem) {
            settingItem.addEventListener('click', (e) => {
                // Only toggle if not clicking on the checkbox itself or other interactive elements
                if (e.target === this.checkbox || e.target.closest('.custom-checkbox-container') || e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea') || e.target.closest('a[href]')) {
                    return;
                }
                // Only prevent default if we're actually going to toggle the checkbox
                // This prevents unwanted scroll behavior when clicking on non-interactive areas
                if (e.target.closest('.setting-item') === settingItem) {
                    e.preventDefault();
                    this.toggle();
                }
            });
        }
        
        // Handle direct checkbox changes (for keyboard navigation)
        this.checkbox.addEventListener('change', (e) => {
            // Only trigger if this wasn't caused by our own setChecked method
            if (!this._internalChange) {
                this.triggerChange(e.target.checked);
            }
        });
        
        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    setupExistingCheckbox() {
        // Set initial state based on existing checkbox
        if (this.checkbox.checked !== this.options.checked) {
            this.options.checked = this.checkbox.checked;
        }
        
        // Set tabindex for accessibility
        this.container.setAttribute('tabindex', '0');
        this.container.setAttribute('role', 'checkbox');
        this.container.setAttribute('aria-checked', this.checkbox.checked);
        
        if (this.checkbox.disabled) {
            this.container.setAttribute('aria-disabled', 'true');
        }
    }
    
    toggle() {
        if (this.checkbox.disabled) return;
        
        const newValue = !this.checkbox.checked;
        this.setChecked(newValue);
    }
    
    setChecked(checked, silent = false) {
        if (this.checkbox.disabled) return;
        
        // Set flag to prevent infinite loop
        this._internalChange = true;
        this.checkbox.checked = checked;
        this.container.setAttribute('aria-checked', checked);
        this._internalChange = false;
        
        if (!silent) {
            this.triggerChange(checked);
        }
    }
    
    triggerChange(checked) {
        // Trigger change callback
        if (this.onChangeCallback) {
            this.onChangeCallback(checked, this);
        }
        
        // Trigger options callback
        if (this.options.onChange) {
            this.options.onChange(checked, this);
        }
        
        // Dispatch custom event
        const changeEvent = new CustomEvent('checkbox-change', {
            detail: { checked, checkbox: this }
        });
        this.container.dispatchEvent(changeEvent);
        
        // Don't dispatch native change event to prevent infinite loop
        // The change event is already handled by the browser when we set checkbox.checked
    }
    
    isChecked() {
        return this.checkbox.checked;
    }
    
    setDisabled(disabled) {
        this.checkbox.disabled = disabled;
        
        if (disabled) {
            this.container.setAttribute('aria-disabled', 'true');
            this.container.removeAttribute('tabindex');
        } else {
            this.container.removeAttribute('aria-disabled');
            this.container.setAttribute('tabindex', '0');
        }
    }
    
    setLabel(labelText) {
        if (this.externalLabel) {
            this.externalLabel.textContent = labelText;
        }
    }
    
    onChange(callback) {
        this.onChangeCallback = callback;
    }
    
    destroy() {
        // Remove event listeners and cleanup
        this.container.removeEventListener('click', this.toggle);
        this.container.removeEventListener('keydown', this.setupEventListeners);
        
        // Remove this instance from the static array
        const index = CustomCheckbox.instances.indexOf(this);
        if (index > -1) {
            CustomCheckbox.instances.splice(index, 1);
        }
    }
    
    // Static method to initialize all checkboxes with a specific class
    static initializeAll(className = 'custom-checkbox-container') {
        const containers = document.querySelectorAll(`.${className}`);
        containers.forEach(container => {
            if (!container.dataset.initialized) {
                new CustomCheckbox(container.id);
                container.dataset.initialized = 'true';
            }
        });
    }
    
    // Static method to get checkbox instance by container ID
    static getInstance(containerId) {
        return CustomCheckbox.instances.find(instance => 
            instance.container && instance.container.id === containerId
        );
    }
}

// Auto-initialize checkboxes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    CustomCheckbox.initializeAll();
});

// Make CustomCheckbox available globally
if (typeof window !== 'undefined') {
    window.CustomCheckbox = CustomCheckbox;
}