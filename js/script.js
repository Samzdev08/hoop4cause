const panels = document.querySelectorAll('.panel');
const steps = document.querySelectorAll('.step-ind');

let capitaine = {};
const joueurs = [];
const remplacants = [];
let titulaires = [];
let cguOn = false;

document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", saveFormToLocalStorage);
});

document.querySelector("select").addEventListener("change", saveFormToLocalStorage);


document.getElementById("c-phone").addEventListener("input", formatPhone);


function formatPhone(e) {
    let value = e.target.value;
    value = value.replace(/\D/g, "");

    value = value.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");

    e.target.value = value.trim();
}

document.getElementById("c-phone").addEventListener("input", formatPhone);

function loadFormFromLocalStorage() {

    const data = JSON.parse(localStorage.getItem("formUser"));


    if (!data) return;

    document.getElementById('c-first').value = data.firstName || "";
    document.getElementById('c-last').value = data.lastName || "";
    document.getElementById('c-email').value = data.email || "";
    document.getElementById('c-phone').value = data.phone || "";
    document.getElementById('c-birth').value = data.birth || "";
    const levelEl = document.getElementById('c-level');
    if (levelEl) levelEl.value = data.level || "";

    const teamNameEl = document.getElementById('team-name');
    if (teamNameEl) teamNameEl.value = data.TeamName || "";



    document.querySelector('#c-gender').querySelectorAll('.pill').forEach(p => {
        p.classList.remove('sel');
    });

    document.querySelector('#c-jersey').querySelectorAll('.pill').forEach(p => {
        p.classList.remove('sel');
    });


    const pillGender = document.querySelector(`.pill[data-v="${data.sexe}"]`);

    if (pillGender) {
        pillGender.classList.add('sel');
    }

    const pillJersey = document.querySelector(`.pill[data-v="${data.jerseySize}"]`);


    if (pillJersey) {
        pillJersey.classList.add('sel');
    }

    console.log(data)
}

loadFormFromLocalStorage();

const changeSteps = (index) => {
    steps.forEach((step, i) => {

        step.classList.remove('active');
        if (index == i) step.classList.add('active');

    })
}

const changeView = (index) => {
    panels.forEach((panel, i) => {

        panel.classList.remove('active');
        if (index == i) panel.classList.add('active');

        changeSteps(index);
    })
}

function goStep(i) {

    const validators = {
        1: validateStep1,
        2: validateStep2,
        3: validateStep3
    };

    if (validators[i]) {
        const ok = validators[i]();
        if (!ok) return;
    }
    if (i === 3) buildSummary();



    changeView(i);
}


function selPill(group = 'c-gender', target) {


    document.querySelector(`#${group}`).querySelectorAll('.pill').forEach(pill => {
        pill.classList.remove('sel');
    });

    target.classList.add('sel');
    if (group === 'c-gender') {
        capitaine.sexe = target.dataset.v;
        saveFormToLocalStorage();
    }
    else {

        capitaine.jerseySize = target.dataset.v;

        saveFormToLocalStorage();
    }


}


function validateStep1() {

    try {

        const firstName = document.getElementById('c-first')?.value.trim();
        const lastName = document.getElementById('c-last')?.value.trim();
        const email = document.getElementById('c-email')?.value.trim();
        const phone = document.getElementById('c-phone')?.value.trim();
        const birth = document.getElementById('c-birth')?.value;

        const pillSelected = document.querySelector('.pill.sel');
        const sexe = pillSelected?.dataset?.v || null;

        const nameRegex = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;


        if (!firstName || !nameRegex.test(firstName)) {
            showNotif("Prénom invalide (lettres uniquement)", "error");
            return false;
        }


        if (!lastName || !nameRegex.test(lastName)) {
            showNotif("Nom invalide (lettres uniquement)", "error");
            return false;
        }


        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showNotif("Email invalide", "error");
            return false;
        }


        if (!phone || !/^[0-9+\s]{6,}$/.test(phone)) {
            showNotif("Téléphone invalide", "error");
            return false;
        }

        if (!isOldEnough(birth)) {
            showNotif("Tu dois avoir au moins 15 ans", "error");
            return false;
        }


        if (!birth) {
            showNotif("Date de naissance requise", "error");
            return false;
        }


        if (!sexe) {
            showNotif("Sélectionne un sexe", "error");
            return false;
        }
        return true;

    } catch (err) {
        console.error(err);
        showNotif("Une erreur inattendue est survenue", "error");
        return false;
    }
}


