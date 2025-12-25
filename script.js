// --- CONFIGURATION FIREBASE ---
// Remplacez ces valeurs par celles de votre projet Firebase
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJET.firebaseapp.com",
    databaseURL: "https://VOTRE_PROJET.firebaseio.com",
    projectId: "VOTRE_PROJET",
    storageBucket: "VOTRE_PROJET.appspot.com",
    messagingSenderId: "VOTRE_ID",
    appId: "VOTRE_APP_ID"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- TRADUCTIONS ---
const translations = {
    fr: {
        title: "Notes Cloud 🔒",
        settings: "⚙️ Sécurité",
        lock: "Verrouiller",
        search: "Rechercher...",
        placeholder: "Écrire une note confidentielle...",
        add: "✚ Ajouter",
        export: "📤 Export CSV",
        secTitle: "Sécurité",
        oldP: "Ancien MDP",
        newP: "Nouveau MDP",
        reset: "🗑️ Tout effacer",
        createdOn: "Créée le :",
        authTitle: "Accès Sécurisé",
        authDesc: "Entrez votre mot de passe maître.",
        setPass: "Définir le mot de passe",
        confirmDelete: "Supprimer cette note ?",
        confirmReset: "Voulez-vous vraiment TOUT supprimer ?",
        errorPass: "Mot de passe incorrect."
    },
    en: {
        title: "Cloud Notes 🔒",
        settings: "⚙️ Security",
        lock: "Lock",
        search: "Search...",
        placeholder: "Type a secret note...",
        add: "✚ Add Note",
        export: "📤 Export CSV",
        secTitle: "Security",
        oldP: "Old Password",
        newP: "New Password",
        reset: "🗑️ Full Reset",
        createdOn: "Created on:",
        authTitle: "Secure Access",
        authDesc: "Enter your master password.",
        setPass: "Set Master Password",
        confirmDelete: "Delete this note?",
        confirmReset: "Are you sure you want to delete EVERYTHING?",
        errorPass: "Incorrect password."
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
        alert("Succès !");
        oldP.value = ""; newP.value = ""; toggleSettings();
    } else { alert(translations[currentLang].errorPass); }
}

async function resetApp() {
    const p = prompt(translations[currentLang].authDesc);
    if (await hashPassword(p) === localStorage.getItem('app_password_hash')) {
        if (confirm(translations[currentLang].confirmReset)) {
            database.ref('notes/').remove();
            localStorage.clear();
            location.reload();
        }
    }
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

// --- GESTION DES NOTES AVEC FIREBASE ---
function addNote() {
    const input = document.getElementById('noteInput');
    if (!input.value.trim()) return;

    const newRef = database.ref('notes/').push();
    newRef.set({
        id: newRef.key,
        content: input.value,
        created: new Date().toLocaleString(currentLang === 'fr' ? 'fr-FR' : 'en-US')
    });
    input.value = '';
}

function loadNotes(filter = "") {
    database.ref('notes/').on('value', (snap) => {
        const data = snap.val();
        const notes = data ? Object.values(data) : [];
        const container = document.getElementById('notesContainer');
        
        container.innerHTML = notes
            .filter(n => n.content.toLowerCase().includes(filter.toLowerCase()))
            .slice().reverse().map(note => `
                <div class="card mb-4 shadow-sm note-card">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="note-text w-100" contenteditable="true" onblur="updateCloud('${note.id}', this.innerText)">${note.content}</div>
                            <button class="btn btn-link text-danger p-0 ms-2" onclick="deleteCloud('${note.id}')">&times;</button>
                        </div>
                        <div class="mt-3 pt-2 border-top text-muted small">📅 ${translations[currentLang].createdOn} ${note.created}</div>
                    </div>
                </div>
            `).join('');
    });
}

function filterNotes() { loadNotes(document.getElementById('searchInput').value); }
function updateCloud(id, txt) { if(txt.trim()) database.ref('notes/'+id).update({content: txt}); }
function deleteCloud(id) { if(confirm(translations[currentLang].confirmDelete)) database.ref('notes/'+id).remove(); }

function exportToCSV() {
    database.ref('notes/').once('value', (snap) => {
        const notes = Object.values(snap.val() || {});
        let csv = "Content;Date\n" + notes.map(n => `"${n.content.replace(/"/g, '""')}";${n.created}`).join("\n");
        const link = document.createElement("a");
        link.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
        link.download = "notes_cloud.csv";
        link.click();
    });
}

window.onload = updateUI;
