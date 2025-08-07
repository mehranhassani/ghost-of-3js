class UISystem {
    constructor() {
        this.elements = {};
        this.quests = [];
        this.inventory = [];
        this.isInventoryOpen = false;
        this.isQuestLogOpen = false;
        
        this.initializeElements();
        this.initializeInventory();
    }

    initializeElements() {
        this.elements = {
            healthBar: document.getElementById('health-fill'),
            minimap: document.getElementById('minimap'),
            inventory: document.getElementById('inventory'),
            questLog: document.getElementById('quest-log'),
            inventoryGrid: document.getElementById('inventory-grid'),
            questList: document.getElementById('quest-list')
        };

        this.minimapCtx = this.elements.minimap.getContext('2d');
    }

    initializeInventory() {
        // Create inventory slots
        for (let i = 0; i < 24; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            slot.addEventListener('click', (e) => this.handleInventoryClick(e, i));
            this.elements.inventoryGrid.appendChild(slot);
        }

        // Initialize with some starting items
        this.addItem({ id: 'katana', name: 'Katana', type: 'weapon', icon: '⚔️' });
        this.addItem({ id: 'health_potion', name: 'Health Potion', type: 'consumable', icon: '🧪' });
    }

    updateHealth(currentHealth, maxHealth) {
        const percentage = (currentHealth / maxHealth) * 100;
        this.elements.healthBar.style.width = `${percentage}%`;
        
        // Change color based on health level
        if (percentage > 60) {
            this.elements.healthBar.style.background = 'linear-gradient(90deg, #44ff44, #66ff66)';
        } else if (percentage > 30) {
            this.elements.healthBar.style.background = 'linear-gradient(90deg, #ffaa44, #ffcc66)';
        } else {
            this.elements.healthBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
        }
    }

    updateMinimap(playerPos, worldData = null) {
        const ctx = this.minimapCtx;
        const size = 150;
        
        // Clear canvas
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, size, size);
        
        // Draw terrain (if world data available)
        if (worldData) {
            ctx.fillStyle = '#4a7c59';
            ctx.fillRect(10, 10, 130, 130);
        }
        
        // Draw player dot
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(size/2, size/2, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw player direction
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size/2, size/2);
        ctx.lineTo(size/2 + Math.sin(playerPos.rotation || 0) * 10, 
                   size/2 - Math.cos(playerPos.rotation || 0) * 10);
        ctx.stroke();
    }

    updateQuests(quests) {
        this.quests = quests;
        this.renderQuests();
    }

    renderQuests() {
        this.elements.questList.innerHTML = '';
        
        this.quests.forEach(quest => {
            const questElement = document.createElement('div');
            questElement.className = 'quest-item';
            questElement.innerHTML = `
                <div class="quest-title">${quest.title}</div>
                <div class="quest-description">${quest.description}</div>
                <div class="quest-progress">${quest.progress}/${quest.maxProgress}</div>
            `;
            this.elements.questList.appendChild(questElement);
        });
    }

    addItem(item) {
        // Find empty slot
        for (let i = 0; i < 24; i++) {
            if (!this.inventory[i]) {
                this.inventory[i] = item;
                this.updateInventorySlot(i, item);
                return true;
            }
        }
        return false; // Inventory full
    }

    removeItem(slotIndex) {
        if (this.inventory[slotIndex]) {
            this.inventory[slotIndex] = null;
            this.updateInventorySlot(slotIndex, null);
            return true;
        }
        return false;
    }

    updateInventorySlot(index, item) {
        const slot = this.elements.inventoryGrid.children[index];
        if (item) {
            slot.textContent = item.icon || '📦';
            slot.title = item.name;
            slot.classList.add('occupied');
        } else {
            slot.textContent = '';
            slot.title = '';
            slot.classList.remove('occupied');
        }
    }

    handleInventoryClick(event, slotIndex) {
        const item = this.inventory[slotIndex];
        if (item && item.type === 'consumable') {
            // Use consumable item
            this.useItem(slotIndex);
        }
    }

    useItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item) return;

        switch (item.id) {
            case 'health_potion':
                // Heal player (this would be handled by player system)
                console.log('Used health potion!');
                this.removeItem(slotIndex);
                break;
        }
    }

    toggleInventory() {
        this.isInventoryOpen = !this.isInventoryOpen;
        if (this.isInventoryOpen) {
            this.elements.inventory.classList.remove('hidden');
            // Close quest log if open
            this.elements.questLog.classList.add('hidden');
            this.isQuestLogOpen = false;
        } else {
            this.elements.inventory.classList.add('hidden');
        }
    }

    toggleQuestLog() {
        this.isQuestLogOpen = !this.isQuestLogOpen;
        if (this.isQuestLogOpen) {
            this.elements.questLog.classList.remove('hidden');
            // Close inventory if open
            this.elements.inventory.classList.add('hidden');
            this.isInventoryOpen = false;
        } else {
            this.elements.questLog.classList.add('hidden');
        }
    }

    handleClick(event) {
        // Check if click is on UI elements
        const target = event.target;
        
        // If clicking on inventory or quest log, don't propagate
        if (target.closest('#inventory') || target.closest('#quest-log')) {
            event.stopPropagation();
            return true;
        }
        
        return false;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: #d4af37;
            padding: 15px 25px;
            border-radius: 5px;
            border: 1px solid #d4af37;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateQuestProgress(questId, progress) {
        const quest = this.quests.find(q => q.id === questId);
        if (quest) {
            quest.progress = Math.min(progress, quest.maxProgress);
            
            if (quest.progress >= quest.maxProgress) {
                this.showNotification(`Quest Complete: ${quest.title}`, 'success');
                // Handle quest rewards
                this.handleQuestReward(quest);
            }
            
            this.renderQuests();
        }
    }

    handleQuestReward(quest) {
        if (quest.reward.xp) {
            this.showNotification(`+${quest.reward.xp} XP`, 'xp');
        }
        if (quest.reward.gold) {
            this.showNotification(`+${quest.reward.gold} Gold`, 'gold');
        }
        if (quest.reward.item) {
            // Add item to inventory
            const item = this.getItemById(quest.reward.item);
            if (item && this.addItem(item)) {
                this.showNotification(`Received: ${item.name}`, 'item');
            }
        }
    }

    getItemById(id) {
        const items = {
            'wind_charm': { id: 'wind_charm', name: 'Wind Charm', type: 'accessory', icon: '🍃' },
            'ancient_scroll': { id: 'ancient_scroll', name: 'Ancient Scroll', type: 'quest', icon: '📜' },
            'bamboo_flute': { id: 'bamboo_flute', name: 'Bamboo Flute', type: 'tool', icon: '🎋' }
        };
        return items[id];
    }

    update(player, deltaTime) {
        if (player) {
            // Update health
            this.updateHealth(player.health, player.maxHealth);
            
            // Update minimap
            this.updateMinimap({
                x: player.position.x,
                z: player.position.z,
                rotation: player.rotation
            });
        }
    }
}

// Make UISystem class available globally
window.UISystem = UISystem;
console.log('UISystem class loaded and available globally');
