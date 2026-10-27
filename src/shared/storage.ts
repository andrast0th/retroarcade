const key = (game: string) => `retroarcade:highscore:${game}`;

export function getHighScore(game: string): number {
  try {
    return Number(localStorage.getItem(key(game))) || 0;
  } catch {
    return 0;
  }
}

export function submitScore(game: string, score: number): number {
  const best = Math.max(getHighScore(game), score);
  try {
    localStorage.setItem(key(game), String(best));
  } catch {
    // storage unavailable; ignore
  }
  return best;
}
