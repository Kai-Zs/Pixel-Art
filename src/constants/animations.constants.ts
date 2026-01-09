// CSS动画相关常量

// 动画名称
export const ANIMATIONS = {
  FADE_IN: 'fadeIn',
  SLIDE_DOWN: 'slideDown',
  PULSE: 'pulse'
} as const;

// 动画关键帧配置
export const ANIMATION_KEYFRAMES = {
  [ANIMATIONS.FADE_IN]: {
    from: { opacity: 0 },
    to: { opacity: 1 }
  },
  [ANIMATIONS.SLIDE_DOWN]: {
    from: { transform: 'translate(-50%, -20px)', opacity: 0 },
    to: { transform: 'translate(-50%, 0)', opacity: 1 }
  },
  [ANIMATIONS.PULSE]: {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.1)' }
  }
} as const;