function validateStep2() {

    try {

        const level = document.getElementById('c-level')?.value;
        const jersey = document.querySelector('#c-jersey .pill.sel')?.dataset?.v || null;
        const teamName = document.getElementById('team-name')?.value.trim();


        if (!level) {
            showNotif("Sélectionne ton niveau", "error");
            return false;
        }


        if (!jersey) {
            showNotif("Choisis une taille de maillot", "error");
            return false;
        }


        const teamRegex = /^[a-zA-ZÀ-ÿ0-9\s-]{3,60}$/;

        if (!teamName || !teamRegex.test(teamName)) {
            showNotif("Nom d'équipe invalide", "error");
            return false;
        }

        capitaine.level = level;
        capitaine.jerseySize = jersey;
        capitaine.TeamName = teamName ?? 'Inscription seule';
        saveFormToLocalStorage();

        return true;

    } catch (err) {
        console.error(err);
        showNotif("Erreur inattendue", "error");
        return false;
    }
}

function validateStep3() {

    if (joueurs.length < 4) {
        showNotif(`Il manque ${4 - joueurs.length} titulaire(s)`, "error");
        return false;
    }


    for (let i = 0; i < joueurs.length; i++) {
        const j = joueurs[i];
        const nameRegex = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!j.firstName || !nameRegex.test(j.firstName)) {
            showNotif(`Titulaire ${i + 1} — Prénom invalide`, "error");
            return false;
        }
        if (!j.lastName || !nameRegex.test(j.lastName)) {
            showNotif(`Titulaire ${i + 1} — Nom invalide`, "error");
            return false;
        }
        if (!j.email || !emailRegex.test(j.email)) {
            showNotif(`Titulaire ${i + 1} — Email invalide`, "error");
            return false;
        }
        if (!j.sexe) {
            showNotif(`Titulaire ${i + 1} — Sexe requis`, "error");
            return false;
        }
        if (!j.birth) {
            showNotif(`Titulaire ${i + 1} — Date de naissance requise`, "error");
            return false;
        }
        if (!isOldEnough(j.birth)) {
            showNotif(`Titulaire ${i + 1} — Doit avoir au moins 15 ans`, "error");
            return false;
        }
        if (!j.jerseySize) {
            showNotif(`Titulaire ${i + 1} — Taille de maillot requise`, "error");
            return false;
        }
    }


    for (let i = 0; i < remplacants.length; i++) {
         const r = remplacants[i];
         const nameRegex = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
         if (!r.firstName || !nameRegex.test(r.firstName)) {
             showNotif(`Remplaçant ${i + 1} — Prénom invalide`, "error");
             return false;
         }
         if (!r.lastName || !nameRegex.test(r.lastName)) {
             showNotif(`Remplaçant ${i + 1} — Nom invalide`, "error");
             return false;
         }
         if (!r.email || !emailRegex.test(r.email)) {
             showNotif(`Remplaçant ${i + 1} — Email invalide`, "error");
             return false;
         }
         if (!r.sexe) {
             showNotif(`Remplaçant ${i + 1} — Sexe requis`, "error");
             return false;
         }
         if (!r.birth) {
             showNotif(`Remplaçant ${i + 1} — Date de naissance requise`, "error");
             return false;
         }
         if (!isOldEnough(r.birth)) {
             showNotif(`Remplaçant ${i + 1} — Doit avoir au moins 15 ans`, "error");
             return false;
         }
         if (!r.jerseySize) {
             showNotif(`Remplaçant ${i + 1} — Taille de maillot requise`, "error");
             return false;
         }
     }
         

    return true;
}

