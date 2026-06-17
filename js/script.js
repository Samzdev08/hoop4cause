let mode = null;
let capitaine = {};
const joueurs = [];
const remplacants = [];
let cguOn = false;
let selectedPayment = null; // 'twint' | 'iban'

const STEPS_EQUIPE = [
    { label: 'Capitaine' },
    { label: 'Équipe' },
    { label: 'Joueurs' },
    { label: 'Résumé' }
];
const STEPS_SOLO = [
    { label: 'Profil' },
    { label: 'Basket' },
    { label: 'Résumé' }
];

function saveAll() {
    localStorage.setItem('h4ac_mode', mode || '');
    localStorage.setItem('h4ac_capitaine', JSON.stringify(capitaine));
    localStorage.setItem('h4ac_joueurs', JSON.stringify(joueurs));
    localStorage.setItem('h4ac_remplacants', JSON.stringify(remplacants));
}

function loadAll() {
    try {
        const savedMode = localStorage.getItem('h4ac_mode');
        const savedCap = localStorage.getItem('h4ac_capitaine');
        const savedJoueurs = localStorage.getItem('h4ac_joueurs');
        const savedRem = localStorage.getItem('h4ac_remplacants');
        if (savedCap) Object.assign(capitaine, JSON.parse(savedCap));
        if (savedJoueurs) { const arr = JSON.parse(savedJoueurs); joueurs.length = 0; arr.forEach(j => joueurs.push(j)); }
        if (savedRem) { const arr = JSON.parse(savedRem); remplacants.length = 0; arr.forEach(r => remplacants.push(r)); }
        return savedMode || null;
    } catch (e) { console.warn('Erreur chargement localStorage', e); return null; }
}

function restoreFormFields() {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    setVal('c-first', capitaine.firstName);
    setVal('c-last', capitaine.lastName);
    setVal('c-email', capitaine.email);
    setVal('c-phone', capitaine.phone);
    setVal('c-birth', capitaine.birth);
    if (capitaine.sexe) {
        const pill = document.querySelector(`#c-gender .pill[data-v="${capitaine.sexe}"]`);
        if (pill) { document.querySelectorAll('#c-gender .pill').forEach(p => p.classList.remove('sel')); pill.classList.add('sel'); }
    }
    setVal('c-level', capitaine.level);
    setVal('team-name', capitaine.TeamName);
    if (capitaine.jerseySize) {
        const pill = document.querySelector(`#c-jersey .pill[data-v="${capitaine.jerseySize}"]`);
        if (pill) { document.querySelectorAll('#c-jersey .pill').forEach(p => p.classList.remove('sel')); pill.classList.add('sel'); }
    }
    syncContestCheckbox('cap-3pts', capitaine.contest3pts);
    syncContestCheckbox('cap-dunk', capitaine.contestDunk);
}

function syncContestCheckbox(id, value) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on', !!value);
}

function chooseMode(m) {
    mode = m;
    saveAll();
    document.getElementById('mode-screen').style.display = 'none';
    document.getElementById('form-screen').style.display = 'block';
    const badge = document.getElementById('mode-badge-wrap');
    if (m === 'equipe') {
        badge.innerHTML = `<div class="mode-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Mode Équipe — 100.– CHF</div>`;
        document.getElementById('step1-label').textContent = 'Informations du capitaine';
        document.getElementById('team-name-section').style.display = 'block';
        document.getElementById('step2-next').textContent = 'Suivant — Joueurs →';
    } else {
        badge.innerHTML = `<div class="mode-badge solo"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Mode Solo — 15.– CHF</div>`;
        document.getElementById('step1-label').textContent = 'Vos informations';
        document.getElementById('team-name-section').style.display = 'none';
        document.getElementById('step2-next').textContent = 'Résumé & Paiement →';
    }
    buildStepper();
    injectCapContests();
    restoreFormFields();
    renderTit();
    renderRem();
    goStep(0);
}

function backToMode() {
    document.getElementById('mode-screen').style.display = 'block';
    document.getElementById('form-screen').style.display = 'none';
    mode = null;
    resetForm();
}
function normalizeEmail(email) {
    if (!email) return '';
    const lower = email.toLowerCase().trim();
    const [localRaw, domain] = lower.split('@');
    if (!domain) return lower;

    // Supprimer l'alias +tag
    let local = localRaw.split('+')[0];

    // Gmail : supprimer les points
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
        local = local.replace(/\./g, '');
    }

    // Supprimer les chiffres en fin de partie locale
    local = local.replace(/\d+$/, '');

    return `${local}@${domain}`;
}

