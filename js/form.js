const btn = document.getElementById('submit-btn');
const emailInput = document.getElementById('email');
const websiteInput = document.getElementById('website');
const msg = document.getElementById('msg');

function setMsg(text, type) {
  msg.textContent = text;
  msg.className = type;
}

emailInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSubmit();
});

btn.addEventListener('click', handleSubmit);

async function handleSubmit() {
  const email = emailInput.value.trim();
  const website = websiteInput.value;

  if (!email) {
    setMsg('Entre ton email.', 'error');
    return;
  }

  const lastSubmit = localStorage.getItem('lastSubmit');
  if (lastSubmit && Date.now() - Number(lastSubmit) < 10000) {
    setMsg('Attends quelques secondes...', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = '...';
  setMsg('', '');

  try {
    const res = await fetch('https://hoop4cause.onrender.com/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, website })
    });

    if (res.status === 429) {
      setMsg('Trop de tentatives, réessaie dans une minute.', 'error');
      btn.disabled = false;
      btn.textContent = 'Me notifier';
      return;
    }

    const data = await res.json();
    localStorage.setItem('lastSubmit', Date.now());

    if (data.success) {
      setMsg('✓ ' + data.message + ' — Redirection...', 'success');
      emailInput.value = '';
      btn.textContent = '✓';
      setTimeout(() => { window.location.href = '/'; }, 2500);
    } else {
      setMsg(data.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Me notifier';
    }

  } catch {
    setMsg('Erreur réseau, réessaie.', 'error');
    btn.disabled = false;
    btn.textContent = 'Me notifier';
  }
}