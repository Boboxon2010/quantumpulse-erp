// QuantumPulse - Enterprise Core Engine v3.0 (Ultimate Real-Time Cloud Sync Edition)

const GH_CONFIG = {
    username: "Boboxon2010",
    repo: "quantumpulse-erp",
    token: "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",
    filename: "database.json"
};

(function() {
    // 1. SAFETY & AUTH GUARD
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
    const isLoggedIn = localStorage.getItem('qp_is_logged_in') === 'true';
    if (!localStorage.getItem('qp_auth_config') && !isAuthPage) { window.location.href = "register.html"; return; }
    if (!isLoggedIn && !isAuthPage) { window.location.href = "login.html"; return; }

    // Inactivity Timeout (5 minut harakatsizlikdan keyin logout)
    let timeoutTime;
    function resetTimer() {
        clearTimeout(timeoutTime);
        timeoutTime = setTimeout(() => {
            if (isLoggedIn && !isAuthPage) {
                localStorage.removeItem('qp_is_logged_in');
                alert("🔒 Xavfsizlik yuzasidan: Tizimda 5 daqiqa harakat bo'lmagani uchun sessiya yopildi.");
                window.location.href = "login.html";
            }
        }, 300000);
    }
    if(!isAuthPage) {
        window.onload = resetTimer; window.onmousemove = resetTimer; window.onmousedown = resetTimer;
        window.onclick = resetTimer; window.onkeydown = resetTimer;
    }

    // 2. TOAST NOTIFICATION ENGINE
    window.showToast = function(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = "position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;";
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        const colors = { success: '#00e676', warning: '#ffb300', error: '#ff4b4b', info: '#00f2fe' };
        toast.className = 'glass-panel';
        toast.style.cssText = `padding:15px 25px; border-radius:12px; color:#fff; font-size:14px; font-weight:600; border-left:5px solid ${colors[type]}; background:rgba(10,14,35,0.9); backdrop-filter:blur(10px); box-shadow:0 10px 30px rgba(0,0,0,0.5); opacity:0; transform:translateX(50px); transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);`;
        toast.innerHTML = `<i class="fa-solid ${type==='success'?'fa-circle-check':type==='warning'?'fa-triangle-exclamation':'fa-circle-xmark'}"></i> ${message}`;
        container.appendChild(toast);
        
        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; }, 50);
        setTimeout(() => {
            toast.style.opacity = '0'; toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    };

    // 3. GLOBAL LOGGERS & AUDIO
    window.logSystemActivity = function(action) {
        let logs = JSON.parse(localStorage.getItem('qp_activity_logs')) || [];
        logs.unshift({ time: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(), action });
        localStorage.setItem('qp_activity_logs', JSON.stringify(logs.slice(0, 50)));
    };

    window.playSystemSound = function(type) {
        const cfg = JSON.parse(localStorage.getItem('qp_auth_config'));
        if (cfg && cfg.soundNotifications === false) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(type === 'success' ? 880 : type === 'error' ? 220 : 550, ctx.currentTime);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            osc.start(); osc.stop(ctx.currentTime + 0.08);
        } catch(e){}
    };

    // 4. GLOBAL REAL-TIME CLOUD SYNC ENGINE (GitHub Database Connector)
    window.syncDataToGitHub = async function() {
        window.showToast("Cloud sinxronizatsiya boshlandi...", "info");
        
        const currentData = {
            customers: JSON.parse(localStorage.getItem('qp_customers')) || [],
            inventory: JSON.parse(localStorage.getItem('qp_inventory')) || [],
            config: JSON.parse(localStorage.getItem('qp_auth_config')) || {},
            logs: JSON.parse(localStorage.getItem('qp_activity_logs')) || []
        };

        const url = `https://api.github.com/repos/${GH_CONFIG.username}/${GH_CONFIG.repo}/contents/${GH_CONFIG.filename}`;
        
        try {
            let sha = "";
            const getRes = await fetch(url, {
                headers: { "Authorization": `token ${GH_CONFIG.token}` }
            });
            
            if (getRes.status === 200) {
                const fileData = await getRes.json();
                sha = fileData.sha;
            }

            const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(currentData, null, 2))));

            const putRes = await fetch(url, {
                method: "PUT",
                headers: {
                    "Authorization": `token ${GH_CONFIG.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: "⚡ Cloud-Sync: Foydalanuvchi ma'lumotlarni tahrirladi",
                    content: contentBase64,
                    sha: sha
                })
            });

            if (putRes.status === 200 || putRes.status === 201) {
                window.showToast("Barcha o'zgarishlar GitHub bulutli bazasiga saqlandi!", "success");
                window.logSystemActivity("Global ma'lumotlar bazasi GitHub bilan sinxronlandi");
            } else {
                throw new Error("GitHub API ulanishda xato.");
            }
        } catch (error) {
            console.error(error);
            window.showToast("Sinxronizatsiya muvaffaqiyatsiz yakunlandi", "error");
        }
    };

    window.loadDataFromGitHub = async function() {
        const url = `https://api.github.com/repos/${GH_CONFIG.username}/${GH_CONFIG.repo}/contents/${GH_CONFIG.filename}`;
        try {
            const res = await fetch(url, {
                headers: { "Authorization": `token ${GH_CONFIG.token}` }
            });
            if (res.status === 200) {
                const fileData = await res.json();
                const decodedData = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
                
                if(decodedData.customers) localStorage.setItem('qp_customers', JSON.stringify(decodedData.customers));
                if(decodedData.inventory) localStorage.setItem('qp_inventory', JSON.stringify(decodedData.inventory));
                if(decodedData.logs) localStorage.setItem('qp_activity_logs', JSON.stringify(decodedData.logs));
                
                console.log("🟢 GitHub Cloud Database yuklandi va sinxronlandi.");
            }
        } catch (e) {
            console.log("🔴 Bulutli bazadan yuklashda xatolik.");
        }
    };

    // 5. GLOBAL INTERACTIVE WRAPPER (Boshqa sahifalar uchun oson funksiya)
    window.saveAndCloudSync = function(storageKey, dataArray) {
        localStorage.setItem(storageKey, JSON.stringify(dataArray));
        window.syncDataToGitHub();
    };

    // CSS variables inject
    const config = JSON.parse(localStorage.getItem('qp_auth_config')) || {};
    document.documentElement.style.setProperty('--neon-cyan', config.themeCyan || '#00f2fe');
    document.documentElement.style.setProperty('--neon-purple', config.themePurple || '#4facfe');

    window.onerror = function(msg, url, line) {
        window.logSystemActivity(`⚠️ Xatolik: ${msg} (Satr: ${line})`);
        return false;
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    // Bulutli bazani ochilishda yuklash
    window.loadDataFromGitHub();

    const config = JSON.parse(localStorage.getItem('qp_auth_config')) || {};
    
    // Multi-Currency Converter
    window.formatCurrency = function(amount) {
        const curr = config.selectedCurrency || 'USD';
        const rates = { 'USD': 1, 'UZS': 13000, 'EUR': 0.92 };
        const converted = amount * rates[curr];
        if(curr === 'UZS') return converted.toLocaleString('uz-UZ') + " UZS";
        if(curr === 'EUR') return "€" + converted.toFixed(2);
        return "$" + converted.toLocaleString();
    };

    // UI Clock
    const timeDisplay = document.getElementById('live-time');
    if (timeDisplay) {
        function updateTime() { timeDisplay.textContent = new Date().toTimeString().split(' ')[0]; }
        setInterval(updateTime, 1000); updateTime();
    }

    // Ctrl + K Terminal Command Palette
    let paletteHTML = `
        <div id="command-palette" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(5,7,18,0.85); backdrop-filter:blur(10px); z-index:10000; display:none; justify-content:center; align-items:flex-start; padding-top:100px;">
            <div class="glass-panel" style="width:100%; max-width:600px; padding:20px; border-radius:16px; box-shadow:0 20px 50px rgba(0,242,254,0.15); background:#0a0e23;">
                <div style="display:flex; align-items:center; gap:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; margin-bottom:15px;">
                    <i class="fa-solid fa-terminal" style="color:var(--neon-cyan)"></i>
                    <input type="text" id="palette-input" placeholder="Buyruqni kiriting... (/lock, /sync, /clear-logs, /help)" style="width:100%; background:none; border:none; outline:none; color:#fff; font-size:16px; font-family:monospace;">
                </div>
                <div id="palette-results" style="font-family:monospace; font-size:13px; color:#64748b; max-height:200px; overflow-y:auto; line-height:1.8;">
                    Yordam uchun <b>/help</b> deb yozing. Chiqish uchun 'Esc' bosing.
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', paletteHTML);
    const palette = document.getElementById('command-palette');
    const paletteInput = document.getElementById('palette-input');
    const paletteResults = document.getElementById('palette-results');

    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.style.display = 'flex'; paletteInput.focus(); }
        if (e.key === 'Escape') palette.style.display = 'none';
    });

    paletteInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            const cmd = paletteInput.value.trim().toLowerCase();
            paletteInput.value = "";
            if(cmd === '/lock') { palette.style.display = 'none'; window.triggerEmergencyLock(); }
            else if(cmd === '/sync') { palette.style.display = 'none'; window.syncDataToGitHub(); }
            else if(cmd === '/clear-logs') { localStorage.removeItem('qp_activity_logs'); paletteResults.innerHTML = "Loglar o'chirildi."; }
            else if(cmd === '/help') {
                paletteResults.innerHTML = `/lock - Tizimni bloklash<br>/sync - GitHub buluti bilan majburiy sinxronlash<br>/clear-logs - Tarixni tozalash`;
            } else { paletteResults.innerHTML = "Noma'lum buyruq."; }
        }
    });

    // Emergency Lock Screen (Kill-Switch)
    window.triggerEmergencyLock = function() {
        let lockOverlay = document.createElement('div');
        lockOverlay.id = 'emergency-lock-screen';
        lockOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:#050712; z-index:99999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; font-family:monospace;";
        lockOverlay.innerHTML = `
            <i class="fa-solid fa-shield-alert" style="font-size:70px; color:#ff4b4b; margin-bottom:20px;"></i>
            <h1 style="color:#ff4b4b;">TIZIM MUZLATILDI</h1>
            <input type="password" id="unlock-pass" placeholder="Parolni kiriting" style="padding:12px; background:rgba(255,255,255,0.05); border:1px solid #ff4b4b; border-radius:8px; color:#fff; text-align:center; outline:none; margin-top:15px;">
            <button id="btn-unlock-sys" style="margin-top:15px; padding:10px 20px; background:#ff4b4b; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">TIZIMNI OCHISH</button>
        `;
        document.body.appendChild(lockOverlay);
        document.getElementById('btn-unlock-sys').addEventListener('click', () => {
            if(document.getElementById('unlock-pass').value === config.password) { lockOverlay.remove(); window.showToast("Tizim ochildi", "success"); }
            else { alert("Xato!"); }
        });
    };

    // Floating AI Chat Bot
    let botHTML = `
        <div id="ai-floating-bot" style="position:fixed; bottom:20px; right:20px; z-index:999; display:flex; flex-direction:column; align-items:flex-end;">
            <div id="ai-chat-window" class="glass-panel" style="width:320px; height:400px; display:none; flex-direction:column; margin-bottom:15px; background:rgba(10,14,35,0.95); overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:1px solid var(--neon-cyan);">
                <div style="background:rgba(0,242,254,0.1); padding:15px; font-weight:bold; color:var(--neon-cyan);"><i class="fa-solid fa-brain"></i> Quantum AI Agent</div>
                <div id="chat-messages" style="flex:1; padding:15px; overflow-y:auto; font-size:13px; display:flex; flex-direction:column; gap:10px; color:#fff;">
                    <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:8px; align-self:flex-start;">Tizim ma'lumotlari bulutli bazaga muvaffaqiyatli ulandi. Savolingiz bormi?</div>
                </div>
                <div style="padding:10px; display:flex; gap:8px; border-top:1px solid rgba(255,255,255,0.1);">
                    <input type="text" id="chat-input" placeholder="AIdan so'rash..." style="flex:1; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; padding:6px 10px; outline:none;">
                    <button id="chat-send" style="background:var(--neon-cyan); border:none; padding:5px 12px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
            <button id="ai-bot-trigger" style="width:55px; height:55px; border-radius:50%; background:linear-gradient(135deg, var(--neon-cyan), var(--neon-purple)); border:none; color:#fff; font-size:22px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(0,242,254,0.4);"><i class="fa-solid fa-robot"></i></button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', botHTML);
    const botTrigger = document.getElementById('ai-bot-trigger');
    const chatWin = document.getElementById('ai-chat-window');
    botTrigger.addEventListener('click', () => { chatWin.style.display = chatWin.style.display === 'none' ? 'flex' : 'none'; });
});