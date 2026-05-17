// QuantumPulse - Markazlashtirilgan Ma'lumotlar Boshqaruvi (Local State)

const ERPStorage = {
    // Boshlang'ich Ma'lumotlar
    init() {
        if (!localStorage.getItem('qp_inventory')) {
            const initialInventory = [
                { id: "INV-001", name: "Quantum Processor V1", category: "Tayyor Mahsulotlar", qty: 45, price: 1200, status: "Sotuvda" },
                { id: "INV-002", name: "Graphene Battery Pack", category: "Xomashyo", qty: 120, price: 350, status: "Omborda" },
                { id: "INV-003", name: "Liquid Cooling Unit", category: "Xomashyo", qty: 12, price: 150, status: "Tugayotganlar" },
                { id: "INV-004", name: "Cyber HUD Screen", category: "Tranzitdagi Yuklar", qty: 85, price: 450, status: "Yo'lda" }
            ];
            localStorage.setItem('qp_inventory', JSON.stringify(initialInventory));
        }

        if (!localStorage.getItem('qp_customers')) {
            const initialCustomers = [
                { id: "CRM-101", name: "Alexander Wright", email: "alex.wright@cyber.com", history: [5, 25, 46, 65], totalSpent: 4800, tier: "Premium" },
                { id: "CRM-102", name: "Sardor Rahmonov", email: "sardor@dev.io", history: [10, 40, 71], totalSpent: 1200, tier: "Standart" },
                { id: "CRM-103", name: "Jasur Shukurov", email: "jasur@pulse.com", history: [2, 12, 23, 31, 41], totalSpent: 8900, tier: "VIP" }
            ];
            localStorage.setItem('qp_customers', JSON.stringify(initialCustomers));
        }
    },

    getInventory() {
        return JSON.parse(localStorage.getItem('qp_inventory'));
    },

    saveInventory(data) {
        localStorage.setItem('qp_inventory', JSON.stringify(data));
    },

    getCustomers() {
        return JSON.parse(localStorage.getItem('qp_customers'));
    },

    saveCustomers(data) {
        localStorage.setItem('qp_customers', JSON.stringify(data));
    }
};

// Tizimni avtomat ishga tushirish
ERPStorage.init();