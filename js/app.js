/**
 * QuantumPulse ERP - Core Cloud Sync Engine
 * Release: 2026.Universal.Production
 */

const GITHUB_REPO = "Boboxon2010/quantumpulse-erp";
const DATABASE_FILE = "database.json";

// Tizim holatini tekshirish
let isSyncing = false;

// 1. GLOBAL VALYUTA VA FORMATLASH TIZIMI
window.formatCurrency = function(val) {
    const currency = localStorage.getItem('qp_currency') || 'USD';
    const rate = parseFloat(localStorage.getItem('qp_exchange_rate')) || 1.0;
    const converted = val * rate;

    if (currency === 'UZS') {
        return (converted * 12600).toLocaleString('uz-UZ') + " SO'M";
    }
    return "$" + converted.toLocaleString('en-US');
};

// 2. SISTEMA TERMINALI VA LOGLARINI YURITISH
window.logSystemActivity = function(message) {
    let logs = JSON.parse(localStorage.getItem('qp_system_logs')) || [];
    const timestamp = new Date().toLocaleTimeString();
    logs.unshift(`[${timestamp}] ${message}`);
    if(logs.length > 30) logs.pop(); // Max 30 log
    localStorage.setItem('qp_system_logs', JSON.stringify(logs));
    
    // Terminal ochiq bo'lsa srazi yangilash
    window.dispatchEvent(new Event('storage_logs_updated'));
};

// 3. TOKEN BILAN ISHLASH (XAVFSIZLIK)
function getSecureToken() {
    let token = localStorage.getItem('qp_secure_token');
    if (!token) {
        const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
        if (!isAuthPage) {
            token = prompt("⚠️ QuantumPulse Xavfsizlik tizimi:\nIltimos, GitHub PAT tokeningizni kiriting (ghp_...):");
            if (token && token.startsWith('ghp_')) {
                localStorage.setItem('qp_secure_token', token);
                showNotification("Token saqlandi va tizim xavfsizligi faollashdi!", "success");
            } else {
                alert("Noto'g'ri token! Tizim oflayn rejimda ishlaydi.");
            }
        }
    }
    return token;
}

// 4. UNIFIED CLOUD PUSH (Hamma ma'lumotni bitta faylga yig'ib yuborish)
window.saveAndCloudSync = async function(key, data) {
    // Avval mahalliy xotirani yangilaymiz
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('local_data_changed'));

    const token = getSecureToken();
    if (!token || isSyncing) return;

    isSyncing = true;
    showNotification("Bulut sinxronizatsiyasi boshlandi...", "info");

    try {
        // GitHub'dagi fayl holatini va SHA kalitini olamiz
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${DATABASE_FILE}`;
        let sha = null;
        let currentCloudData = {};

        const getRes = await fetch(url, {
            headers: { "Authorization": `token ${token}` }
        });

        if (getRes.status === 200) {
            const getJson = await getRes.json();
            sha = getJson.sha;
            const content = decodeURIComponent(escape(atob(getJson.content)));
            currentCloudData = JSON.parse(content);
        }

        // Strukturani bitta butun faylga jamlaymiz (Barcha sahifalar ma'lumotlari buzilmasligi uchun)
        const updatedDatabase = {
            inventory: key === 'qp_inventory' ? data : (currentCloudData.inventory || JSON.parse(localStorage.getItem('qp_inventory')) || []),
            customers: key === 'qp_customers' ? data : (currentCloudData.customers || JSON.parse(localStorage.getItem('qp_customers')) || []),
            transactions: key === 'qp_transactions' ? data : (currentCloudData.transactions || JSON.parse(localStorage.getItem('qp_transactions')) || []),
            last_updated: new Date().toISOString(),
            updated_by: localStorage.getItem('qp_username') || "Quantum_User"
        };

        // GitHub API orqali PUT (Upload) so'rovi
        const putRes = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `ERP Data Sync: Updated via Core Engine [${key}]`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(updatedDatabase, null, 2)))),
                sha: sha
            })
        });

        if (putRes.status === 200 || putRes.status === 201) {
            showNotification("GitHub bulutli bazasiga saqlandi!", "success");
        } else {
            throw new Error("GitHub API error status: " + putRes.status);
        }

    } catch (err) {
        console.error("Cloud Sync Failed:", err);
        showNotification("Sinxronizatsiyada xatolik yuz berdi!", "error");
    } finally {
        isSyncing = false;
    }
};

// 5. UNIFIED CLOUD FETCH (Bulutdan hamma narsani tortib olish)
window.loadDataFromGitHub = async function() {
    const token = localStorage.getItem('qp_secure_token');
    if (!token) return;

    try {
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${DATABASE_FILE}`;
        const res = await fetch(url, {
            headers: { "Authorization": `token ${token}` }
        });

        if (res.status === 200) {
            const json = await res.json();
            const content = decodeURIComponent(escape(atob(json.content)));
            const db = JSON.parse(content);

            if (db.inventory) localStorage.setItem('qp_inventory', JSON.stringify(db.inventory));
            if (db.customers) localStorage.setItem('qp_customers', JSON.stringify(db.customers));
            if (db.transactions) localStorage.setItem('qp_transactions', JSON.stringify(db.transactions));
            
            showNotification("Bulutli ma'lumotlar muvaffaqiyatli yangilandi!", "success");
            return db;
        }
    } catch (err) {
        console.error("Fetch failed:", err);
    }
    return null;
};

// 6. DASTUR ICHIDAGI NAVIGATSIYA VA NOTIFICATION DIZAYNI
function showNotification(text, type = "info") {
    let container = document.getElementById('qp-notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'qp-notification-container';
        container.style.cssText = "position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;";
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    let color = "var(--neon-cyan, #00f2fe)";
    if(type === 'success') color = "#00e676";
    if(type === 'error') color = "#ff4b4b";

    toast.style.cssText = `background:rgba(10,15,30,0.85); border:1px solid ${color}; color:#fff; padding:12px 25px; border-radius:8px; font-size:13px; font-family:sans-serif; box-shadow:0 0 15px ${color}33; backdrop-filter:blur(10px); animation: slideIn 0.3s forwards;`;
    toast.innerHTML = text;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "slideOut 0.3s forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Favqulodda Oyna / Terminal buyruqlari (Ctrl + K)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const cmd = prompt("⌨️ QuantumPulse Terminal Buyrug'i:\n⚡ [/update-token] - Tokenni yangilash\n🔒 [/lock] - ERPni bloklash");
        if (cmd === '/update-token') {
            localStorage.removeItem('qp_secure_token');
            getSecureToken();
        } else if (cmd === '/lock') {
            alert("Tizim favqulodda qulflandi!");
            window.location.href = "login.html";
        }
    }
});

// Real-time soat mexanizmi
document.addEventListener('DOMContentLoaded', () => {
    const timeEl = document.getElementById('live-time');
    if (timeEl) {
        setInterval(() => {
            timeEl.textContent = new Date().toLocaleTimeString();
        }, 1000);
    }
    
    // Birinchi marta kirganda avtomat tokenni tekshirish
    setTimeout(getSecureToken, 1000);
});

// CSS animatsiyalarini yuklash
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn { from { transform: translateX(120%); } to { transform: translateX(0); } }
@keyframes slideOut { from { transform: translateX(0); } to { transform: translateX(120%); } }
`;
document.head.appendChild(style);