function resetForm() {
    joueurs.length = 0;
    remplacants.length = 0;
    cguOn = false;
    capitaine = {};
    selectedPayment = null;
    saveAll();
    document.getElementById('cgu-chk')?.classList.remove('on');
}

function buildStepper() {
    const steps = mode === 'equipe' ? STEPS_EQUIPE : STEPS_SOLO;
    const nav = document.getElementById('step-nav');
    nav.innerHTML = steps.map((s, i) => `<div class="step-ind" id="si-${i}"><div class="step-circle">${i + 1}</div><div class="step-lbl">${s.label}</div></div>`).join('');
}

function updateStepper(currentIdx) {
    const total = mode === 'equipe' ? 4 : 3;
    for (let i = 0; i < total; i++) {
        const el = document.getElementById(`si-${i}`);
        if (!el) continue;
        el.classList.remove('active', 'done');
        if (i < currentIdx) el.classList.add('done');
        else if (i === currentIdx) el.classList.add('active');
    }
}

function goStep(i) {
    const prevIdx = currentStepIdx();
    if (i > prevIdx) {
        if (i >= 1 && !validateStep1()) return;
        if (i >= 2 && !validateStep2()) return;
        if (i === 3 && mode === 'equipe' && !validateStep3()) return;
    }
    const panelIdx = getPanelIdx(i);
    document.querySelectorAll('.panel').forEach((p, pi) => { p.classList.toggle('active', pi === panelIdx); });
    updateStepper(i);
    if (panelIdx === 3) {
        buildSummary();
        document.getElementById('step4-back').onclick = () => goStep(mode === 'equipe' ? 2 : 1);
    }
}

function getPanelIdx(stepIdx) {
    if (mode === 'solo') return stepIdx === 2 ? 3 : stepIdx;
    return stepIdx;
}

function currentStepIdx() {
    const panels = document.querySelectorAll('.panel');
    let activePanel = 0;
    panels.forEach((p, i) => { if (p.classList.contains('active')) activePanel = i; });
    if (mode === 'solo') return activePanel === 3 ? 2 : activePanel;
    return activePanel;
}

function selPill(group, target) {
    document.querySelector(`#${group}`).querySelectorAll('.pill').forEach(p => p.classList.remove('sel'));
    target.classList.add('sel');
    if (group === 'c-gender') capitaine.sexe = target.dataset.v;
    else capitaine.jerseySize = target.dataset.v;
    saveAll();
}

function toggleCapContest(field, el) {
    capitaine[field] = !capitaine[field];
    el.classList.toggle('on', !!capitaine[field]);
    saveAll();
}

function injectCapContests() {
    const step1 = document.getElementById('step1');
    if (!step1) return;
    document.getElementById('cap-contests-section')?.remove();
    document.getElementById('cap-contests-hr')?.remove();
    const hr = document.createElement('hr');
    hr.id = 'cap-contests-hr';
    const section = document.createElement('div');
    section.id = 'cap-contests-section';
    section.innerHTML = `
        <div class="contest-row">
            <div class="contest-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Contests (optionnel)
            </div>
            <div class="contest-checks">
                <div class="contest-check" onclick="toggleCapContest('contest3pts',document.getElementById('cap-3pts'))">
                    <div class="chk-box" id="cap-3pts"></div>
                    <svg class="contest-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                    <span>3-pts Contest</span>
                </div>
                <div class="contest-check" onclick="toggleCapContest('contestDunk',document.getElementById('cap-dunk'))">
                    <div class="chk-box" id="cap-dunk"></div>
                    <svg class="contest-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93c3.54 3.54 2.1 9.64 0 14.14"/><path d="M19.07 4.93c-3.54 3.54-2.1 9.64 0 14.14"/><path d="M2 12h20"/></svg>
                    <span>Dunk Contest</span>
                </div>
            </div>
        </div>`;
    const navBtns = step1.querySelector('.nav-btns');
    step1.insertBefore(hr, navBtns);
    step1.insertBefore(section, navBtns);
}

