/**
 * QuantumPulse ERP - Google Firebase Realtime Cloud Engine
 * Release: 2026.Production.Firebase.NoToken
 * Author: Boboxon / QuantumPulse Team
 */

// ⚡ Sizning shaxsiy Google Firebase havolaingiz muvaffaqiyatli ulandi!
const FIREBASE_DB_URL = "https://quantumpulse-erp-default-rtdb.firebaseio.com/"; 

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
    
    // Yangi logni ro'yxat boshiga qo'shish
    logs.unshift(`[${timestamp}] ${message}`);
    
    // Loglar soni 15 tadan oshib ketmasligini ta'minlash
    if(logs.length > 15) {
        logs.pop();
    }
    
    localStorage.setItem('qp_system_logs', JSON.stringify(logs));
    
    // Global oyna hodisasini ishga tushirish (Bosh sahifa srazi yangilanishi uchun)
    window.dispatchEvent(new Event('storage_logs_updated'));
};

// ==========================================
// 3. GOOGLE BULUTIGA AVTOMAT SYNCHRONIZATION (PUT)
// ==========================================
window.saveAndCloudSync = async function(key, data) {
    // 1-bosqich: Mahalliy xotirani (LocalStorage) srazi yangilaymiz (Tezkorlik uchun)
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('local_data_changed'));

    try {
        // 2-bosqich: Boshqa modullarning ma'lumotlarini ham buzib qo'ymaslik uchun hammasini bitta paketga yig'amiz
        const updatedDatabase = {
            inventory: key === 'qp_inventory' ? data : (JSON.parse(localStorage.getItem('qp_inventory')) || []),
            customers: key === 'qp_customers' ? data : (JSON.parse(localStorage.getItem('qp_customers')) || []),
            transactions: key === 'qp_transactions' ? data : (JSON.parse(localStorage.getItem('qp_transactions')) || []),
            last_updated: new Date().toISOString()
        };

        // 3-bosqich: Firebase REST API orqali ruxsatnomalarsiz va tokensiz ma'lumotni saqlash
        const response = await fetch(`${FIREBASE_DB_URL}erp_data.json`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(updatedDatabase)
        });

        if (response.ok) {
            console.log("⚡ Google Cloud Sync: Muvaffaqiyatli bajarildi.");
            if (typeof window.showNotification === 'function') {
                window.showNotification("Bulut bilan sinxronizatsiya bajarildi!", "success");
            }
        } else {
            console.error("Google Firebase sinxronizatsiyada xatolik yuz berdi:", response.statusText);
        }

    } catch (err) {
        console.error("Google Cloud ulanish shinasida xatolik:", err);
    }
};

// ==========================================
// 4. GOOGLE BULUTIDAN MA'LUMOTLARNI YUKLASH (GET)
// ==========================================
window.loadDataFromGitHub = async function() {
    try {
        const res = await fetch(`${FIREBASE_DB_URL}erp_data.json`, {
            method: "GET"
        });

        if (res.status === 200) {
            const db = await res.json();

            // Agar bazada ma'lumot bo'lsa, ularni mahalliy xotiraga o'zlashtiramiz
            if (db) {
                if (db.inventory) localStorage.setItem('qp_inventory', JSON.stringify(db.inventory));
                if (db.customers) localStorage.setItem('qp_customers', JSON.stringify(db.customers));
                if (db.transactions) localStorage.setItem('qp_transactions', JSON.stringify(db.transactions));
                
                // Sahifadagi UI elementlarni qayta chizish uchun trigger
                window.dispatchEvent(new Event('local_data_changed'));
                window.dispatchEvent(new Event('storage_logs_updated'));
                return db;
            }
        }
    } catch (err) {
        console.error("Google Cloud-dan ma'lumotlarni tortishda xatolik:", err);
    }
    return null;
};

// ==========================================
// 5. INITIALIZATION DRIVER (DASTURNI YONDIRISH)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Real-time dinamik soat drayveri
    const timeEl = document.getElementById('live-time');
    if (timeEl) {
        setInterval(() => { 
            timeEl.textContent = new Date().toLocaleTimeString(); 
        }, 1000);
    }
    
    // Foydalanuvchi tizimga kirishi bilan srazi Google Cloud-dan ma'lumotlar zanjirini yuklab olish
    window.loadDataFromGitHub();
});