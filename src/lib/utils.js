// Zentrale Definitionen — überall einheitlich verwenden

export const GROUP_COLORS = {
  hauptbereich: '#52b7c1',
  intelligence: '#A855F7',
  kampagne: '#ffa600',
  content: '#3B82F6',
  team: '#22C55E',
  wissen: '#F97316',
  admin: '#8BAFC9',
}

// Einheitliche "Dringend"-Definition: Handlungsbedarf + negatives Sentiment
export function isUrgent(article) {
  return !!(article?.handlungsbedarf && article?.sentiment === 'negativ')
}
