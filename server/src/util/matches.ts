export function generateMatches(ids: number[]) {
  // Fisher–Yates shuffle
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  // Pair each id with the next one in the shuffled array to prevent the sender from being the same as the receiver
  return ids.map((_, i) => ({
    giver: ids[i],
    receiver: ids[(i + 1) % ids.length],
  }));
}
