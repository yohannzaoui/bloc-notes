// --- TRADUCTIONS ---
const translations = {
    fr: {
        title: "Notes Sécurisées 🔒",
        settings: "⚙️ Sécurité",
        lock: "Verrouiller",
        search: "Rechercher dans vos notes...",
        placeholder: "Écrire une note confidentielle...",
        add: "✚ Ajouter Note",
        export: "📤 Exporter CSV",
        secTitle: "Paramètres de sécurité",
        oldP: "Ancien MDP",
        newP: "Nouveau MDP",
        reset: "🗑️ Réinitialiser tout",
        createdOn: "Créée le :",
        authTitle: "Accès Sécurisé",
        authDesc: "Entrez votre mot de passe maître.",
        setPass: "Définir le mot de passe",
        confirmDelete: "Supprimer cette note ?",
        confirmReset: "Voulez-vous vraiment TOUT supprimer ?",
        errorPass: "Mot de passe incorrect.",
        successPass: "Mot de passe modifié !"
    },
    en: {
        title: "Secure Notes 🔒",
        settings: "⚙️ Security",
        lock: "Lock",
        search: "Search notes...",
        placeholder: "Type a secret note...",
        add: "✚ Add Note",
        export: "📤 Export CSV",
        secTitle: "Security Settings",
        oldP: "Old Password",
        newP: "New Password",
        reset: "🗑️ Full Reset",
        createdOn: "Created on:",
        authTitle: "Secure Access",
        authDesc: "Enter your master password.",
        setPass: "Set Master Password",
        confirmDelete: "Delete this note?",
        confirmReset: "Are you sure you want to delete EVERYTHING?",
        errorPass: "Incorrect password.",
        successPass: "Password updated!"
    }
};

let currentLang = localStorage.getItem('app_lang') || 'fr';

// --- SÉCURITÉ (SHA-256) ---
async function hashPassword(p) {
    const msg = new TextEncoder().encode(p);
    const hash = await crypto.subtle.digest('SHA-256', msg);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword() {
    const input = document.getElementById('passwordInput');
    const stored = localStorage.getItem('app_password_hash');
    const hashed = await hashPassword(input.value);

    if (!stored) {
        localStorage.setItem('app_password_hash', hashed);
        unlock();
    } else if (hashed === stored) {
        unlock();
    } else {
        alert(translations[currentLang].errorPass);
    }
    input.value = "";
}

function unlock() {
    document.getElementById('lockScreen').classList.add('hidden');
    loadNotes();
}

function lockApp() { location.reload(); }

async function updatePassword() {
    const oldP = document.getElementById('oldPass');
    const newP = document.getElementById('newPass');
    const stored = localStorage.getItem('app_password_hash');
    if (await hashPassword(oldP.value) === stored) {
        localStorage.setItem('app_password_hash', await hashPassword(newP.value));
        alert(translations[currentLang].successPass);
        oldP.value = ""; newP.value = ""; toggleSettings();
    } else { alert(translations[currentLang].errorPass); }
}

async function resetApp() {
    const p = prompt(translations[currentLang].authDesc);
    if (!p) return;
    if (await hashPassword(p) === localStorage.getItem('app_password_hash')) {
        if (confirm(translations[currentLang].confirmReset)) {
            localStorage.clear();
            location.reload();
        }
    } else { alert(translations[currentLang].errorPass); }
}

// --- INTERFACE ---
function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    updateUI();
    loadNotes(document.getElementById('searchInput').value);
}

function updateUI() {
    const t = translations[currentLang];
    document.getElementById('ui-title').innerText = t.title;
    document.getElementById('ui-btn-settings').innerText = t.settings;
    document.getElementById('ui-btn-lock').innerText = t.lock;
    document.getElementById('searchInput').placeholder = t.search;
    document.getElementById('noteInput').placeholder = t.placeholder;
    document.getElementById('ui-btn-add').innerText = t.add;
    document.getElementById('ui-btn-export').innerText = t.export;
    document.getElementById('ui-sec-title').innerText = t.secTitle;
    document.getElementById('oldPass').placeholder = t.oldP;
    document.getElementById('newPass').placeholder = t.newP;
    document.getElementById('ui-btn-reset').innerText = t.reset;
    document.getElementById('lockTitle').innerText = localStorage.getItem('app_password_hash') ? t.authTitle : t.setPass;
    document.getElementById('lockDesc').innerText = t.authDesc;
    document.getElementById('langSelect').value = currentLang;
}

function toggleSettings() {
    const p = document.getElementById('settingsPanel');
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
}

// --- GESTION DES NOTES (LOCAL STORAGE) ---
function addNote() {
    const input = document.getElementById('noteInput');
    if (!input.value.trim()) return;
    
    const notes = JSON.parse(localStorage.getItem('local_notes') || '[]');
    const dateLocale = currentLang === 'fr' ? 'fr-FR' : 'en-US';
    
    notes.push({
        id: Date.now(),
        content: input.value,
        created: new Date().toLocaleString(dateLocale)
    });
    
    localStorage.setItem('local_notes', JSON.stringify(notes));
    input.value = '';
    loadNotes();
}

function loadNotes(filter = "") {
    const notes = JSON.parse(localStorage.getItem('local_notes') || '[]');
    const container = document.getElementById('notesContainer');
    
    container.innerHTML = notes
        .filter(n => n.content.toLowerCase().includes(filter.toLowerCase()))
        .slice().reverse().map(note => `
            <div class="card mb-4 shadow-sm note-card">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="note-text w-100" contenteditable="true" onblur="updateNote(${note.id}, this.innerText)">${note.content}</div>
                        <button class="btn btn-link text-danger p-0 ms-2" onclick="deleteNote(${note.id})">&times;</button>
                    </div>
                    <div class="mt-3 pt-2 border-top text-muted small">
                        📅 ${translations[currentLang].createdOn} ${note.created}
                    </div>
                </div>
            </div>
        `).join('');
}

function filterNotes() { loadNotes(document.getElementById('searchInput').value); }

function updateNote(id, txt) {
    let notes = JSON.parse(localStorage.getItem('local_notes') || '[]');
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1 && txt.trim() !== "") {
        notes[idx].content = txt;
        localStorage.setItem('local_notes', JSON.stringify(notes));
    }
}

function deleteNote(id) {
    if (confirm(translations[currentLang].confirmDelete)) {
        let notes = JSON.parse(localStorage.getItem('local_notes') || '[]');
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('local_notes', JSON.stringify(notes));
        loadNotes(document.getElementById('searchInput').value);
    }
}

function exportToCSV() {
    const notes = JSON.parse(localStorage.getItem('local_notes') || '[]');
    if (notes.length === 0) return;
    // Ajout de \uFEFF pour assurer le bon affichage des accents sous Excel
    let csv = "Content;Date\n" + notes.map(n => `"${n.content.replace(/"/g, '""')}";${n.created}`).join("\n");
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
    link.download = "export_notes.csv";
    link.click();
}

window.onload = updateUI;
