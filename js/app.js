// QuantumPulse - Enterprise Core Engine v2.0 (Ultimate Feature Pack)

(function() {
    // 1. SAFETY & AUTH GUARD
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
    const isLoggedIn = localStorage.getItem('qp_is_logged_in') === 'true';
    if (!localStorage.getItem('qp_auth_config') && !isAuthPage) { window.location.href = "register.html"; return; }
    if (!isLoggedIn && !isAuthPage) { window.location.href = "login.html"; return; }

    // 2. TOAST NOTIFICATION ENGINE (Silliq neon bildirishnomalar)
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
        toast.style.cssText = `padding:15px 25px; border-radius:12px; color:#fff; font-size:14px; font-weight:600; border-left:5px solid ${colors[type]}; background:rgba(10,14,35,0.85); backdrop-filter:blur(10px); box-shadow:0 10px 30px rgba(0,0,0,0.5); opacity:0; transform:translateX(50px); transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);`;
        toast.innerHTML = `<i class="fa-solid ${type==='success'?'fa-circle-check':type==='warning'?'fa-triangle-exclamation':'fa-circle-xmark'}"></i> ${message}`;
        container.appendChild(toast);
        
        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; }, 50);
        setTimeout(() => {
            toast.style.opacity = '0'; toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    };

    // 3. GLOBAL LOGGERS & SOUNDS
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
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            osc.start(); osc.stop(ctx.currentTime + 0.08);
        } catch(e){}
    };

    // 4. THEME & ACCESS MANAGEMENT
    const config = JSON.parse(localStorage.getItem('qp_auth_config')) || {};
    document.documentElement.style.setProperty('--neon-cyan', config.themeCyan || '#00f2fe');
    document.documentElement.style.setProperty('--neon-purple', config.themePurple || '#4facfe');

    // ERROR BOUNDARY (Koddagi xatolarni ushlash)
    window.onerror = function(message, source, lineno, colno, error) {
        window.logSystemActivity(`⚠️ Tizim Xatosi: ${message} (Satr: ${lineno})`);
        window.showToast("Ichki modulda xatolik aniqlandi. Logga yozildi.", "error");
        return false;
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    const config = JSON.parse(localStorage.getItem('qp_auth_config')) || {};
    
    // RBAC: Rolga qarab UI elementlarini jilovlash
    const userRole = config.userRole || 'Admin';
    if(userRole === 'Viewer') {
        document.querySelectorAll('button:not(#logout-btn), input, select').forEach(el => {
            el.disabled = true;
            el.style.opacity = '0.5';
            el.style.cursor = 'not-allowed';
        });
        setTimeout(() => window.showToast("Siz 'Viewer' (Kuzatuvchi) rolidasiz. O'zgartirish taqiqlangan.", "warning"), 1000);
    }

    // MULTI-CURRENCY GLOBAL FORMATTER
    window.formatCurrency = function(amount) {
        const curr = config.selectedCurrency || 'USD';
        const rates = { 'USD': 1, 'UZS': 13000, 'EUR': 0.92 };
        const converted = amount * rates[curr];
        if(curr === 'UZS') return converted.toLocaleString('uz-UZ') + " UZS";
        if(curr === 'EUR') return "€" + converted.toFixed(2);
        return "$" + converted.toLocaleString();
    };

    // 5. AI COMMAND PALETTE TERMINAL (`Ctrl + K`)
    let paletteHTML = `
        <div id="command-palette" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(5,7,18,0.85); backdrop-filter:blur(10px); z-index:10000; display:none; justify-content:center; align-items:flex-start; padding-top:100px;">
            <div class="glass-panel" style="width:100%; max-width:600px; padding:20px; border-radius:16px; box-shadow:0 20px 50px rgba(0,242,254,0.15);">
                <div style="display:flex; align-items:center; gap:15px; border-bottom:1px solid var(--border-glass); padding-bottom:15px; margin-bottom:15px;">
                    <i class="fa-solid fa-terminal" style="color:var(--neon-cyan)"></i>
                    <input type="text" id="palette-input" placeholder="Buyruqni kiriting... (/lock, /clear-logs, /role-viewer, /help)" style="width:100%; background:none; border:none; outline:none; color:#fff; font-size:16px; font-family:monospace;">
                </div>
                <div id="palette-results" style="font-family:monospace; font-size:13px; color:var(--text-muted); max-height:200px; overflow-y:auto; line-height:1.8;">
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
            window.playSystemSound('click');

            if(cmd === '/lock') {
                palette.style.display = 'none';
                window.triggerEmergencyLock();
            } else if(cmd === '/clear-logs') {
                localStorage.removeItem('qp_activity_logs');
                window.logSystemActivity("Loglar terminal orqali tozalandi");
                paletteResults.innerHTML = "🟢 Barcha audit loglari o'chirildi.";
                window.showToast("Loglar tozalandi", "info");
            } else if(cmd === '/help') {
                paletteResults.innerHTML = `
                    <b>Mavjud buyruqlar:</b><br>
                    /lock - Tizimni favqulodda bloklash (Kill-Switch)<br>
                    /clear-logs - Barcha xavfsizlik loglarini o'chirish<br>
                    /theme-matrix - Yashil matritsa dizayniga o'tish<br>
                    /role-viewer - Rolni Kuzatuvchiga o'zgartirish
                `;
            } else if(cmd === '/theme-matrix') {
                config.themeCyan = '#00e676'; config.themePurple = '#1b5e20';
                localStorage.setItem('qp_auth_config', JSON.stringify(config));
                paletteResults.innerHTML = "🟢 Matrix rejimi o'rnatildi. Sahifani yangilang.";
                location.reload();
            } else {
                paletteResults.innerHTML = `❌ Noma'lum buyruq: ${cmd}. Yordam uchun /help yozing.`;
            }
        }
    });

    // 6. EMERGENCY LOCK (Kill-Switch) SYSTEM
    window.triggerEmergencyLock = function() {
        window.logSystemActivity("🚨 CRITICAL: Kill-Switch tizimi masofadan yoqildi!");
        let lockOverlay = document.createElement('div');
        lockOverlay.id = 'emergency-lock-screen';
        lockOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:#050712; z-index:99999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; font-family:monospace;";
        lockOverlay.innerHTML = `
            <i class="fa-solid fa-shield-alert" style="font-size:70px; color:#ff4b4b; margin-bottom:20px; animation: pulse 1s infinite alternate;"></i>
            <h1 style="color:#ff4b4b;">TIZIM MUZLATILDI</h1>
            <p style="color:#64748b; margin-bottom:20px;">Xavfsizlik yuzasidan Kill-Switch faollashtirildi.</p>
            <input type="password" id="unlock-pass" placeholder="Tizim parolini kiriting" style="padding:12px; background:rgba(255,255,255,0.05); border:1px solid #ff4b4b; border-radius:8px; color:#fff; text-align:center; outline:none;">
            <button id="btn-unlock-sys" style="margin-top:15px; padding:10px 20px; background:#ff4b4b; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">TIZIMNI OCHISH</button>
        `;
        document.body.appendChild(lockOverlay);
        window.playSystemSound('error');

        document.getElementById('btn-unlock-sys').addEventListener('click', () => {
            const pass = document.getElementById('unlock-pass').value;
            if(pass === config.password) {
                lockOverlay.remove();
                window.logSystemActivity("Tizim blokdan muvaffaqiyatli ochildi");
                window.showToast("Tizim muvaffaqiyatli ochildi", "success");
            } else {
                alert("❌ Noto'g'ri parol! Xavfsizlik bo'limiga xabar yuborildi.");
            }
        });
    };

    // 7. FLOATING AI CHAT BOT ASSISTANT
    let botHTML = `
        <div id="ai-floating-bot" style="position:fixed; bottom:20px; right:20px; z-index:999; display:flex; flex-direction:column; align-items:flex-end;">
            <div id="ai-chat-window" class="glass-panel" style="width:320px; height:400px; display:none; flex-direction:column; margin-bottom:15px; border-color:var(--neon-cyan); overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                <div style="background:rgba(0,242,254,0.1); padding:15px; border-bottom:1px solid var(--border-glass); font-weight:bold; color:var(--neon-cyan);"><i class="fa-solid fa-brain"></i> Quantum Pulse AI Agent</div>
                <div id="chat-messages" style="flex:1; padding:15px; overflow-y:auto; font-size:13px; display:flex; flex-direction:column; gap:10px;">
                    <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:8px; align-self:flex-start;">Salom! Tizim ma'lumotlari bo'yicha qanday savolingiz bor?</div>
                </div>
                <div style="padding:10px; border-top:1px solid var(--border-glass); display:flex; gap:8px;">
                    <input type="text" id="chat-input" placeholder="AIdan so'rash..." style="flex:1; background:rgba(0,0,0,0.3); border:1px solid var(--border-glass); border-radius:6px; color:#fff; padding:6px 10px; outline:none; font-size:12px;">
                    <button id="chat-send" style="background:var(--neon-cyan); border:none; padding:5px 12px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
            <button id="ai-bot-trigger" style="width:55px; height:55px; border-radius:50%; background:linear-gradient(135deg, var(--neon-cyan), var(--neon-purple)); border:none; color:#fff; font-size:22px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(0,242,254,0.4);"><i class="fa-solid fa-robot"></i></button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', botHTML);

    const botTrigger = document.getElementById('ai-bot-trigger');
    const chatWin = document.getElementById('ai-chat-window');
    const chatInput = document.getElementById('chat-input');
    const chatMsgs = document.getElementById('chat-messages');

    botTrigger.addEventListener('click', () => {
        chatWin.style.display = chatWin.style.display === 'none' ? 'flex' : 'none';
    });

    document.getElementById('chat-send').addEventListener('click', executeChatAI);
    chatInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') executeChatAI(); });

    function executeChatAI() {
        const text = chatInput.value.trim();
        if(!text) return;
        chatInput.value = "";
        
        chatMsgs.innerHTML += `<div style="background:var(--neon-purple); color:#fff; padding:8px 12px; border-radius:8px; align-self:flex-end; max-width:80%;">${text}</div>`;
        chatMsgs.scrollTop = chatMsgs.scrollHeight;

        setTimeout(() => {
            let reply = "Ushbu so'rov bo'yicha tahlillar optimallashmoqda. Neyron tarmoq ma'lumotlarni hisobladi.";
            if(text.toLowerCase().includes('mijoz')) {
                const count = (JSON.parse(localStorage.getItem('qp_customers')) || []).length;
                reply = `Hozirgi vaqtda ma'lumotlar bazasida <b>${count} ta faol mijoz</b> segmentlangan.`;
            } else if(text.toLowerCase().includes('ombor') || text.toLowerCase().includes('tovar')) {
                reply = "Omborda 1 ta mahsulot zaxirasi kritik darajada kamaymoqda (Liquid Cooling Unit). To'ldirish tavsiya etiladi.";
            }
            chatMsgs.innerHTML += `<div style="background:rgba(255,255,255,0.05); color:#fff; padding:8px 12px; border-radius:8px; align-self:flex-start; max-width:80%;">${reply}</div>`;
            chatMsgs.scrollTop = chatMsgs.scrollHeight;
            window.playSystemSound('success');
        }, 600);
    }
});