function validateStep1() {
    const first = document.getElementById('c-first')?.value.trim();
    const last = document.getElementById('c-last')?.value.trim();
    const email = normalizeEmail(document.getElementById('c-email')?.value.trim());
    const phone = document.getElementById('c-phone')?.value.trim();
    const birth = document.getElementById('c-birth')?.value;
    const sexe = document.querySelector('#c-gender .pill.sel')?.dataset?.v || null;
    const nameRx = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!first || !nameRx.test(first)) return showNotif('Prénom invalide', 'error'), false;
    if (!last || !nameRx.test(last)) return showNotif('Nom invalide', 'error'), false;
    if (!email || !emailRx.test(email)) return showNotif('Email invalide', 'error'), false;
    if (!phone || !/^[0-9+\s]{6,}$/.test(phone)) return showNotif('Téléphone invalide', 'error'), false;
    if (!birth) return showNotif('Date de naissance requise', 'error'), false;
    if (!isOldEnough(birth)) return showNotif('Tu dois avoir au moins 15 ans', 'error'), false;
    if (!sexe) return showNotif('Sélectionne un genre', 'error'), false;
    const cap3pts = document.getElementById('cap-3pts')?.classList.contains('on') || false;
    const capDunk = document.getElementById('cap-dunk')?.classList.contains('on') || false;
    Object.assign(capitaine, { firstName: first, lastName: last, email, phone, birth, sexe, statut: mode === 'solo' ? 'solo' : 'capitaine', contest3pts: cap3pts, contestDunk: capDunk });
    saveAll();
    return true;
}

function validateStep2() {
    const level = document.getElementById('c-level')?.value;
    const jersey = document.querySelector('#c-jersey .pill.sel')?.dataset?.v || null;
    if (!level) return showNotif('Sélectionne ton niveau', 'error'), false;
    if (!jersey) return showNotif('Choisis une taille de t-shirt', 'error'), false;
    capitaine.level = level;
    capitaine.jerseySize = jersey;
    if (mode === 'equipe') {
        const teamName = document.getElementById('team-name')?.value.trim();
        const teamRx = /^[a-zA-ZÀ-ÿ0-9\s-]{3,60}$/;
        if (!teamName || !teamRx.test(teamName)) return showNotif("Nom d'équipe invalide", 'error'), false;
        capitaine.TeamName = teamName;
    }
    saveAll();
    return true;
}

function validateStep3() {
    if (joueurs.length < 4) return showNotif(`Il manque ${4 - joueurs.length} titulaire(s)`, 'error'), false;
    const nameRx = /^[a-zA-ZÀ-ÿ\s-]{2,50}$/;
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < joueurs.length; i++) {
        const j = joueurs[i];
        if (!j.firstName || !nameRx.test(j.firstName)) return showNotif(`Titulaire ${i + 1} — Prénom invalide`, 'error'), false;
        if (!j.lastName || !nameRx.test(j.lastName)) return showNotif(`Titulaire ${i + 1} — Nom invalide`, 'error'), false;
        if (!j.email || !emailRx.test(j.email)) return showNotif(`Titulaire ${i + 1} — Email invalide`, 'error'), false;
        if (!j.sexe) return showNotif(`Titulaire ${i + 1} — Genre requis`, 'error'), false;
        if (!j.birth) return showNotif(`Titulaire ${i + 1} — Date de naissance requise`, 'error'), false;
        if (!isOldEnough(j.birth)) return showNotif(`Titulaire ${i + 1} — Doit avoir au moins 15 ans`, 'error'), false;
        if (!j.jerseySize) return showNotif(`Titulaire ${i + 1} — Taille t-shirt requise`, 'error'), false;
    }

    for (let i = 0; i < remplacants.length; i++) {
        const r = remplacants[i];
        if (!r.firstName || !nameRx.test(r.firstName)) return showNotif(`Remplaçant ${i + 1} — Prénom invalide`, 'error'), false;
        if (!r.lastName || !nameRx.test(r.lastName)) return showNotif(`Remplaçant ${i + 1} — Nom invalide`, 'error'), false;
        if (!r.email || !emailRx.test(r.email)) return showNotif(`Remplaçant ${i + 1} — Email invalide`, 'error'), false;
        if (!r.sexe) return showNotif(`Remplaçant ${i + 1} — Genre requis`, 'error'), false;
        if (!r.birth) return showNotif(`Remplaçant ${i + 1} — Date de naissance requise`, 'error'), false;
        if (!isOldEnough(r.birth)) return showNotif(`Remplaçant ${i + 1} — Doit avoir au moins 15 ans`, 'error'), false;
        if (!r.jerseySize) return showNotif(`Remplaçant ${i + 1} — Taille t-shirt requise`, 'error'), false;
    }

    // Vérifier les emails en double dans l'équipe (capitaine inclus)
    const allEmails = [
        { email: capitaine.email, label: 'Capitaine' },
        ...joueurs.map((j, i) => ({ email: j.email, label: `Titulaire ${i + 1}` })),
        ...remplacants.map((r, i) => ({ email: r.email, label: `Remplaçant ${i + 1}` }))
    ];

    const seen = new Map(); // email normalisé → label du premier porteur
    for (const { email, label } of allEmails) {
        const norm = normalizeEmail(email);
        if (seen.has(norm)) {
            return showNotif(`Email en double : ${label} a le même email que ${seen.get(norm)}`, 'error'), false;
        }
        seen.set(norm, label);
    }

    return true;
}

