// UI界面相关常量

// 面板尺寸常量
export const UI_SIZES = {
  DEFAULT_PALETTE_WIDTH: 260,
  MIN_PALETTE_WIDTH: 100,
  DEFAULT_LAYERS_PANEL_WIDTH: 280,
  MIN_LAYERS_PANEL_WIDTH: 200,
  DEFAULT_TOOLBAR_WIDTH: 200
} as const;

// 默认位置常量
export const DEFAULT_POSITIONS = {
  CANVAS_OFFSET: { x: 0, y: 0 } as { x: number; y: number },
  MOVE_OFFSET: { x: 0, y: 0 } as { x: number; y: number },
  PASTE_PREVIEW_POS: { x: 0, y: 0 } as { x: number; y: number },
  SELECTION_TOOLBAR_POS: { top: 0, left: 0 } as { top: number; left: number }
} as const;

// 默认透明度
export const DEFAULT_OPACITY = 1 as number;

// 工具模式类型
export const TOOL_MODES = {
  DRAW: 'draw',
  ERASE: 'erase',
  SELECT: 'select',
  MAGIC: 'magic',
  LASSO: 'lasso'
} as const;

// 导出格式类型
export const EXPORT_FORMATS = {
  PNG: 'png',
  JPG: 'jpg',
  SVG: 'svg',
  JSON: 'json'
} as const;

// 屏幕尺寸类型
export const SCREEN_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const;