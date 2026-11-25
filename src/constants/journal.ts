export type JournalMoodCode = 'happy' | 'relaxed' | 'excited' | 'peaceful' | 'thoughtful'

export interface JournalMoodOption {
  code: JournalMoodCode
  emoji: string
  label: string
}

export const JOURNAL_MOOD_OPTIONS: JournalMoodOption[] = [
  { code: 'happy', emoji: '😊', label: '开心' },
  { code: 'relaxed', emoji: '😌', label: '放松' },
  { code: 'excited', emoji: '🤩', label: '兴奋' },
  { code: 'peaceful', emoji: '🧘', label: '平静' },
  { code: 'thoughtful', emoji: '🤔', label: '沉思' }
]

export function getJournalMoodEmoji(mood?: string | null): string {
  if (!mood) return ''
  return JOURNAL_MOOD_OPTIONS.find(item => item.code === mood)?.emoji ?? ''
}
