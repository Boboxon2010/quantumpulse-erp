// QuantumPulse - Enterprise Core Engine v4.0 (Zero-Token Ultra Secure Edition)

const GH_CONFIG = {
    username: "Boboxon2010",
    repo: "quantumpulse-erp",
    filename: "database.json"
};

(function() {
    // 1. SAFETY & AUTH GUARD
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
    const isLoggedIn = localStorage.getItem('qp_is_logged_in') === 'true';
    if (!localStorage.getItem('qp_auth_config') && !isAuthPage) { window.location.href = "register.html"; return; }
    if (!isLoggedIn && !isAuthPage) { window.location.href = "login.html"; return; }

    // 2. TOKEN CONTROLLER (Tokenni faqat foydalanuvchidan olish va tekshirish)
    window.getGithubToken = function() {
        let token = localStorage.getItem('qp_secure_gh_token');
        if (!token && !isAuthPage) {
            token = prompt("🔒 Tizim xavfsizligi: GitHub PAT (Personal Access Token) kiriting:\n(Bu kod GitHub-ga yuklanmaydi, faqat sizning brauzeringizda saqlanadi)");
            if (token) {
                localStorage.setItem('qp_secure_gh_token', token);
            } else {
                alert("Token kiritilmadi! Sinxronizatsiya ishlamasligi mumkin.");
            }
        }
        return token;
    };

    // 3. TOAST NOTIFICATION ENGINE
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

    // 4. GLOBAL LOGGERS & AUDIO
    window.logSystemActivity = function(action) {
        let logs = JSON.parse(localStorage.getItem('qp_activity_logs')) || [];
        logs.unshift({ time: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(), action });
        localStorage.setItem('qp_activity_logs', JSON.stringify(logs.slice(0, 50)));
    };

    // 5. GLOBAL REAL-TIME CLOUD SYNC ENGINE
    window.syncDataToGitHub = async function() {
        const activeToken = window.getGithubToken();
        if(!activeToken) { window.showToast("Sinxronizatsiya uchun token mavjud emas!", "error"); return; }
        
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
                headers: { "Authorization": `token ${activeToken}` }
            });
            
            if (getRes.status === 200) {
                const fileData = await getRes.json();
                sha = fileData.sha;
            }

            const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(currentData, null, 2))));

            const putRes = await fetch(url, {
                method: "PUT",
                headers: {
                    "Authorization": `token ${activeToken}`,
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
            window.showToast("Sinxronizatsiya muvaffaqiyatsiz yakunlandi. Token noto'g'ri bo'lishi mumkin.", "error");
        }
    };

    window.loadDataFromGitHub = async function() {
        const activeToken = window.getGithubToken();
        if(!activeToken) return;

        const url = `https://api.github.com/repos/${GH_CONFIG.username}/${GH_CONFIG.repo}/contents/${GH_CONFIG.filename}`;
        try {
            const res = await fetch(url, {
                headers: { "Authorization": `token ${activeToken}` }
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

    window.saveAndCloudSync = function(storageKey, dataArray) {
        localStorage.setItem(storageKey, JSON.stringify(dataArray));
        window.syncDataToGitHub();
    };

    const config = JSON.parse(localStorage.getItem('qp_auth_config')) || {};
    document.documentElement.style.setProperty('--neon-cyan', config.themeCyan || '#00f2fe');
    document.documentElement.style.setProperty('--neon-purple', config.themePurple || '#4facfe');
})();

document.addEventListener('DOMContentLoaded', () => {
    window.loadDataFromGitHub();

    const config = JSON.parse(localStorage.getItem('qp_auth_config')) || {};
    
    const timeDisplay = document.getElementById('live-time');
    if (timeDisplay) {
        function updateTime() { timeDisplay.textContent = new Date().toTimeString().split(' ')[0]; }
        setInterval(updateTime, 1000); updateTime();
    }

    // Ctrl + K Palette
    let paletteHTML = `
        <div id="command-palette" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(5,7,18,0.85); backdrop-filter:blur(10px); z-index:10000; display:none; justify-content:center; align-items:flex-start; padding-top:100px;">
            <div class="glass-panel" style="width:100%; max-width:600px; padding:20px; border-radius:16px; background:#0a0e23;">
                <div style="display:flex; align-items:center; gap:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; margin-bottom:15px;">
                    <i class="fa-solid fa-terminal" style="color:var(--neon-cyan)"></i>
                    <input type="text" id="palette-input" placeholder="Buyruqni kiriting... (/lock, /sync, /update-token)" style="width:100%; background:none; border:none; outline:none; color:#fff; font-size:16px; font-family:monospace;">
                </div>
                <div id="palette-results" style="font-family:monospace; font-size:13px; color:#64748b;">
                    Tokenni yangilash uchun <b>/update-token</b> deb yozing.
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
            else if(cmd === '/update-token') {
                localStorage.removeItem('qp_secure_gh_token');
                palette.style.display = 'none';
                window.getGithubToken();
            }
        }
    });
});