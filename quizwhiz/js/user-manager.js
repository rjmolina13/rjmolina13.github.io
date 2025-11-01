/**
 * User Manager - Handles user profile, avatar, and settings
 */
class UserManager {
    constructor() {
        this.currentUser = null;
        this.avatars = this.generateAvatars();
        this.init();
    }

    init() {
        this.loadUser();
        this.setupEventListeners();
    }

    generateAvatars() {
        // Colors aligned with webapp's design system
        const colors = [
            '#6366f1', // Primary color
            '#8b5cf6', // Secondary color
            '#10b981', // Success color
            '#3b82f6', // Info color
            '#f59e0b', // Warning color
            '#ef4444', // Error color
            '#5856eb', // Primary dark
            '#06b6d4', // Cyan
            '#8b5a2b', // Brown
            '#7c3aed', // Violet
            '#059669', // Emerald
            '#dc2626', // Red
            '#2563eb', // Blue
            '#7c2d12', // Orange dark
            '#4338ca'  // Indigo
        ];
        
        // Light backgrounds that complement the colors
        const backgrounds = [
            '#eef2ff', // Primary light
            '#f3e8ff', // Secondary light
            '#d1fae5', // Success light
            '#dbeafe', // Info light
            '#fef3c7', // Warning light
            '#fee2e2', // Error light
            '#e0e7ff', // Primary dark light
            '#cffafe', // Cyan light
            '#fef7ed', // Brown light
            '#ede9fe', // Violet light
            '#ecfdf5', // Emerald light
            '#fef2f2', // Red light
            '#eff6ff', // Blue light
            '#fff7ed', // Orange light
            '#eef2ff'  // Indigo light
        ];

        const icons = [
            'fa-user', 'fa-user-astronaut', 'fa-user-ninja', 'fa-user-graduate',
            'fa-user-tie', 'fa-user-secret', 'fa-robot', 'fa-cat',
            'fa-dog', 'fa-dragon', 'fa-fish', 'fa-frog', 'fa-hippo',
            'fa-horse', 'fa-kiwi-bird'
        ];

        return Array.from({ length: 15 }, (_, i) => ({
            id: i + 1,
            icon: icons[i % icons.length],
            color: colors[i % colors.length],
            background: backgrounds[i % backgrounds.length]
        }));
    }

    loadUser() {
        const userData = localStorage.getItem('quizwhiz_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        } else {
            // First visit - create default user
            this.currentUser = {
                username: 'User',
                avatar: this.avatars[0],
                isFirstVisit: true,
                createdAt: new Date().toISOString()
            };
            this.saveUser();
            this.showWelcomeModal();
        }
        this.updateUserDisplay();
    }

    saveUser() {
        localStorage.setItem('quizwhiz_user', JSON.stringify(this.currentUser));
    }

    updateUsername(newUsername) {
        if (newUsername && newUsername.trim()) {
            this.currentUser.username = newUsername.trim();
            this.currentUser.isFirstVisit = false;
            this.saveUser();
            this.updateUserDisplay();
            return true;
        }
        return false;
    }

    updateAvatar(avatarId) {
        const avatar = this.avatars.find(a => a.id === avatarId);
        if (avatar) {
            this.currentUser.avatar = avatar;
            this.saveUser();
            this.updateUserDisplay();
            return true;
        }
        return false;
    }

    updateUserDisplay() {
        const userAvatar = document.getElementById('user-avatar');
        const userAvatarDisplay = document.getElementById('user-avatar-display');
        const userName = document.getElementById('user-name');
        
        if (userAvatar && this.currentUser) {
            const avatar = this.currentUser.avatar;
            userAvatar.innerHTML = `
                <i class="fas ${avatar.icon}" style="color: ${avatar.color};"></i>
            `;
            userAvatar.style.backgroundColor = avatar.background;
        }
        
        if (userAvatarDisplay && this.currentUser) {
            const avatar = this.currentUser.avatar;
            userAvatarDisplay.innerHTML = `
                <i class="fas ${avatar.icon}" style="color: ${avatar.color};"></i>
            `;
            userAvatarDisplay.style.backgroundColor = avatar.background;
        }
        
        if (userName && this.currentUser) {
            userName.textContent = this.currentUser.username;
        }
    }

    async showWelcomeModal() {
        // Load modals if not already loaded
        await this.loadModals();
        
        // Show welcome modal on first visit
        setTimeout(() => {
            if (typeof app !== 'undefined' && app.uiManager) {
                app.uiManager.openModal('welcome-modal');
            }
        }, 1000);
    }

