import type { EmotionConfig, Language } from '../types'

export const EMOTIONS: EmotionConfig[] = [
  {
    id: 'happy',
    labelKey: 'emotion.happy',
    emoji: '😊',
    promptHint: 'smiling warmly, joyful expression, eyes slightly closed',
    suggestedText: {
      en: 'Yay!',
      ja: 'やったー！',
      'zh-TW': '耶！',
      'zh-CN': '耶！',
      th: 'เย้!',
      id: 'Hore!',
      ko: '야호!',
    },
  },
  {
    id: 'sad',
    labelKey: 'emotion.sad',
    emoji: '😢',
    promptHint: 'sad expression, teary eyes, downturned mouth',
    suggestedText: {
      en: 'So sad...',
      ja: '悲しい...',
      'zh-TW': '好難過...',
      'zh-CN': '好难过...',
      th: 'เศร้า...',
      id: 'Sedih...',
      ko: '슬퍼...',
    },
  },
  {
    id: 'excited',
    labelKey: 'emotion.excited',
    emoji: '🤩',
    promptHint: 'extremely excited, sparkling eyes, wide smile, dynamic pose',
    suggestedText: {
      en: 'Wow!',
      ja: 'わーい！',
      'zh-TW': '哇！',
      'zh-CN': '哇！',
      th: 'ว้าว!',
      id: 'Wah!',
      ko: '와!',
    },
  },
  {
    id: 'tired',
    labelKey: 'emotion.tired',
    emoji: '😴',
    promptHint: 'exhausted, droopy eyes, yawning, slumped posture',
    suggestedText: {
      en: 'So tired...',
      ja: '疲れた...',
      'zh-TW': '好累...',
      'zh-CN': '好累...',
      th: 'เหนื่อย...',
      id: 'Capek...',
      ko: '피곤해...',
    },
  },
  {
    id: 'love',
    labelKey: 'emotion.love',
    emoji: '😍',
    promptHint: 'heart eyes, blushing, loving expression, hearts floating',
    suggestedText: {
      en: 'Love it!',
      ja: '大好き！',
      'zh-TW': '超愛！',
      'zh-CN': '超爱！',
      th: 'รักเลย!',
      id: 'Suka!',
      ko: '좋아해!',
    },
  },
  {
    id: 'thanks',
    labelKey: 'emotion.thanks',
    emoji: '🙏',
    promptHint: 'grateful expression, hands together, slight bow',
    suggestedText: {
      en: 'Thanks!',
      ja: 'ありがとう！',
      'zh-TW': '謝謝！',
      'zh-CN': '谢谢！',
      th: 'ขอบคุณ!',
      id: 'Terima kasih!',
      ko: '고마워!',
    },
  },
  {
    id: 'sorry',
    labelKey: 'emotion.sorry',
    emoji: '🙇',
    promptHint: 'apologetic expression, bowing, remorseful look',
    suggestedText: {
      en: 'Sorry!',
      ja: 'ごめんね！',
      'zh-TW': '對不起！',
      'zh-CN': '对不起！',
      th: 'ขอโทษ!',
      id: 'Maaf!',
      ko: '미안해!',
    },
  },
  {
    id: 'ok',
    labelKey: 'emotion.ok',
    emoji: '👌',
    promptHint: 'confident smile, OK hand gesture, thumbs up',
    suggestedText: {
      en: 'OK!',
      ja: 'OK！',
      'zh-TW': 'OK！',
      'zh-CN': 'OK！',
      th: 'โอเค!',
      id: 'OK!',
      ko: '오케이!',
    },
  },
  {
    id: 'thinking',
    labelKey: 'emotion.thinking',
    emoji: '🤔',
    promptHint: 'hand on chin, thoughtful expression, looking up',
    suggestedText: {
      en: 'Hmm...',
      ja: 'うーん...',
      'zh-TW': '嗯...',
      'zh-CN': '嗯...',
      th: 'อืม...',
      id: 'Hmm...',
      ko: '음...',
    },
  },
  {
    id: 'surprised',
    labelKey: 'emotion.surprised',
    emoji: '😲',
    promptHint: 'wide eyes, open mouth, shocked expression',
    suggestedText: {
      en: 'What?!',
      ja: 'えっ！？',
      'zh-TW': '什麼！？',
      'zh-CN': '什么！？',
      th: 'อะไร!?',
      id: 'Apa!?',
      ko: '뭐!?',
    },
  },
  {
    id: 'angry',
    labelKey: 'emotion.angry',
    emoji: '😤',
    promptHint: 'furrowed brows, puffed cheeks, angry expression',
    suggestedText: {
      en: 'Grr!',
      ja: 'むかっ！',
      'zh-TW': '氣！',
      'zh-CN': '气！',
      th: 'โกรธ!',
      id: 'Kesal!',
      ko: '화나!',
    },
  },
  {
    id: 'laughing',
    labelKey: 'emotion.laughing',
    emoji: '🤣',
    promptHint: 'laughing hard, tears of joy, holding stomach',
    suggestedText: {
      en: 'LOL',
      ja: 'www',
      'zh-TW': '笑死',
      'zh-CN': '笑死',
      th: '555',
      id: 'Wkwk',
      ko: 'ㅋㅋㅋ',
    },
  },
]

export const EMOTION_IDS = EMOTIONS.map(e => e.id)

export function getEmotionById(id: string): EmotionConfig | undefined {
  return EMOTIONS.find(e => e.id === id)
}

export function getEmotionText(emotionId: string, language: Language): string {
  const emotion = getEmotionById(emotionId)
  return emotion?.suggestedText[language] ?? ''
}

export function buildEmotionPrompt(emotionId: string): string {
  const emotion = getEmotionById(emotionId)
  return emotion?.promptHint ?? ''
}
