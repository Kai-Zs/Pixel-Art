// 颜色调色板常量
export const COLOR_PALETTES = {
  basic: {
    name: '基础',
    colors: [
      '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
      '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800', '#8800FF'
    ]
  },
  retro: {
    name: '复古游戏',
    colors: [
      '#000000', '#FFFFFF', '#7C7C7C', '#BCBCBC',
      '#F8F8F8', '#0000FC', '#0058F8', '#3CBCFC',
      '#00E436', '#008800', '#FCA044', '#F83800',
      '#F87858', '#F8B8F8', '#F878F8', '#D800CC'
    ]
  },
  flat: {
    name: '现代扁平',
    colors: [
      '#1ABC9C', '#2ECC71', '#3498DB', '#9B59B6',
      '#34495E', '#16A085', '#27AE60', '#2980B9',
      '#8E44AD', '#2C3E50', '#F1C40F', '#E67E22',
      '#E74C3C', '#ECF0F1', '#95A5A6', '#F39C12'
    ]
  },
  pastel: {
    name: '马卡龙',
    colors: [
      '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9',
      '#BAE1FF', '#E0BBE4', '#FFDFD3', '#FEC8D8',
      '#D4F1F4', '#C9E4DE', '#F7D9C4', '#FAEDCB',
      '#C6DEF1', '#DBCDF0', '#F2C6DE', '#F7D9D9'
    ]
  },
  neon: {
    name: '霓虹',
    colors: [
      '#FF006E', '#FB5607', '#FFBE0B', '#8338EC',
      '#3A86FF', '#06FFA5', '#FF1493', '#C100FF',
      '#00F5FF', '#FE00FE', '#39FF14', '#FF073A',
      '#FFED00', '#00FFFF', '#FF10F0', '#7FFF00'
    ]
  },
  earth: {
    name: '大地',
    colors: [
      '#8B4513', '#A0522D', '#D2691E', '#CD853F',
      '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F',
      '#556B2F', '#6B8E23', '#808000', '#BDB76B',
      '#8FBC8F', '#20B2AA', '#2F4F4F', '#696969'
    ]
  },
  ocean: {
    name: '海洋',
    colors: [
      '#003366', '#004080', '#0059B3', '#006BB3',
      '#007FCC', '#0099E6', '#00B3FF', '#1AC6FF',
      '#4DD2FF', '#80DFFF', '#B3ECFF', '#CCF2FF',
      '#006666', '#008B8B', '#20B2AA', '#48D1CC'
    ]
  },
  sunset: {
    name: '日落',
    colors: [
      '#2C1B47', '#4B2E63', '#7A4D7E', '#A66999',
      '#C685B1', '#D9A6C8', '#FFC857', '#F9A826',
      '#FF8C42', '#FF6B6B', '#E84A5F', '#C44569',
      '#5F2C82', '#49516F', '#3B5998', '#2C3E50'
    ]
  },
  cyberpunk: {
    name: '赛博朋克',
    colors: [
      '#0A0E27', '#B80D57', '#F92A82', '#ED3C7B',
      '#6C2167', '#5B1865', '#410E4F', '#0E0B16',
      '#00D9FF', '#00F0FF', '#0ABDC6', '#00FFFF',
      '#EA00D9', '#711C91', '#5C2A9D', '#133E7C'
    ]
  },
  grayscale: {
    name: '灰阶',
    colors: [
      '#000000', '#1A1A1A', '#333333', '#4D4D4D',
      '#666666', '#808080', '#999999', '#B3B3B3',
      '#CCCCCC', '#E6E6E6', '#F2F2F2', '#FFFFFF',
      '#0D0D0D', '#262626', '#404040', '#595959'
    ]
  }
} as const;

// 默认调色板
export const DEFAULT_PALETTE = 'basic';

// 默认颜色
export const DEFAULT_COLOR = '#000000';
export const DEFAULT_HEX_INPUT = '#000000';

// 默认自定义颜色列表
export const DEFAULT_CUSTOM_COLORS: string[] = [];