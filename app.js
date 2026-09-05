const API_BASE_URL = (window.__ROSTERGRADE_API_URL__ || '').replace(/\/$/, '') || 'http://localhost:8000';
const $ = (selector) => document.querySelector(selector);
const state = { user: null, accountMode: 'register' };
const api = (path, options = {}) => fetch(`${API_BASE_URL}${path}`, {
  credentials: 'include',
  headers: { Accept: 'application/json', ...options.headers },
  ...options,
});

function csrfToken() {
  return document.cookie.split('; ').find((item) => item.startsWith('rostergrade_csrf='))?.split('=')[1] || '';
}

function setStatus(text, healthy = true) {
  $('#service-status').textContent = text;
  $('.live-dot').style.background = healthy ? 'var(--green)' : '#cf7777';
  $('.live-dot').style.boxShadow = healthy ? '0 0 12px var(--green)' : '0 0 12px #cf7777';
}

function renderAccount() {
  $('#account-label').textContent = state.user ? state.user.display_name : 'Signed out';
  $('#account-button').textContent = state.user ? state.user.display_name.slice(0, 2).toUpperCase() : 'GP';
}

function clearAccountSecrets() {
  $('#account-password').value = '';
  $('#account-password-confirm').value = '';
}

function openModal(id) { $(id).classList.remove('hidden'); $(id).setAttribute('aria-hidden', 'false'); }
function closeModal(id) {
  $(id).classList.add('hidden');
  $(id).setAttribute('aria-hidden', 'true');
  if (id === '#account-modal') clearAccountSecrets();
}

function renderPlayers(lineup) {
  const players = $('#players');
  players.replaceChildren();
  if (!lineup.length) {
    players.innerHTML = '<p class="empty-state">No lineup data returned by the API.</p>';
    $('#lineup-total').textContent = '—';
    return;
  }
  const total = lineup.reduce((sum, player) => sum + Number(player.projected_points || 0), 0);
  $('#lineup-total').textContent = `${total.toFixed(1)} pts`;
  lineup.forEach((player) => {
    const row = document.createElement('div');
    row.className = 'player-row';
    const projection = player.projection;
    const freshness = projection?.freshness === 'stale' ? ' · stale' : '';
    const source = projection?.source === 'espn' ? 'ESPN' : projection?.source === 'rostergrade-position-baseline' ? 'Estimate' : '';
    row.innerHTML = `<strong class="player-name">${player.name || 'Unnamed player'}</strong><span class="player-meta"><span class="position">${player.lineup_slot || player.position || '—'}</span><b class="player-points">${Number(player.projected_points || 0).toFixed(1)} pts</b><small class="player-provenance">${source}${freshness}</small></span>`;
    players.append(row);
  });
}

