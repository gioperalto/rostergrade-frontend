export function findPlayerById(players, id) {
  return players.find((player) => player.id === id) ?? null;
}

export function decodePlayerRouteId(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function getPlayerSlotLabel(player) {
  const position = typeof player?.position === 'string' ? player.position.trim() : '';
  const suppliedSlot = typeof player?.slot === 'string' ? player.slot.trim() : '';
  const suppliedLabel = typeof player?.position_label === 'string' ? player.position_label.trim() : '';
  const supplied = suppliedSlot || suppliedLabel;
  if (supplied && supplied.toLowerCase() !== 'starter') return supplied;
  if (position === 'K' || position === 'D/ST') return position;
  const rank = typeof player?.position_rank === 'number' && Number.isFinite(player.position_rank) && player.position_rank > 0 ? player.position_rank : '';
  return `${position}${rank}` || 'Unknown';
}

export function projectionDisplay(player, mode = 'season') {
  const value = mode === 'game' ? player.projected_points_per_game : player.projected_points;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}