function isOldEnough(birth) {
    if (!birth) return false;

   
    const [year, month, day] = birth.split('-').map(Number);
    if (!year || !month || !day) return false;

    const today = new Date();
    const birthDate = new Date(year, month - 1, day);

    let age = today.getFullYear() - birthDate.getFullYear();
    const notYetThisYear =
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

    if (notYetThisYear) age--;

    return age >= 15;
}

function showNotif(mess, type) {
    const message = document.querySelector('.message');

    
    message.classList.remove('anime', 'error', 'success', 'warning');
    message.textContent = mess;

    
    void message.offsetWidth;

    message.classList.add(type, 'anime');

    clearTimeout(message._timer);
    message._timer = setTimeout(() => {
        message.classList.remove('anime', type);
    }, 4000);
}


function sauvegarderJoueurs() {
    localStorage.setItem("joueurs", JSON.stringify(joueurs));
}

function chargerJoueurs() {
    const data = localStorage.getItem("joueurs");
    if (!data) return;
    const saved = JSON.parse(data);
    joueurs.length = 0;
    saved.forEach(j => joueurs.push(j));
    renderTit();
}

function addTitulaire() {
    if (joueurs.length >= 4) return;
    const titulaire = {
        id: joueurs.length + 1,
        firstName: "",
        lastName: "",
        email: "",
        statut: "titulaire",
        birth: "",
        sexe: "",
        TeamName: capitaine["TeamName"],
        jerseySize: ""
    };
    joueurs.push(titulaire);
    sauvegarderJoueurs();
    renderTit();
}

function renderTit() {
    document.getElementById('tit-list').innerHTML = joueurs.map((p, i) => playerCard(p, i, 'tit')).join('');
    document.getElementById('tit-n').textContent = joueurs.length;
    const addBtn = document.getElementById('add-tit-btn');
    addBtn.style.display = joueurs.length >= 4 ? 'none' : 'flex';
}