function isOldEnough(birth) {
    if (!birth) return false;
    const [y, m, d] = birth.split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - y;
    if (today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d)) age--;
    return age >= 15;
}

function addTitulaire() {
    if (joueurs.length >= 4) return;
    joueurs.push({ id: joueurs.length + 1, firstName: '', lastName: '', email: '', statut: 'titulaire', birth: '', sexe: '', jerseySize: '', contest3pts: false, contestDunk: false });
    saveAll(); renderTit();
}

function renderTit() {
    const list = document.getElementById('tit-list');
    if (!list) return;
    list.innerHTML = joueurs.map((p, i) => playerCard(p, i, 'tit')).join('');
    document.getElementById('tit-n').textContent = joueurs.length;
    document.getElementById('add-tit-btn').style.display = joueurs.length >= 4 ? 'none' : 'flex';
}

function addRemplacant() {
    if (remplacants.length >= 2) return;
    remplacants.push({ id: remplacants.length + 1, firstName: '', lastName: '', email: '', statut: 'remplacant', birth: '', sexe: '', jerseySize: '', contest3pts: false, contestDunk: false });
    saveAll(); renderRem();
}

function renderRem() {
    const list = document.getElementById('rem-list');
    if (!list) return;
    list.innerHTML = remplacants.map((p, i) => playerCard(p, i, 'rem')).join('');
    document.getElementById('rem-n').textContent = remplacants.length;
    document.getElementById('add-rem-btn').style.display = remplacants.length >= 2 ? 'none' : 'flex';
    const remCount = document.getElementById('rem-count');
    if (remCount) remCount.style.display = remplacants.length > 0 ? 'flex' : 'none';
}

function contestFieldsHtml(type, idx, p) {
    return `
    <div class="contest-row">
        <div class="contest-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Contests (optionnel)
        </div>
        <div class="contest-checks">
            <div class="contest-check" onclick="togglePlayerContest('${type}',${idx},'contest3pts',this)">
                <div class="chk-box ${p.contest3pts ? 'on' : ''}"></div>
                <svg class="contest-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                <span>3-pts Contest</span>
            </div>
            <div class="contest-check" onclick="togglePlayerContest('${type}',${idx},'contestDunk',this)">
                <div class="chk-box ${p.contestDunk ? 'on' : ''}"></div>
                <svg class="contest-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93c3.54 3.54 2.1 9.64 0 14.14"/><path d="M19.07 4.93c-3.54 3.54-2.1 9.64 0 14.14"/><path d="M2 12h20"/></svg>
                <span>Dunk Contest</span>
            </div>
        </div>
    </div>`;
}

