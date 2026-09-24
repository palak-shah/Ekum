export function foldMessageReactions(
  rows: Array<{ messageId: string; emoji: string; companyId: string }>,
  viewerCompanyId: string,
): Map<string, Array<{ emoji: string; count: number; mine: boolean }>> {
  const byMessage = new Map<string, Map<string, { emoji: string; count: number; mine: boolean }>>();
  for (const row of rows) {
    const byEmoji = byMessage.get(row.messageId) ?? new Map();
    const cur = byEmoji.get(row.emoji) ?? { emoji: row.emoji, count: 0, mine: false };
    cur.count += 1;
    if (row.companyId === viewerCompanyId) cur.mine = true;
    byEmoji.set(row.emoji, cur);
    byMessage.set(row.messageId, byEmoji);
  }
  return new Map(
    [...byMessage.entries()].map(([id, byEmoji]) => [id, [...byEmoji.values()]]),
  );
}
