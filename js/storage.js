// QuantumPulse - Markazlashtirilgan Ma'lumotlar Boshqaruvi (Local State)

const ERPStorage = {
    // Helper to build per-user keys
    _userKey(suffix) {
        const username = localStorage.getItem('qp_username') || 'public_default';
        return `qp_${suffix}::${username}`;
    },

    // Initialize shared defaults (kept global)
    init() {
        if (!localStorage.getItem('qp_defaults_inventory')) {
            const initialInventory = [
                { id: "INV-001", name: "Quantum Processor V1", category: "Tayyor Mahsulotlar", qty: 45, price: 1200, status: "Sotuvda" },
                { id: "INV-002", name: "Graphene Battery Pack", category: "Xomashyo", qty: 120, price: 350, status: "Omborda" },
                { id: "INV-003", name: "Liquid Cooling Unit", category: "Xomashyo", qty: 12, price: 150, status: "Tugayotganlar" },
                { id: "INV-004", name: "Cyber HUD Screen", category: "Tranzitdagi Yuklar", qty: 85, price: 450, status: "Yo'lda" }
            ];
            localStorage.setItem('qp_defaults_inventory', JSON.stringify(initialInventory));
        }

        if (!localStorage.getItem('qp_defaults_customers')) {
            const initialCustomers = [
                { id: "CRM-101", name: "Alexander Wright", email: "alex.wright@cyber.com", history: [5, 25, 46, 65], totalSpent: 4800, tier: "Premium" },
                { id: "CRM-102", name: "Sardor Rahmonov", email: "sardor@dev.io", history: [10, 40, 71], totalSpent: 1200, tier: "Standart" },
                { id: "CRM-103", name: "Jasur Shukurov", email: "jasur@pulse.com", history: [2, 12, 23, 31, 41], totalSpent: 8900, tier: "VIP" }
            ];
            localStorage.setItem('qp_defaults_customers', JSON.stringify(initialCustomers));
        }
    },

    // Return the defaults (global)
    getDefaults(suffix) {
        return JSON.parse(localStorage.getItem(`qp_defaults_${suffix}`) || 'null');
    },

    // Per-user inventory accessors
    getInventory() {
        const key = this._userKey('inventory');
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    saveInventory(data) {
        const key = this._userKey('inventory');
        localStorage.setItem(key, JSON.stringify(data));
    },

    getCustomers() {
        const key = this._userKey('customers');
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    saveCustomers(data) {
        const key = this._userKey('customers');
        localStorage.setItem(key, JSON.stringify(data));
    }
};

// Initialize defaults
ERPStorage.init();