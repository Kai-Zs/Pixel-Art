// 画布相关常量
export const CANVAS_SIZES = [
  { label: '16x16', width: 16, height: 16 },
  { label: '32x32', width: 32, height: 32 },
  { label: '64x64', width: 64, height: 64 },
  { label: '128x128', width: 128, height: 128 },
  { label: '256x256', width: 256, height: 256 }
] as const;

export const DEFAULT_CANVAS_INDEX = 1; // 32x32
export const DEFAULT_CUSTOM_WIDTH = 64;
export const DEFAULT_CUSTOM_HEIGHT = 64;

export const MIN_CANVAS_SCALE = 0.1;
export const MAX_CANVAS_SCALE = 10;
export const DEFAULT_CANVAS_SCALE = 1;