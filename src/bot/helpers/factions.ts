export const factions = {
  Temple: 'Świątynia',
  Necropolis: 'Nekropolis',
  Sylvan: 'Knieja',
  Hive: 'Rój',
  Schisma: 'Schisma',
  Dungeon: 'Loch',
} as const;

export function translateFaction(faction: string) {
  return factions[faction as keyof typeof factions] ?? faction;
}