function playerCard(p, idx, type) {
    const isRem = type === 'rem';
    const updateFn = isRem ? 'updateRem' : 'updateTit';
    const removeFn = isRem ? 'removeRem' : 'removeTit';
    const isComplete = p.firstName && p.lastName && p.email && p.sexe && p.birth && p.jerseySize;
    const statusIcon = isComplete
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF9A50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`;
    const displayName = p.firstName || p.lastName ? `${p.firstName} ${p.lastName}`.trim() : `Joueur ${idx + 1}`;
    return `
    <div class="player-card" id="${type}-card-${idx}">
        <div class="player-accordion-header" onclick="toggleCard('${type}-body-${idx}',this)">
            <div class="player-header-left">
                <span class="accordion-arrow">›</span>
                <span class="player-name">${displayName}</span>
            </div>
            <div class="player-header-right">
                <span class="status-icon">${statusIcon}</span>
                <button class="remove-btn" onclick="event.stopPropagation();${removeFn}(${idx})">Retirer</button>
            </div>
        </div>
        <div class="player-body" id="${type}-body-${idx}" style="display:none;">
            <div class="row">
                <div class="field"><label>Prénom <span class="req">*</span></label><input type="text" placeholder="Prénom" value="${p.firstName}" oninput="${updateFn}(${idx},'firstName',this.value);updateCardHeader('${type}',${idx})"/></div>
                <div class="field"><label>Nom <span class="req">*</span></label><input type="text" placeholder="Nom" value="${p.lastName}" oninput="${updateFn}(${idx},'lastName',this.value);updateCardHeader('${type}',${idx})"/></div>
            </div>
            <div class="row">
                <div class="field"><label>Email <span class="req">*</span></label><input type="email" placeholder="email@exemple.com" value="${p.email}" oninput="${updateFn}(${idx},'email',this.value)"/></div>
                <div class="field"><label>Date de naissance <span class="req">*</span></label><input type="date" max="2010-12-31" value="${p.birth}" oninput="${updateFn}(${idx},'birth',this.value)"/></div>
            </div>
            <div class="row">
                <div class="field">
                    <label>Genre <span class="req">*</span></label>
                    <div class="pills">
                        <div class="pill ${p.sexe === 'male' ? 'sel' : ''}" onclick="${updateFn}(${idx},'sexe','male');this.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');updateCardHeader('${type}',${idx})">Homme</div>
                        <div class="pill ${p.sexe === 'female' ? 'sel' : ''}" onclick="${updateFn}(${idx},'sexe','female');this.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');updateCardHeader('${type}',${idx})">Femme</div>
                        <div class="pill ${p.sexe === 'other' ? 'sel' : ''}" onclick="${updateFn}(${idx},'sexe','other');this.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');updateCardHeader('${type}',${idx})">Autre</div>
                    </div>
                </div>
                <div class="field">
                    <label>Taille t-shirt</label>
                    <div class="pills">
                        ${['S', 'M', 'L', 'XL', 'XXL'].map(s => `<div class="pill ${p.jerseySize === s ? 'sel' : ''}" onclick="${updateFn}(${idx},'jerseySize','${s}');this.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');updateCardHeader('${type}',${idx})">${s}</div>`).join('')}
                    </div>
                </div>
            </div>
            ${contestFieldsHtml(type, idx, p)}
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
    card.querySelector('.player-name').textContent = p.firstName || p.lastName ? `${p.firstName} ${p.lastName}`.trim() : `Joueur ${idx + 1}`;
}

function togglePlayerContest(type, idx, field, clickedEl) {
    const list = type === 'rem' ? remplacants : joueurs;
    if (!list[idx]) return;
    list[idx][field] = !list[idx][field];
    const chk = clickedEl.querySelector('.chk-box');
    if (chk) chk.classList.toggle('on', !!list[idx][field]);
    saveAll();
}

function removeTit(idx) { joueurs.splice(idx, 1); saveAll(); renderTit(); }
function updateTit(idx, field, val) { joueurs[idx][field] = val; saveAll(); }
function removeRem(idx) { remplacants.splice(idx, 1); saveAll(); renderRem(); }
function updateRem(idx, field, val) { remplacants[idx][field] = val; saveAll(); }

function toggleRemSection() {
    const section = document.getElementById('replacements-section');
    const toggle = document.getElementById('rem-toggle');
    const isOpen = section.classList.contains('open');
    section.classList.toggle('open', !isOpen);
    toggle.classList.toggle('active', !isOpen);
}

// ─── Résumé ───────────────────────────────────────────────────────────────────

