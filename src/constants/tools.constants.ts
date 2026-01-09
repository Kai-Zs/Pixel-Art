// 工具相关常量

// 魔棒选择工具配置
export const MAGIC_WAND_CONFIG = {
  DEFAULT_TOLERANCE: 10,
  MIN_TOLERANCE: 0,
  MAX_TOLERANCE: 100
} as const;

// 默认选择配置
export const SELECTION_CONFIG = {
  DEFAULT_SELECT_TRANSPARENT: true,
  MIN_MOVE_DISTANCE: 5 // 移动距离阈值，用于判断是否开始移动选择
} as const;

// 历史记录配置
export const HISTORY_CONFIG = {
  MAX_HISTORY_SIZE: 50,
  DEFAULT_HISTORY_INDEX: 0
} as const;

// 导出配置
export const EXPORT_CONFIG = {
  DEFAULT_SCALE: 1,
  MIN_SCALE: 1,
  MAX_SCALE: 32,
  DEFAULT_QUALITY: 0.9,
  MIN_QUALITY: 0.1,
  MAX_QUALITY: 1.0
} as const;