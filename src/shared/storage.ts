const key = (game: string) => `retroarcade:highscore:${game}`;

export function getHighScore(game: string): number {
  try {
    const raw = localStorage.getItem(key(game));
    if (raw === null || raw.trim() === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function submitScore(game: string, score: number): number {
  const current = getHighScore(game);
  if (!Number.isFinite(score) || score < 0) return current;
  const best = Math.max(current, score);
  if (best !== current) {
    try {
      localStorage.setItem(key(game), String(best));
    } catch {
      // storage unavailable; ignore
    }
  }
  return best;
}