function playerCard(p, idx, type) {
    const isRemplacant = type === 'rem';
    const badgeClass = isRemplacant ? 'badge-rem' : 'badge-tit';
    const badgeText = isRemplacant ? 'Remplaçant' : 'Titulaire';
    const listFn = isRemplacant ? 'updateRem' : 'updateTit';
    const removeFn = isRemplacant ? 'removeRem' : 'removeTit';

    const isComplete = p.firstName && p.lastName && p.email && p.sexe && p.birth && p.jerseySize;
    const statusIcon = isComplete
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9A50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`;
    const displayName = p.firstName || p.lastName
        ? `${p.firstName} ${p.lastName}`.trim()
        : `Joueur ${idx + 1}`;

    return `
    <div class="player-card" id="${type}-card-${idx}">
        <div class="player-accordion-header" onclick="toggleCard('${type}-body-${idx}', this)">
            <div class="player-header-left">
                <span class="accordion-arrow">▶</span>
                <span class="player-name">${displayName}</span>
                <span class="type-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="player-header-right">
                <span class="status-icon">${statusIcon}</span>
                <button class="remove-btn" onclick="event.stopPropagation();${removeFn}(${idx})">Retirer</button>
            </div>
        </div>
        <div class="player-body" id="${type}-body-${idx}" style="display:none;">
            <div class="row">
                <div class="field">
                    <label>Prénom <span class="req">*</span></label>
                    <input type="text" placeholder="Prénom" value="${p.firstName}" oninput="${listFn}(${idx},'firstName',this.value);updateCardHeader('${type}',${idx})" />
                </div>
                <div class="field">
                    <label>Nom <span class="req">*</span></label>
                    <input type="text" placeholder="Nom" value="${p.lastName}" oninput="${listFn}(${idx},'lastName',this.value);updateCardHeader('${type}',${idx})" />
                </div>
            </div>
            <div class="row">
                <div class="field">
                    <label>Email <span class="req">*</span></label>
                    <input type="email" placeholder="email@exemple.com" value="${p.email}" oninput="${listFn}(${idx},'email',this.value);updateCardHeader('${type}',${idx})" />
                </div>
                <div class="field">
                    <label>Sexe <span class="req">*</span></label>
                    <div class="pills">
                        <div class="pill ${p.sexe === 'male' ? 'sel' : ''}" onclick="${listFn}(${idx},'sexe','male');this.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');updateCardHeader('${type}',${idx})">Homme</div>
                        <div class="pill ${p.sexe === 'female' ? 'sel' : ''}" onclick="${listFn}(${idx},'sexe','female');this.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');updateCardHeader('${type}',${idx})">Femme</div>
                        <div class="pill ${p.sexe === 'other' ? 'sel' : ''}" onclick="${listFn}(${idx},'sexe','other');this.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');updateCardHeader('${type}',${idx})">Autre</div>
                    </div>
                </div>
                <div class="field">
                    <label>Date de naissance <span class="req">*</span></label>
                    <input type="date" max="2010-12-31" value="${p.birth}" oninput="${listFn}(${idx},'birth',this.value);updateCardHeader('${type}',${idx})" />
                </div>
            </div>
            <div class="field" style="margin-top:0.5rem;">
                <label>Taille maillot</label>
                <div class="pills">
                    ${['S', 'M', 'L', 'XL', 'XXL'].map(s => `<div class="pill ${p.jerseySize === s ? 'sel' : ''}" onclick="${listFn}(${idx},'jerseySize','${s}');this.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');updateCardHeader('${type}',${idx})">${s}</div>`).join('')}
                </div>
            </div>
        </div>
    </div>`;
}

function toggleCard(bodyId, header) {
    const body = document.getElementById(bodyId);
    const arrow = header.querySelector('.accordion-arrow');
    const isOpen = body.style.display === 'block';
    body.style.display = isOpen ? 'none' : 'block';
    arrow.textContent = isOpen ? '›' : '⌄';
}

function updateCardHeader(type, idx) {
    const list = type === 'rem' ? remplacants : joueurs;
    const p = list[idx];
    const card = document.getElementById(`${type}-card-${idx}`);
    if (!card) return;

    const isComplete = p.firstName && p.lastName && p.email && p.sexe && p.birth && p.jerseySize;

    card.querySelector('.status-icon').innerHTML = isComplete
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9A50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`;

    card.querySelector('.player-name').textContent = p.firstName || p.lastName
        ? `${p.firstName} ${p.lastName}`.trim()
        : `Joueur ${idx + 1}`;
}

function removeTit(idx) {
    joueurs.splice(idx, 1);
    sauvegarderJoueurs();
    renderTit();
}

function updateTit(idx, field, val) {
    joueurs[idx][field] = val;
    sauvegarderJoueurs();
}
function addRemplacant() {
    if (remplacants.length >= 3) return;
    const remplacant = {
        id: remplacants.length + 1,
        firstName: "",
        lastName: "",
        email: "",
        statut: "remplacant",
        birth: "",
        sexe: "",
        TeamName: capitaine.TeamName,
        jerseySize: ""
    };
    remplacants.push(remplacant);
    sauvegarderRemplacants();
    renderRem();
}

function renderRem() {
    document.getElementById('rem-list').innerHTML = remplacants.map((p, i) => playerCard(p, i, 'rem')).join('');
    document.getElementById('rem-n').textContent = remplacants.length;
    const addBtn = document.getElementById('add-rem-btn');
    addBtn.style.display = remplacants.length >= 3 ? 'none' : 'flex';
}

function removeRem(idx) {
    remplacants.splice(idx, 1);
    sauvegarderRemplacants();
    renderRem();
}

function updateRem(idx, field, val) {
    remplacants[idx][field] = val;
    sauvegarderRemplacants();
}

function sauvegarderRemplacants() {
    localStorage.setItem("remplacants", JSON.stringify(remplacants));
}

function chargerRemplacants() {
    const data = localStorage.getItem("remplacants");
    if (!data) return;
    const saved = JSON.parse(data);
    remplacants.length = 0;
    saved.forEach(r => remplacants.push(r));
    renderRem();
}

