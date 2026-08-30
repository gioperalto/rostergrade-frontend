export function findPlayerById<T extends Player>(players: T[], id: string): T | null;
export function projectionDisplay(player: Player, mode?: 'season' | 'game'): number | null;
export type Player = { id: string; projected_points?: number | null; projected_points_per_game?: number | null };
