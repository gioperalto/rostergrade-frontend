const API_BASE_URL = (window.__ROSTERGRADE_API_URL__ || '').replace(/\/$/, '') || 'http://localhost:8000';
const $ = (selector) => document.querySelector(selector);
const api = (path, options = {}) => fetch(`${API_BASE_URL}${path}`, { headers: { Accept: 'application/json', ...options.headers }, ...options });

function setStatus(text, healthy = true) {
  $('#service-status').textContent = text;
  $('.live-dot').style.background = healthy ? 'var(--green)' : '#cf7777';
  $('.live-dot').style.boxShadow = healthy ? '0 0 12px var(--green)' : '0 0 12px #cf7777';
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
    row.className = 'player';
    row.innerHTML = `<span class="position">${player.position || '—'}</span><strong>${player.name || 'Unnamed player'}</strong><b>${Number(player.projected_points || 0).toFixed(1)}</b>`;
    players.append(row);
  });
}

function renderRoster(data) {
  const players = data.players || [];
  $('#league-count').textContent = data.source === 'espn' ? 'Live roster' : 'Sample roster';
  if (data.league) {
    $('#league-content').innerHTML = `<div class="league-live"><div class="empty-icon">◈</div><strong>${data.league.name}</strong><p>${data.league.season} season · ${players.length} players loaded</p></div>`;
  }
}

async function loadDashboard() {
  $('#optimizer-status').textContent = 'Loading';
  try {
    const [health, optimization, providers, roster] = await Promise.all([
      api('/health'), api('/api/optimization'), api('/auth/providers'), api('/api/roster')
    ]);
    if (!health.ok || !optimization.ok || !roster.ok) throw new Error('API request failed');
    const healthData = await health.json();
    const lineupData = await optimization.json();
    await providers.json();
    const rosterData = await roster.json();
    renderRoster(rosterData);
    renderPlayers(lineupData.lineup || []);
    $('#optimizer-status').textContent = lineupData.status === 'sample' ? 'Sample data' : 'Live';
    $('#optimizer-status').className = 'pill amber-pill';
    setStatus(`${healthData.service || 'API'} online`);
    $('#last-sync').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch (error) {
    setStatus('API unavailable', false);
    $('#optimizer-status').textContent = 'Offline';
    $('#players').innerHTML = '<p class="empty-state">Connect the API to load optimization data.</p>';
    $('#lineup-total').textContent = '—';
  }
}

$('#refresh-button').addEventListener('click', loadDashboard);
$('#lineup-refresh').addEventListener('click', loadDashboard);
$('#sync-button').addEventListener('click', async () => {
  const feedback = $('#sync-feedback');
  feedback.textContent = 'ESPN sync is initiated through the API dashboard.';
  try {
    const response = await api('/leagues/espn/sync', { method: 'POST' });
    const result = response.ok ? await response.json() : { status: 'error' };
    if (result.status === 'ok') {
      feedback.textContent = 'Sync completed. Refreshing league data…';
      await loadDashboard();
    } else {
      feedback.textContent = result.message || 'ESPN sync needs API credentials.';
    }
  } catch { feedback.textContent = 'API unavailable. Try again when the service is online.'; }
});
loadDashboard();
