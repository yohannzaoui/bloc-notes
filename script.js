// --- SÉCURITÉ ET AUTHENTIFICATION ---

async function hashPassword(password) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword() {
    const input = document.getElementById('passwordInput');
    const storedHash = localStorage.getItem('app_password_hash');
    const hashedInput = await hashPassword(input.value);

    if (!storedHash) {
        localStorage.setItem('app_password_hash', hashedInput);
        unlock();
    } else if (hashedInput === storedHash) {
        unlock();
    } else {
        alert("Mot de passe incorrect.");
    }
    input.value = "";
}

function unlock() {
    document.getElementById('lockScreen').classList.add('hidden');
    loadNotes();
}

function lockApp() { location.reload(); }

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
}

async function updatePassword() {
    const oldPass = document.getElementById('oldPass');
    const newPass = document.getElementById('newPass');
    const storedHash = localStorage.getItem('app_password_hash');
    const hashedOld = await hashPassword(oldPass.value);

    if (hashedOld !== storedHash) {
        alert("L'ancien mot de passe est incorrect.");
        return;
    }

    if (newPass.value.trim().length < 4) {
        alert("Mot de passe trop court.");
        return;
    }

    localStorage.setItem('app_password_hash', await hashPassword(newPass.value));
    alert("Mot de passe modifié !");
    oldPass.value = ""; newPass.value = ""; toggleSettings();
}

async function resetApp() {
    const pass = prompt("Entrez votre mot de passe pour TOUT effacer :");
    if (!pass) return;
    if (await hashPassword(pass) === localStorage.getItem('app_password_hash')) {
        if (confirm("Supprimer toutes les notes et le mot de passe ?")) {
            localStorage.clear();
            location.reload();
        }
    } else { alert("Mot de passe incorrect."); }
}

// --- GESTION DES NOTES ---

function addNote() {
    const input = document.getElementById('noteInput');
    if (!input.value.trim()) return;

    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.push({ 
        id: Date.now(), 
        content: input.value, 
        created: new Date().toLocaleString('fr-FR') 
    });

    localStorage.setItem('notes', JSON.stringify(notes));
    input.value = '';
    loadNotes();
}

function loadNotes(filter = "") {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const container = document.getElementById('notesContainer');
    
    const filteredNotes = notes.filter(n => 
        n.content.toLowerCase().includes(filter.toLowerCase())
    );

    container.innerHTML = filteredNotes.slice().reverse().map(note => `
        <div class="card mb-4 shadow-sm note-card">
            <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="note-text w-100" contenteditable="true" onblur="updateNoteContent(${note.id}, this.innerText)">
                        ${note.content}
                    </div>
                    <button class="btn btn-link text-danger p-0 ms-2" onclick="deleteNote(${note.id})">&times;</button>
                </div>
                <div class="mt-3 pt-2 border-top text-muted small">
                    📅 Créée le : ${note.created}
                </div>
            </div>
        </div>
    `).join('');
}

function filterNotes() {
    const query = document.getElementById('searchInput').value;
    loadNotes(query);
}

function updateNoteContent(id, newText) {
    let notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1 && newText.trim() !== "") {
        notes[idx].content = newText;
        localStorage.setItem('notes', JSON.stringify(notes));
    }
}

function deleteNote(id) {
    if (!confirm("Supprimer cette note ?")) return;
    let notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes(document.getElementById('searchInput').value);
}

function exportToCSV() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    let csv = "ID;Contenu;Creation\n" + notes.map(n => `${n.id};"${n.content.replace(/;/g, ",")}";${n.created}`).join("\n");
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = "export_notes.csv";
    link.click();
}

window.onload = () => {
    if (!localStorage.getItem('app_password_hash')) {
        document.getElementById('lockTitle').innerText = "Initialisation";
        document.getElementById('lockDesc').innerText = "Créez votre mot de passe maître.";
        document.getElementById('lockBtn').innerText = "Définir et Ouvrir";
    }
};