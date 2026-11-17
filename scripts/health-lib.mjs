export function buildHealth(sha) {
  return { status: 'ok', sha: sha || 'unknown' };
}
