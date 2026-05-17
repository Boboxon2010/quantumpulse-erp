/**
 * QuantumPulse ERP - Multi-Workspace Cloud Engine (Google Firebase REST)
 * Release: 2026.SaaS.Production.MultiTenant
 */

const FIREBASE_DB_URL = "https://quantumpulse-erp-default-rtdb.firebaseio.com/"; 

// ==========================================
// SECURITY GATEKEEPER (RUXSATSIZ KIRISHNI BLOKLASH)
// ==========================================
function checkSecurityGate() {
    const activeWorkspace = localStorage.getItem('qp_active_workspace');
    const isLoginPage = window.location.pathname.includes('login.html');

    if (!activeWorkspace && !isLoginPage) {
        // Agar login qilmagan bo'lsa va login sahifasida bo'lmasa -> Kirish oynasiga majburlab haydash
        window.location.href = "login.html";
    }
}
// Sahifa yuklanishi bilanoq srazi tekshirish
checkSecurityGate();

// Faol Workspace ID ni olish
const getWorkspacePath = () => {
    const ws = localStorage.getItem('qp_active_workspace') || 'public_default';
    return `workspaces/${ws}/erp_data.json`;
};

// ==========================================
// 1. GLOBAL VALYUTA VA FORMATLASH TIZIMI
// ==========================================
window.formatCurrency = function(val) {
    const currency = localStorage.getItem('qp_currency') || 'USD';
    const rate = parseFloat(localStorage.getItem('qp_exchange_rate')) || 1.0;
    const converted = val * rate;

    if (currency === 'UZS') {
        return (converted * 12600).toLocaleString('uz-UZ') + " SO'M";
    }
    return "$" + converted.toLocaleString('en-US');
};

// ==========================================
// 2. SISTEMA TERMINALI VA LOGLARINI YURITISH
// ==========================================
window.logSystemActivity = function(message) {
    let logs = JSON.parse(localStorage.getItem('qp_system_logs')) || [];
    const timestamp = new Date().toLocaleTimeString();
    
    logs.unshift(`[${timestamp}] ${message}`);
    if(logs.length > 15) logs.pop();
    
    localStorage.setItem('qp_system_logs', JSON.stringify(logs));
    window.dispatchEvent(new Event('storage_logs_updated'));
};

// ==========================================
// 3. SEPARATED CLOUD PUSH (Faqat shaxsiy Workspace'ga yozadi)
// ==========================================
window.saveAndCloudSync = async function(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('local_data_changed'));

    try {
        const updatedDatabase = {
            inventory: key === 'qp_inventory' ? data : (JSON.parse(localStorage.getItem('qp_inventory')) || []),
            customers: key === 'qp_customers' ? data : (JSON.parse(localStorage.getItem('qp_customers')) || []),
            transactions: key === 'qp_transactions' ? data : (JSON.parse(localStorage.getItem('qp_transactions')) || []),
            last_updated: new Date().toISOString(),
            workspace_owner: localStorage.getItem('qp_username') || 'Admin'
        };

        // Faqat shu adminning shaxsiy bo'limiga yoziladi (Birovniki aralashmaydi)
        const response = await fetch(`${FIREBASE_DB_URL}${getWorkspacePath()}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedDatabase)
        });

        if (response.ok) {
            console.log(`⚡ Shaxsiy Workspace [${localStorage.getItem('qp_active_workspace')}] yangilandi.`);
        }
    } catch (err) {
        console.error("Cloud ulanishda xatolik:", err);
    }
};

// ==========================================
// 4. SEPARATED CLOUD FETCH (Faqat shaxsiy Workspace'dan o'qiydi)
// ==========================================
window.loadDataFromGitHub = async function() {
    const activeWorkspace = localStorage.getItem('qp_active_workspace');
    if (!activeWorkspace) return null;

    try {
        const res = await fetch(`${FIREBASE_DB_URL}${getWorkspacePath()}`, {
            method: "GET"
        });

        if (res.status === 200) {
            const db = await res.json();

            if (db) {
                if (db.inventory) localStorage.setItem('qp_inventory', JSON.stringify(db.inventory));
                if (db.customers) localStorage.setItem('qp_customers', JSON.stringify(db.customers));
                if (db.transactions) localStorage.setItem('qp_transactions', JSON.stringify(db.transactions));
                
                window.dispatchEvent(new Event('local_data_changed'));
                window.dispatchEvent(new Event('storage_logs_updated'));
                return db;
            } else {
                // Agar yangi workspace bo'lsa va ichi bo'sh bo'lsa, eski qoldiqlarni tozalaymiz
                localStorage.removeItem('qp_inventory');
                localStorage.removeItem('qp_customers');
                localStorage.removeItem('qp_transactions');
                window.dispatchEvent(new Event('local_data_changed'));
            }
        }
    } catch (err) {
        console.error("Cloud-dan yuklashda xatolik:", err);
    }
    return null;
};

// ==========================================
// 5. INITIALIZATION DRIVER
// ==========================================
// ==========================================
// 5. INITIALIZATION DRIVER (DASTURNI YONDIRISH)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const timeEl = document.getElementById('live-time');
    if (timeEl) {
        setInterval(() => { timeEl.textContent = new Date().toLocaleTimeString(); }, 1000);
    }
    
    // Faqat tizimga kirilgan bo'lsagina ma'lumot yuklanadi
    if(localStorage.getItem('qp_active_workspace')) {
        window.loadDataFromGitHub();
    }

    // 🚪 CHIQISH TUGMASI DRIVERI (Hamma sahifada avtomat ishlashi uchun)
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Tugmaning inline onclick amalini to'xtatadi
            localStorage.clear(); // Workspace va keshni o'chiradi
            window.location.href = "login.html"; // Login sahifasiga otadi
        });
    }
});