function renderProjection(projection) {
  const note = $('#projection-note');
  if (!projection || projection.status === 'sample') {
    note.textContent = 'Sample projections · connect your ESPN league for owned-roster estimates';
    return;
  }
  const label = projection.freshness === 'stale' ? 'Stale projections' : projection.status === 'estimated' ? 'Position baseline estimates' : projection.status === 'projected' ? 'ESPN league projections' : 'Projection data';
  const timestamp = projection.fetched_at ? ` · refreshed ${new Date(projection.fetched_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : '';
  note.textContent = `${label} · ${projection.player_count || 0} players${timestamp}`;
}

function renderRoster(data) {
  const players = data.players || [];
  $('#league-count').textContent = data.source === 'espn' ? 'Live roster' : 'Sample roster';
  if (data.league) {
    $('#league-content').innerHTML = `<div class="league-live"><div class="empty-icon">◈</div><strong>${data.league.name}</strong><p>${data.league.season} season · ${players.length} players loaded</p></div>`;
  }
}

async function loadAccount() {
  try {
    const response = await api('/auth/me');
    if (response.ok) state.user = (await response.json()).user;
  } catch { state.user = null; }
  renderAccount();
}

async function loadDashboard() {
  $('#optimizer-status').textContent = 'Loading';
  try {
    const [health, optimization, providers, roster] = await Promise.all([
      api('/health'), api('/api/recommendations'), api('/auth/providers'), api('/api/roster')
    ]);
    if (!health.ok || !optimization.ok || !roster.ok) throw new Error('API request failed');
    const healthData = await health.json();
    const lineupData = await optimization.json();
    await providers.json();
    const rosterData = await roster.json();
    renderRoster(rosterData);
    renderPlayers(lineupData.lineup || []);
    renderProjection(lineupData.projection || rosterData.projection);
    $('#recommendation-explanation').textContent = lineupData.explanation || '';
    $('#optimizer-status').textContent = lineupData.status === 'sample' ? 'Sample data' : 'Live';
    $('#optimizer-status').className = 'pill amber-pill';
    setStatus(`${healthData.service || 'API'} online`);
    $('#last-sync').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch (error) {
    setStatus('API unavailable', false);
    $('#optimizer-status').textContent = 'Offline';
    $('#players').innerHTML = '<p class="empty-state">Connect the API to load optimization data.</p>';
    $('#lineup-total').textContent = '—';
    $('#projection-note').textContent = 'Projection status unavailable';
  }
}

function setAccountMode(mode) {
  state.accountMode = mode;
  const registering = mode === 'register';
  $('#account-title').textContent = registering ? 'Keep your roster yours.' : 'Welcome back.';
  $('.modal-copy').textContent = registering ? 'Create a native RosterGrade account to save leagues and rosters under your ownership.' : 'Sign in to access your saved leagues and rosters.';
  $('#display-name-field').classList.toggle('hidden', !registering);
  $('#confirm-password-field').classList.toggle('hidden', !registering);
  $('#account-password-confirm').required = registering;
  $('#account-password-confirm').value = '';
  $('#account-password').autocomplete = registering ? 'new-password' : 'current-password';
  $('#account-submit').textContent = registering ? 'Create account' : 'Sign in';
  $('#account-switch').textContent = registering ? 'Already have an account? Sign in' : 'New to RosterGrade? Create an account';
  $('#account-feedback').textContent = '';
}

$('#account-button').addEventListener('click', async () => {
  if (state.user) {
    await api('/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken() } });
    state.user = null;
    renderAccount();
    await loadDashboard();
    return;
  }
  setAccountMode('register');
  openModal('#account-modal');
});
$('#account-close').addEventListener('click', () => closeModal('#account-modal'));
$('#sync-close').addEventListener('click', () => closeModal('#sync-modal'));
$('#account-switch').addEventListener('click', () => setAccountMode(state.accountMode === 'register' ? 'login' : 'register'));

$('#account-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = $('#account-feedback');
  feedback.textContent = 'Working…';
  const registering = state.accountMode === 'register';
  if (registering && $('#account-password').value !== $('#account-password-confirm').value) {
    feedback.textContent = 'Passwords do not match.';
    $('#account-password-confirm').focus();
    return;
  }
  const body = { email: $('#account-email').value, password: $('#account-password').value };
  if (registering) body.display_name = $('#account-name').value;
  try {
    const response = await api(registering ? '/auth/register' : '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || 'Could not complete account request');
    state.user = result.user;
    renderAccount();
    closeModal('#account-modal');
    await loadDashboard();
  } catch (error) { feedback.textContent = error.message; }
});

$('#sync-button').addEventListener('click', () => {
  if (!state.user) { setAccountMode('register'); openModal('#account-modal'); return; }
  $('#sync-form-feedback').textContent = '';
  openModal('#sync-modal');
});
$('#sync-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = $('#sync-form-feedback');
  feedback.textContent = 'Fetching your ESPN league securely…';
  try {
    const response = await api('/leagues/espn/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken() },
      body: JSON.stringify({ league_id: $('#sync-league-id').value, season: Number($('#sync-season').value), espn_s2: $('#sync-s2').value || null, swid: $('#sync-swid').value || null }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || 'ESPN sync failed');
    closeModal('#sync-modal');
    $('#sync-feedback').textContent = 'League synced. Your credentials were not saved.';
    await loadDashboard();
  } catch (error) { feedback.textContent = error.message; }
});

$('#refresh-button').addEventListener('click', loadDashboard);
$('#lineup-refresh').addEventListener('click', loadDashboard);
$('#projection-refresh').addEventListener('click', async () => {
  if (!state.user) { setAccountMode('register'); openModal('#account-modal'); return; }
  $('#projection-note').textContent = 'Refreshing projections…';
  try {
    const response = await api('/api/projections/refresh', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken() } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || 'Projection refresh failed');
    await loadDashboard();
  } catch (error) { $('#projection-note').textContent = error.message; }
});
loadAccount().then(loadDashboard);
