// Custom Dropdown Component for QuizWhiz
class CustomDropdown {
    // Static array to track all dropdown instances
    static instances = [];
    
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Custom dropdown container with id '${containerId}' not found`);
            return;
        }
        
        this.selectButton = this.container.querySelector('.select-button');
        this.dropdown = this.container.querySelector('.select-dropdown');
        this.selectedValue = this.selectButton.querySelector('.selected-value');
        this.arrow = this.selectButton.querySelector('.arrow');
        
        this.focusedIndex = -1;
        this.isOpen = false;
        this.onChangeCallback = null;
        
        // Add this instance to the static array
        CustomDropdown.instances.push(this);
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.setupClickOutside();
        this.setupExistingOptions();
    }
    
    setupEventListeners() {
        // Toggle dropdown on button click
        this.selectButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDropdown();
        });
        
        // Note: Option event listeners are added dynamically in addOption method
    }
    
    setupExistingOptions() {
        // Add event listeners to existing options in the HTML
        const existingOptions = this.dropdown.querySelectorAll('li');
        existingOptions.forEach((li, index) => {
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectOption(li, index);
            });
        });
    }
    
    setupKeyboardNavigation() {
        this.selectButton.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowDown':
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (!this.isOpen) {
                        this.openDropdown();
                    } else if (event.key === 'Enter' || event.key === ' ') {
                        this.selectCurrentOption();
                    }
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    if (this.isOpen) {
                        this.navigateUp();
                    }
                    break;
                case 'Escape':
                    this.closeDropdown();
                    break;
            }
        });
        
        this.dropdown.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    this.navigateDown();
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    this.navigateUp();
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    this.selectCurrentOption();
                    break;
                case 'Escape':
                    this.closeDropdown();
                    break;
            }
        });
    }
    
    setupClickOutside() {
        document.addEventListener('click', (event) => {
            if (!this.container.contains(event.target)) {
                this.closeDropdown();
            }
        });
    }
    
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    openDropdown() {
        // Close all other open dropdowns before opening this one
        CustomDropdown.closeAllExcept(this);
        
        this.isOpen = true;
        this.dropdown.classList.remove('hidden');
        this.selectButton.setAttribute('aria-expanded', 'true');
        
        // Set focus to first option or selected option
        this.focusedIndex = this.getSelectedIndex();
        if (this.focusedIndex === -1) {
            this.focusedIndex = 0;
        }
        this.updateFocus();
    }
    
    closeDropdown() {
        this.isOpen = false;
        this.dropdown.classList.add('hidden');
        this.selectButton.setAttribute('aria-expanded', 'false');
        this.focusedIndex = -1;
        this.selectButton.focus();
    }
    
    navigateDown() {
        const options = this.dropdown.querySelectorAll('li');
        if (this.focusedIndex < options.length - 1) {
            this.focusedIndex++;
            this.updateFocus();
        }
    }
    
    navigateUp() {
        if (this.focusedIndex > 0) {
            this.focusedIndex--;
            this.updateFocus();
        }
    }
    
    updateFocus() {
        const options = this.dropdown.querySelectorAll('li');
        options.forEach((option, index) => {
            option.setAttribute('tabindex', index === this.focusedIndex ? '0' : '-1');
            if (index === this.focusedIndex) {
                option.focus();
            }
        });
    }
    
    selectCurrentOption() {
        const options = this.dropdown.querySelectorAll('li');
        if (this.focusedIndex >= 0 && this.focusedIndex < options.length) {
            this.selectOption(options[this.focusedIndex], this.focusedIndex);
        }
    }
    
    selectOption(option, index) {
        const options = this.dropdown.querySelectorAll('li');
        
        // Remove selected class from all options
        options.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Update button text with icon
        this.selectedValue.innerHTML = option.innerHTML;
        
        // Get the data-value or use the text content
        const value = option.dataset.value || option.textContent.trim();
        
        // Close dropdown
        this.closeDropdown();
        
        // Trigger change callback
        if (this.onChangeCallback) {
            this.onChangeCallback(value, option);
        }
        
        // Dispatch custom event
        const changeEvent = new CustomEvent('dropdown-change', {
            detail: { value, option, dropdown: this }
        });
        this.container.dispatchEvent(changeEvent);
    }
    
    getSelectedIndex() {
        const options = this.dropdown.querySelectorAll('li');
        return Array.from(options).findIndex(option => 
            option.classList.contains('selected')
        );
    }
    
    getValue() {
        const selectedOption = this.dropdown.querySelector('li.selected');
        return selectedOption ? (selectedOption.dataset.value || selectedOption.textContent.trim()) : null;
    }
    
    setValue(value, silent = false) {
        const options = this.dropdown.querySelectorAll('li');
        const option = Array.from(options).find(opt => 
            (opt.dataset.value || opt.textContent.trim()) === value
        );
        
        if (option) {
            const index = Array.from(options).indexOf(option);
            if (silent) {
                this.setValueSilent(option, index);
            } else {
                this.selectOption(option, index);
            }
        }
    }
    
    setValueSilent(option, index) {
        const options = this.dropdown.querySelectorAll('li');
        
        // Remove selected class from all options
        options.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to the option
        option.classList.add('selected');
        
        // Update button text with icon
        this.selectedValue.innerHTML = option.innerHTML;
        
        // Don't trigger callbacks or events in silent mode
    }
    
    addOption(value, text, icon = null) {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = value;
        
        if (icon) {
            li.innerHTML = `${icon} ${text}`;
        } else {
            li.textContent = text;
        }
        
        // Add event listener
        li.addEventListener('click', (e) => {
            e.stopPropagation();
            const options = this.dropdown.querySelectorAll('li');
            const index = Array.from(options).indexOf(li);
            this.selectOption(li, index);
        });
        
        // Add to dropdown
        this.dropdown.appendChild(li);
    }
    
    clearOptions() {
        // Clear all options completely
        this.dropdown.innerHTML = '';
    }
    
    onChange(callback) {
        this.onChangeCallback = callback;
    }
    
    destroy() {
        // Remove event listeners and cleanup
        this.container.removeEventListener('click', this.toggleDropdown);
        document.removeEventListener('click', this.setupClickOutside);
        
        // Remove this instance from the static array
        const index = CustomDropdown.instances.indexOf(this);
        if (index > -1) {
            CustomDropdown.instances.splice(index, 1);
        }
    }
    
    // Static method to close all dropdowns except the specified one
    static closeAllExcept(exceptDropdown = null) {
        CustomDropdown.instances.forEach(dropdown => {
            if (dropdown !== exceptDropdown && dropdown.isOpen) {
                dropdown.closeDropdown();
            }
        });
    }
    
    // Static method to close all dropdowns
    static closeAll() {
        CustomDropdown.instances.forEach(dropdown => {
            if (dropdown.isOpen) {
                dropdown.closeDropdown();
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomDropdown;
} else {
    window.CustomDropdown = CustomDropdown;
}