    async showProfileModal() {
        // Load modals if not already loaded
        await this.loadModals();
        
        if (typeof app !== 'undefined' && app.uiManager) {
            this.populateAvatarGrid();
            this.populateProfileForm();
            app.uiManager.openModal('profile-modal');
        }
    }

    populateAvatarGrid() {
        const avatarGrid = document.getElementById('avatar-grid');
        if (!avatarGrid) return;

        avatarGrid.innerHTML = this.avatars.map(avatar => `
            <div class="avatar-option ${this.currentUser.avatar.id === avatar.id ? 'selected' : ''}" 
                 data-avatar-id="${avatar.id}" 
                 style="background-color: ${avatar.background};">
                <i class="fas ${avatar.icon}" style="color: ${avatar.color};"></i>
            </div>
        `).join('');

        // Add click listeners to avatar options
        avatarGrid.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                const avatarId = parseInt(option.dataset.avatarId);
                this.selectAvatar(avatarId);
            });
        });
    }

    selectAvatar(avatarId) {
        // Update selection in grid
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-avatar-id="${avatarId}"]`).classList.add('selected');
        
        // Update preview
        const avatar = this.avatars.find(a => a.id === avatarId);
        const previewAvatar = document.getElementById('preview-avatar');
        if (previewAvatar && avatar) {
            previewAvatar.innerHTML = `<i class="fas ${avatar.icon}" style="color: ${avatar.color};"></i>`;
            previewAvatar.style.backgroundColor = avatar.background;
        }
    }

    saveProfile() {
        const usernameInput = document.getElementById('profile-username');
        const selectedAvatar = document.querySelector('.avatar-option.selected');
        
        if (usernameInput && selectedAvatar) {
            const newUsername = usernameInput.value.trim();
            const avatarId = parseInt(selectedAvatar.dataset.avatarId);
            
            if (newUsername) {
                this.updateUsername(newUsername);
                this.updateAvatar(avatarId);
                
                if (typeof app !== 'undefined' && app.uiManager) {
                    app.uiManager.closeModal('profile-modal');
                    app.uiManager.showToast('Profile updated successfully!', 'success');
                }
            } else {
                if (typeof app !== 'undefined' && app.uiManager) {
                    app.uiManager.showToast('Please enter a username', 'error');
                }
            }
        }
    }

    setupEventListeners() {
        // Profile modal events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'save-profile-btn') {
                this.saveProfile();
            }
            
            if (e.target.id === 'welcome-continue-btn') {
                const usernameInput = document.getElementById('welcome-username');
                if (usernameInput && usernameInput.value.trim()) {
                    this.updateUsername(usernameInput.value.trim());
                }
                if (typeof app !== 'undefined' && app.uiManager) {
                    app.uiManager.closeModal('welcome-modal');
                }
            }
        });

        // Update profile preview when username changes
        document.addEventListener('input', (e) => {
            if (e.target.id === 'profile-username') {
                const previewName = document.getElementById('preview-username');
                if (previewName) {
                    previewName.textContent = e.target.value.trim() || 'User';
                }
            }
        });
    }

    // Utility methods
    getUser() {
        return this.currentUser;
    }

    resetUser() {
        localStorage.removeItem('quizwhiz_user');
        this.loadUser();
    }
    
    async loadModals() {
        // Check if modals are already loaded
        if (document.getElementById('welcome-modal')) {
            return;
        }
        
        try {
            const response = await fetch('../components/user-modals.html');
            if (response.ok) {
                const modalHTML = await response.text();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = modalHTML;
                
                // Append modals to body
                while (tempDiv.firstChild) {
                    document.body.appendChild(tempDiv.firstChild);
                }
            }
        } catch (error) {
            console.error('Error loading user modals:', error);
        }
    }
    
    populateProfileForm() {
        const usernameInput = document.getElementById('profile-username');
        const previewUsername = document.getElementById('preview-username');
        const previewAvatar = document.getElementById('preview-avatar');
        
        if (usernameInput && this.currentUser) {
            usernameInput.value = this.currentUser.username;
        }
        
        if (previewUsername && this.currentUser) {
            previewUsername.textContent = this.currentUser.username;
        }
        
        if (previewAvatar && this.currentUser) {
            const avatar = this.currentUser.avatar;
            previewAvatar.innerHTML = `<i class="fas ${avatar.icon}" style="color: ${avatar.color};"></i>`;
            previewAvatar.style.backgroundColor = avatar.background;
        }
    }
}

// Initialize user manager when DOM is loaded
if (typeof window !== 'undefined') {
    window.UserManager = UserManager;
}