function buildSummary() {
    const lvlEl = document.getElementById('c-level');
    const level = lvlEl.options[lvlEl.selectedIndex]?.text || '—';
    const initials = p => ((p.firstName?.[0] || '') + (p.lastName?.[0] || '')).toUpperCase() || '?';
    const jerseyLabel = p => p.jerseySize ? ` · t-shirt ${p.jerseySize}` : '';
    const contestLabel = p => {
        const tags = [];
        if (p.contest3pts) tags.push(`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> 3-pts`);
        if (p.contestDunk) tags.push(`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93c3.54 3.54 2.1 9.64 0 14.14"/><path d="M19.07 4.93c-3.54 3.54-2.1 9.64 0 14.14"/><path d="M2 12h20"/></svg> Dunk`);
        return tags.length ? `<span class="contest-tag">${tags.join(' · ')}</span>` : '';
    };
    let allPlayers, total, totalDetail, teamName;
    if (mode === 'equipe') {
        allPlayers = [
            { obj: capitaine, role: 'cap', label: 'Capitaine' },
            ...joueurs.map(p => ({ obj: p, role: 'tit', label: 'Titulaire' })),
            ...remplacants.map(p => ({ obj: p, role: 'rem', label: 'Remplaçant' }))
        ];
        total = 100; totalDetail = 'Équipe forfait — prix fixe'; teamName = capitaine.TeamName || '—';
    } else {
        allPlayers = [{ obj: capitaine, role: 'cap', label: 'Joueur Solo' }];
        total = 15; totalDetail = 'Inscription individuelle'; teamName = 'Inscription Solo';
    }

    document.getElementById('summary').innerHTML = `
        <div class="team-hero">
            <div class="team-avatar"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>
            <div><div class="team-title">${teamName}</div><div class="team-subtitle">Tournoi 5c5 · Juin 2026 · Plan-les-Ouates</div></div>
        </div>
        <div class="meta-row">
            <div class="meta-chip"><strong>${level}</strong></div>
            <div class="meta-chip">Format <strong>5c5</strong></div>
            <div class="meta-chip"><strong>${allPlayers.length}</strong> joueur${allPlayers.length > 1 ? 's' : ''}</div>
            <div class="meta-chip">Mode <strong>${mode === 'equipe' ? 'Équipe' : 'Solo'}</strong></div>
        </div>
        <hr>
        <div class="summary-players">
            ${allPlayers.map(({ obj: p, role, label }) => `
                <div class="summary-player-row">
                    <div class="player-avatar ${role}">${initials(p)}</div>
                    <div class="player-info">
                        <div class="player-full-name">${(p.firstName + ' ' + p.lastName).trim() || '—'}</div>
                        <div class="player-role-badge ${role}">${label}${jerseyLabel(p)}</div>
                        ${contestLabel(p)}
                    </div>
                </div>
            `).join('')}
        </div>`;

    document.getElementById('total-box').innerHTML = `
        <div class="total-left">
            <div class="total-label">Total à payer</div>
            <div class="total-detail">${totalDetail}</div>
        </div>
        <div>
            <div class="total-amount">${total}.–</div>
            <div class="total-currency">CHF</div>
        </div>`;

    renderPaymentSelector(total);
    updateSubmitBtn();
}

// ─── Sélecteur de méthode de paiement (Twint & IBAN uniquement) ───────────────

function renderPaymentSelector(total) {
    document.getElementById('payment-selector')?.remove();
    const container = document.createElement('div');
    container.id = 'payment-selector';
    container.innerHTML = `
        <div class="payment-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Mode de paiement
        </div>
        <div class="payment-methods">

            <div class="payment-method" id="pm-twint" onclick="selectPayment('twint')">
                <div class="pm-icon pm-icon-twint">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                </div>
                <div class="pm-info">
                    <div class="pm-name">Twint</div>
                    <div class="pm-desc">Paiement instantané par application</div>
                </div>
                <div class="pm-check" id="pm-check-twint"></div>
            </div>

            <div class="payment-method" id="pm-iban" onclick="selectPayment('iban')">
                <div class="pm-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div class="pm-info">
                    <div class="pm-name">Virement bancaire (IBAN)</div>
                    <div class="pm-desc">PostFinance · Confirmation sous 48h</div>
                </div>
                <div class="pm-check" id="pm-check-iban"></div>
            </div>

        </div>

        <!-- Instructions Twint -->
        <div class="payment-instructions" id="pi-twint" style="display:none;">
            <div class="pi-header pi-header-twint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                Instructions Twint
            </div>
            <div class="pi-body">
                <div class="pi-step"><div class="pi-step-num">1</div><div>Ouvre ton application <strong>Twint</strong></div></div>
                <div class="pi-step"><div class="pi-step-num">2</div><div>Envoie <strong>${total}.– CHF</strong> au numéro :</div></div>
                <div class="pi-value-box">
                    <span class="pi-value">078 610 03 19</span>
                    <button class="pi-copy-btn" onclick="copyToClipboard('0786100319', this)">Copier</button>
                </div>
                <div class="pi-step"><div class="pi-step-num">3</div><div>Dans le message, indique ta <strong>référence d'inscription</strong> (disponible après confirmation)</div></div>
                <div class="pi-note">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Ta place est réservée dès réception du paiement.
                </div>
            </div>
        </div>

        <!-- Instructions IBAN -->
        <div class="payment-instructions" id="pi-iban" style="display:none;">
            <div class="pi-header pi-header-iban">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Coordonnées bancaires
            </div>
            <div class="pi-body">
                <div class="pi-row"><div class="pi-row-label">Bénéficiaire</div><div class="pi-row-val">Noah Bang</div></div>
                <div class="pi-row"><div class="pi-row-label">Banque</div><div class="pi-row-val">PostFinance</div></div>
                <div class="pi-row">
                    <div class="pi-row-label">IBAN</div>
                    <div class="pi-row-val pi-row-copy">
                        <span>CH21 0900 0000 1688 3932 6</span>
                        <button class="pi-copy-btn" onclick="copyToClipboard('CH2109000000168839326', this)">Copier</button>
                    </div>
                </div>
                <div class="pi-row"><div class="pi-row-label">Montant</div><div class="pi-row-val"><strong>${total}.– CHF</strong></div></div>
                <div class="pi-row"><div class="pi-row-label">Message</div><div class="pi-row-val pi-muted">Ton nom + référence (dispo après inscription)</div></div>
                <div class="pi-note">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Inscription confirmée manuellement sous 48h après réception du virement.
                </div>
            </div>
        </div>`;

    const cguSection = document.getElementById('cgu-section');
    if (cguSection) cguSection.parentNode.insertBefore(container, cguSection);
    else document.querySelectorAll('.panel')[3]?.appendChild(container);
}