function toggleRemSection() {
    const section = document.getElementById('replacements-section');
    const toggle = document.getElementById('rem-toggle');
    const remCount = document.getElementById('rem-count');

    const isOpen = section.classList.contains('open');
    section.classList.toggle('open', !isOpen);
    toggle.classList.toggle('active', !isOpen);
    remCount.style.display = isOpen ? 'none' : 'flex';
}

chargerRemplacants();

chargerJoueurs();
function buildSummary() {
    const lvlEl = document.getElementById('c-level');
    const level = lvlEl.options[lvlEl.selectedIndex]?.text || '—';
    const total = (1 + joueurs.length + remplacants.length) * 20;

    const initials = (p) => {
        const f = p.firstName?.[0] || '';
        const l = p.lastName?.[0] || '';
        return (f + l).toUpperCase() || '?';
    };

    const jerseyLabel = (p) => p.jerseySize ? ` · Maillot ${p.jerseySize}` : '';

    const allPlayers = [
        { obj: capitaine, role: 'cap', label: 'Capitaine' },
        ...joueurs.map(p => ({ obj: p, role: 'tit', label: 'Titulaire' })),
         ...remplacants.map(p => ({ obj: p, role: 'remp', label: 'Remplacant' }))
    ];

    document.getElementById('summary').innerHTML = `
        <div class="team-hero">
            <div class="team-avatar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
            </div>
            <div>
                <div class="team-title">${capitaine.TeamName || '—'}</div>
                <div class="team-subtitle">Tournoi 5×5 · Juin 2026 · Plan-les-Ouates</div>
            </div>
        </div>
        <div class="meta-row">
            <div class="meta-chip"><strong>${level}</strong></div>
            <div class="meta-chip">Format <strong>5×5</strong></div>
            <div class="meta-chip"><strong>${allPlayers.length}</strong> joueurs</div>
        </div>

        <hr>

        <div class="summary-players">
            ${allPlayers.map(({ obj: p, role, label }) => `
                <div class="summary-player-row">
                    <div class="player-avatar ${role}">${initials(p)}</div>
                    <div class="player-info">
                        <div class="player-full-name">${(p.firstName + ' ' + p.lastName).trim() || '—'}</div>
                        <div class="player-role-badge ${role}">${label}${jerseyLabel(p)}</div>
                    </div>
                    <div class="player-price">20.–</div>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('total-amt').innerHTML = `
        <div class="total-box-left">
            <div class="total-label">Total à payer</div>
            <div class="total-detail">${allPlayers.length} joueurs × 20.– CHF</div>
        </div>
        <div class="total-box-right">
            <div class="total-amount">${total}.–</div>
            <div class="total-currency">CHF</div>
        </div>
    `;
}

function toggleCgu() {
    cguOn = !cguOn;
    document.getElementById('cgu-chk').classList.toggle('on', cguOn);
}

function submitForm() {
    if (!cguOn) {
        showNotif("Veuillez accepter les conditions d'inscription", "error");
        return;
    }

    const btn = document.querySelector('.stripe-btn');
    btn.disabled = true;
    btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
        </svg>
        Redirection vers Stripe…`;

    setTimeout(() => {

        showNotif('T broke mais azz ', 'success');
    }, 5000)


}
function saveFormToLocalStorage() {
    const pillGender = document.querySelector('#c-gender .pill.sel');
    const pillJersey = document.querySelector('#c-jersey .pill.sel');


    Object.assign(capitaine, {
        firstName: document.getElementById('c-first')?.value || "",
        lastName: document.getElementById('c-last')?.value || "",
        email: document.getElementById('c-email')?.value || "",
        phone: document.getElementById('c-phone')?.value || "",
        birth: document.getElementById('c-birth')?.value || "",
        sexe: pillGender?.dataset?.v || capitaine.sexe || null,
        level: document.getElementById('c-level')?.value,
        TeamName: document.getElementById('team-name')?.value.trim() || capitaine.TeamName || "",
        jerseySize: pillJersey?.dataset?.v || capitaine.jerseySize || "",
        statut: 'capitaine'
    });

    console.log(capitaine)



    localStorage.setItem("formUser", JSON.stringify(capitaine));
}