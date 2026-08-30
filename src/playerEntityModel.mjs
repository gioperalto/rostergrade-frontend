export function findPlayerById(players, id) {
  return players.find((player) => player.id === id) ?? null;
}

export function projectionDisplay(player, mode = 'season') {
  const value = mode === 'game' ? player.projected_points_per_game : player.projected_points;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}