function selectPayment(method) {
    selectedPayment = method;
    ['twint', 'iban'].forEach(m => {
        document.getElementById(`pm-${m}`)?.classList.toggle('selected', m === method);
        const chk = document.getElementById(`pm-check-${m}`);
        if (chk) chk.innerHTML = m === method
            ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
            : '';
    });
    document.getElementById('pi-twint').style.display = method === 'twint' ? 'block' : 'none';
    document.getElementById('pi-iban').style.display = method === 'iban' ? 'block' : 'none';
    updateSubmitBtn();
}

function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓ Copié';
        btn.style.background = '#1D9E75';
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2000);
    });
}

// ─── CGU & activation du bouton submit ───────────────────────────────────────

function toggleCgu() {
    cguOn = !cguOn;
    document.getElementById('cgu-chk').classList.toggle('on', cguOn);
    updateSubmitBtn();
}

function updateSubmitBtn() {
    const btn = document.querySelector('.stripe-btn');
    if (!btn) return;
    btn.disabled = !(cguOn && selectedPayment);
}

// ─── Soumission ───────────────────────────────────────────────────────────────

async function submitForm() {
    if (!cguOn) return showNotif("Veuillez accepter les conditions d'inscription", 'error');
    if (!selectedPayment) return showNotif('Veuillez choisir un mode de paiement', 'error');

    const btn = document.querySelector('.stripe-btn'); // ← monté ici

    // Vérifier les emails en double dans la même équipe
    const allEmails = [
        capitaine.email,
        ...joueurs.map(j => j.email),
        ...remplacants.map(r => r.email)
    ].map(e => normalizeEmail(e));

    const emailSet = new Set();
    for (const email of allEmails) {
        if (emailSet.has(email)) {
            showNotif(`L'email ${email} est utilisé plusieurs fois dans l'équipe`, 'error');
            return; // btn pas encore désactivé donc pas besoin de le réactiver
        }
        emailSet.add(email);
    }

    btn.disabled = true;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Enregistrement…`;

    try {
        const apiBase = 'https://h4ac-backend.onrender.com';
        const res = await fetch(`${apiBase}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode, capitaine, joueurs, remplacants, paymentMethod: selectedPayment }),
        });
        const data = await res.json();
        if (!res.ok) {
            showNotif(data.error || "Erreur lors de l'inscription", 'error');
            btn.disabled = false;
            btn.textContent = "Confirmer l'inscription →";
            return;
        }
        showConfirmationScreen(data.referenceCode, selectedPayment);
    } catch (err) {
        console.error('Erreur réseau:', err);
        showNotif('Impossible de contacter le serveur', 'error');
        btn.disabled = false;
        btn.textContent = "Confirmer l'inscription →";
    }
}

// ─── Écran de confirmation ────────────────────────────────────────────────────

function showConfirmationScreen(refCode, paymentMethod) {
    const total = mode === 'equipe' ? 100 : 15;
    const isTwint = paymentMethod === 'twint';
    const paymentBlock = isTwint ? `
        <div class="confirm-payment-block confirm-twint">
            <div class="cpb-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                Finalise ton paiement via Twint
            </div>
            <div class="cpb-steps">
                <div class="cpb-step"><span class="cpb-num">1</span> Ouvre ton app <strong>Twint</strong></div>
                <div class="cpb-step"><span class="cpb-num">2</span> Envoie <strong>${total}.– CHF</strong> au :</div>
            </div>
            <div class="cpb-value-row">
                <span class="cpb-value">078 610 03 19</span>
                <button class="pi-copy-btn" onclick="copyToClipboard('0786100319', this)">Copier</button>
            </div>
            <div class="cpb-step" style="margin-top:12px;"><span class="cpb-num">3</span> Dans le message : <strong>${refCode}</strong></div>
            <div class="cpb-note">Ta place est réservée dès réception du paiement.</div>
        </div>` : `
        <div class="confirm-payment-block confirm-iban">
            <div class="cpb-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Effectue ton virement bancaire
            </div>
            <div class="cpb-rows">
                <div class="cpb-row"><span>Bénéficiaire</span><strong>Noah Bang</strong></div>
                <div class="cpb-row"><span>Banque</span><strong>PostFinance</strong></div>
                <div class="cpb-row">
                    <span>IBAN</span>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <strong>CH21 0900 0000 1688 3932 6</strong>
                        <button class="pi-copy-btn" onclick="copyToClipboard('CH2109000000168839326', this)">Copier</button>
                    </div>
                </div>
                <div class="cpb-row"><span>Montant</span><strong>${total}.– CHF</strong></div>
                <div class="cpb-row"><span>Message</span><strong>${refCode}</strong></div>
            </div>
            <div class="cpb-note">Confirmation de ta place sous 48h après réception du virement.</div>
        </div>`;

    document.getElementById('form-screen').innerHTML = `
        <div class="confirm-screen">
            <div class="confirm-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h1 class="confirm-title">Inscription enregistrée !</h1>
            <p class="confirm-sub">Il ne reste plus qu'à finaliser le paiement pour bloquer ta place.</p>
            <div class="confirm-ref-box">
                <div class="confirm-ref-label">Référence d'inscription</div>
                <div class="confirm-ref-code">${refCode}</div>
                <div class="confirm-ref-hint">Garde-la pour tout échange avec l'organisation.</div>
            </div>
            ${paymentBlock}
            <div class="confirm-footer-note">Une question ? <a href="https://h4ac.ch" style="color:#E91E8C;">h4ac.ch</a></div>

            <!-- Notification de redirection -->
            <div id="redirect-notif" style="display:none; margin-top:24px; padding:12px 16px; background:#f0f0f0; border-radius:8px; text-align:center; font-size:14px; color:#555;">
                Redirection vers l'accueil dans <strong id="redirect-countdown">3</strong> secondes…
            </div>
        </div>`;

    localStorage.removeItem('h4ac_mode');
    localStorage.removeItem('h4ac_capitaine');
    localStorage.removeItem('h4ac_joueurs');
    localStorage.removeItem('h4ac_remplacants');

    // Affiche la notif 3 secondes avant la redirection (à t=7s sur 10s)
    setTimeout(() => {
        const notif = document.getElementById('redirect-notif');
        if (notif) notif.style.display = 'block';

        let count = 3;
        const interval = setInterval(() => {
            count--;
            const el = document.getElementById('redirect-countdown');
            if (el) el.textContent = count;
            if (count <= 0) clearInterval(interval);
        }, 1000);
    }, 7000);

    setTimeout(() => {
        window.location = 'index.html';
    }, 10000);
}

// ─── Notifications ────────────────────────────────────────────────────────────

function showNotif(msg, type) {
    const t = document.getElementById('toast');
    t.classList.remove('show', 'error', 'success', 'warning');
    t.textContent = msg;
    void t.offsetWidth;
    t.classList.add('show', type);
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show', type), 4000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('c-phone')?.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '');
        v = v.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
        e.target.value = v.trim();
    });
    document.querySelectorAll('#step1 input, #step2 input, #step2 select').forEach(el => {
        el.addEventListener('input', saveAll);
        el.addEventListener('change', saveAll);
    });
    const savedMode = loadAll();
    if (savedMode === 'equipe' || savedMode === 'solo') chooseMode(savedMode);
});