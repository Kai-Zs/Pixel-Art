import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, Undo, Redo, Pencil, Eraser, MousePointer, Plus, Pipette, ChevronDown, ChevronUp, ZoomIn, ZoomOut, RotateCcw, Layers, Eye, EyeOff, Lock, Unlock, X, Trash2, Copy, Move, Download, Upload } from 'lucide-react';
import * as CONSTANTS from './constants';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  pixels: Record<string, string>;
}

export default function PixelArtGenerator() {
  useEffect(() => {
    // 动态添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ${CONSTANTS.ANIMATIONS.FADE_IN} {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes ${CONSTANTS.ANIMATIONS.SLIDE_DOWN} {
        from { transform: translate(-50%, -20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      @keyframes ${CONSTANTS.ANIMATIONS.PULSE} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      // 清理样式
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  const [canvasSize, setCanvasSize] = useState<{label: string; width: number; height: number}>(CONSTANTS.CANVAS_SIZES[CONSTANTS.DEFAULT_CANVAS_INDEX]);
  const [currentColor, setCurrentColor] = useState(CONSTANTS.DEFAULT_COLOR);
  const [pixels] = useState<Record<string, string>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'small' | 'medium' | 'large'>(CONSTANTS.SCREEN_SIZES.MEDIUM);
  const [showCustomSizeDialog, setShowCustomSizeDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSize, setPendingSize] = useState<{label: string; width: number; height: number} | null>(null);
  const [customWidth, setCustomWidth] = useState(CONSTANTS.DEFAULT_CUSTOM_WIDTH.toString());
  const [customHeight, setCustomHeight] = useState(CONSTANTS.DEFAULT_CUSTOM_HEIGHT.toString());
  const [toolMode, setToolMode] = useState<'draw' | 'erase' | 'select' | 'magic' | 'lasso'>(CONSTANTS.TOOL_MODES.DRAW);
  const [selection, setSelection] = useState<{startX: number; startY: number; endX: number; endY: number} | null>(null);
  const [selectedPixels, setSelectedPixels] = useState<Record<string, string>>({});
  const [isSelecting, setIsSelecting] = useState(false);
  const [isMovingSelection, setIsMovingSelection] = useState(false);
  const [moveOffset, setMoveOffset] = useState<{x: number; y: number}>(CONSTANTS.DEFAULT_POSITIONS.MOVE_OFFSET);
  // const [selectionStartPos, setSelectionStartPos] = useState({x: 0, y: 0});
  const [clipboardPixels, setClipboardPixels] = useState<Record<string, string>>({});
  const [clipboardSize, setClipboardSize] = useState<{width: number; height: number}>({width: 0, height: 0});
  const [isPastePreviewing, setIsPastePreviewing] = useState(false);
  const [pastePreviewPos, setPastePreviewPos] = useState(CONSTANTS.DEFAULT_POSITIONS.PASTE_PREVIEW_POS);
  const [tolerance, setTolerance] = useState<number>(CONSTANTS.MAGIC_WAND_CONFIG.DEFAULT_TOLERANCE); // 魔棒选择的容差值
  // 套索选择状态
  const [isLassoSelecting, setIsLassoSelecting] = useState(false);
  const [lassoPath, setLassoPath] = useState<{x: number; y: number}[]>([]);
  // 是否选择透明像素
  const [selectTransparent, setSelectTransparent] = useState<boolean>(CONSTANTS.SELECTION_CONFIG.DEFAULT_SELECT_TRANSPARENT);
  const [activePalette, setActivePalette] = useState(CONSTANTS.DEFAULT_PALETTE);
  const [hexInput, setHexInput] = useState(CONSTANTS.DEFAULT_HEX_INPUT);
  const [customColors, setCustomColors] = useState(CONSTANTS.DEFAULT_CUSTOM_COLORS);

  const [showAddColorDialog, setShowAddColorDialog] = useState(false);
  const [newColorInput, setNewColorInput] = useState(CONSTANTS.DEFAULT_COLOR);
  const [showDeleteColorDialog, setShowDeleteColorDialog] = useState(false);
  const [pendingDeleteColor, setPendingDeleteColor] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  
  // 图层系统状态
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'layer-1',
      name: '图层 1',
      visible: true,
      locked: false,
      opacity: CONSTANTS.DEFAULT_OPACITY,
      pixels: {}
    }
  ]);
  const [history, setHistory] = useState<Layer[][]>([JSON.parse(JSON.stringify(layers))]);
  const [historyIndex, setHistoryIndex] = useState<number>(CONSTANTS.HISTORY_CONFIG.DEFAULT_HISTORY_INDEX);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  
  // 导出相关状态
  const [customPalette, setCustomPalette] = useState(CONSTANTS.DEFAULT_CUSTOM_COLORS);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [highlightColor, setHighlightColor] = useState<string | null>(null);
  const [canvasScale, setCanvasScale] = useState(CONSTANTS.DEFAULT_CANVAS_SCALE);
  const [canvasOffset, setCanvasOffset] = useState<{x: number; y: number}>(CONSTANTS.DEFAULT_POSITIONS.CANVAS_OFFSET);
  const [isDragging, setIsDragging] = useState(false);
  const [paletteWidth, setPaletteWidth] = useState<number>(CONSTANTS.UI_SIZES.DEFAULT_PALETTE_WIDTH);
  const [isPaletteDragging, setIsPaletteDragging] = useState(false);
  const [minPaletteWidth] = useState(CONSTANTS.UI_SIZES.MIN_PALETTE_WIDTH);
  const [layersPanelWidth, setLayersPanelWidth] = useState<number>(CONSTANTS.UI_SIZES.DEFAULT_LAYERS_PANEL_WIDTH);
  const [isLayersPanelDragging, setIsLayersPanelDragging] = useState(false);
  const [minLayersPanelWidth] = useState(CONSTANTS.UI_SIZES.MIN_LAYERS_PANEL_WIDTH);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [lastTouchPos, setLastTouchPos] = useState<{x: number; y: number} | null>(null);
  // 悬浮栏拖拽状态
  const [selectionToolbarPos, setSelectionToolbarPos] = useState(CONSTANTS.DEFAULT_POSITIONS.SELECTION_TOOLBAR_POS);
  const [isToolbarDragging, setIsToolbarDragging] = useState(false);
  const isToolbarDraggingRef = useRef(false); // 使用ref避免异步状态更新延迟
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{x: number; y: number}>(CONSTANTS.DEFAULT_POSITIONS.MOVE_OFFSET);
  const lastMousePos = useRef<{x: number; y: number}>(CONSTANTS.DEFAULT_POSITIONS.MOVE_OFFSET); // 记录上一次鼠标位置
  const dragStartToolbarPos = useRef<{top: number; left: number}>(CONSTANTS.DEFAULT_POSITIONS.SELECTION_TOOLBAR_POS);
  const currentToolbarPos = useRef<{top: number; left: number}>(CONSTANTS.DEFAULT_POSITIONS.SELECTION_TOOLBAR_POS);
  const animationFrameRef = useRef<number | null>(null);
  // 存储工具栏尺寸，避免拖拽中动态获取尺寸导致的重排和尺寸值不准确
  const toolbarSizeRef = useRef({ width: 0, height: 0 });

  // 导出功能状态
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'svg' | 'json'>(CONSTANTS.EXPORT_FORMATS.PNG);
  const [exportScale, setExportScale] = useState<number>(CONSTANTS.EXPORT_CONFIG.DEFAULT_SCALE);
    const [exportQuality, setExportQuality] = useState<number>(CONSTANTS.EXPORT_CONFIG.DEFAULT_QUALITY);
  const [isExporting, setIsExporting] = useState(false);
  
  // 自动恢复相关状态
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreData, setRestoreData] = useState<ProjectData | null>(null);

  // 项目数据类型定义
  interface ProjectData {
    version?: string;
    canvasSize?: { width: number; height: number };
    layers?: Array<{
      id: string;
      name: string;
      pixels: Record<string, string>;
      visible: boolean;
      opacity: number;
      locked: boolean;
    }>;
    customPalette?: string[];
    selectedColor?: string;
    timestamp?: number;
    autoSave?: boolean;
  }



  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionStartPosRef = useRef(CONSTANTS.DEFAULT_POSITIONS.MOVE_OFFSET);

  // 设置工具栏初始位置
  useEffect(() => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (containerRect && canvasRect) {
      // 工具栏默认宽度估计值（实际宽度会在拖拽时更新）
      setSelectionToolbarPos({
        top: Math.max(0, canvasRect.bottom + 10),
        left: Math.max(0, Math.min(containerRect.width - CONSTANTS.UI_SIZES.DEFAULT_TOOLBAR_WIDTH, (containerRect.width - CONSTANTS.UI_SIZES.DEFAULT_TOOLBAR_WIDTH) / 2))
      });
    }
  }, []);

  // 处理工具栏拖动事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isToolbarDraggingRef.current && containerRef.current && toolbarRef.current) {
        e.preventDefault();
        
        // 使用requestAnimationFrame优化性能
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        animationFrameRef.current = requestAnimationFrame(() => {
          // 直接更新DOM样式以获得更好的性能
          if (toolbarRef.current && containerRef.current) {
            // 计算鼠标相对于初始拖拽位置的偏移量
            const deltaX = e.clientX - dragStartPos.current.x;
            const deltaY = e.clientY - dragStartPos.current.y;
            
            // 使用初始工具栏位置加上偏移量计算新位置
            // 这种方法避免了坐标系统转换可能带来的漂移
            let newTop = dragStartToolbarPos.current.top + deltaY;
            let newLeft = dragStartToolbarPos.current.left + deltaX;
            
            // 获取容器尺寸进行边界检查
            const containerRect = containerRef.current.getBoundingClientRect();
            
            // 使用存储的尺寸，避免动态获取
            const maxTop = containerRect.height - toolbarSizeRef.current.height;
            const maxLeft = containerRect.width - toolbarSizeRef.current.width;
            
            // 边界检查
            newTop = Math.max(0, Math.min(maxTop, newTop));
            newLeft = Math.max(0, Math.min(maxLeft, newLeft));
            
            // 取整处理，避免浮点数精度问题导致的漂移
            newTop = Math.round(newTop);
            newLeft = Math.round(newLeft);
            
            // 保存当前位置
            currentToolbarPos.current = { top: newTop, left: newLeft };
            
            // 直接更新DOM样式
            toolbarRef.current.style.top = `${newTop}px`;
            toolbarRef.current.style.left = `${newLeft}px`;
          }
        });
      }
    };

    const handleMouseUp = () => {
      if (isToolbarDraggingRef.current && containerRef.current && toolbarRef.current) {
        // 立即停止拖拽状态，防止后续动画帧执行
        isToolbarDraggingRef.current = false;
        setIsToolbarDragging(false);
        
        // 清理动画帧
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // 获取当前DOM的实际位置
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // 使用拖拽过程中保存的位置，避免重新计算导致位置偏差
        const finalTop = currentToolbarPos.current.top;
        const finalLeft = currentToolbarPos.current.left;
        
        // 确保位置在容器内（边界检查）
        // 使用存储的尺寸，避免动态获取
        const maxTop = containerRect.height - toolbarSizeRef.current.height;
        const maxLeft = containerRect.width - toolbarSizeRef.current.width;
        
        // 计算边界检查后的位置
        let boundedTop = Math.max(0, Math.min(maxTop, finalTop));
        let boundedLeft = Math.max(0, Math.min(maxLeft, finalLeft));
        
        // 取整处理，避免浮点数精度问题导致的漂移
        boundedTop = Math.round(boundedTop);
        boundedLeft = Math.round(boundedLeft);
        
        // 只有在需要边界修正时才更新DOM
        if (finalTop !== boundedTop || finalLeft !== boundedLeft) {
          toolbarRef.current.style.top = `${boundedTop}px`;
          toolbarRef.current.style.left = `${boundedLeft}px`;
        }
        
        // 更新currentToolbarPos.current以反映边界检查后的结果
        currentToolbarPos.current = { top: boundedTop, left: boundedLeft };
        
        // 保存最终位置到状态
        setSelectionToolbarPos({ 
          top: boundedTop, 
          left: boundedLeft 
        });
      }
    };

    const handleMouseLeave = () => {
      if (isToolbarDraggingRef.current && containerRef.current && toolbarRef.current) {
        // 立即停止拖拽状态，防止后续动画帧执行
        isToolbarDraggingRef.current = false;
        setIsToolbarDragging(false);
        
        // 清理动画帧
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // 获取当前DOM的实际位置
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // 使用拖拽过程中保存的位置，避免重新计算导致位置偏差
        const finalTop = currentToolbarPos.current.top;
        const finalLeft = currentToolbarPos.current.left;
        
        // 确保位置在容器内（边界检查）
        // 使用存储的尺寸，避免动态获取
        const maxTop = containerRect.height - toolbarSizeRef.current.height;
        const maxLeft = containerRect.width - toolbarSizeRef.current.width;
        
        // 计算边界检查后的位置
        let boundedTop = Math.max(0, Math.min(maxTop, finalTop));
        let boundedLeft = Math.max(0, Math.min(maxLeft, finalLeft));
        
        // 取整处理，避免浮点数精度问题导致的漂移
        boundedTop = Math.round(boundedTop);
        boundedLeft = Math.round(boundedLeft);
        
        // 只有在需要边界修正时才更新DOM
        if (finalTop !== boundedTop || finalLeft !== boundedLeft) {
          toolbarRef.current.style.top = `${boundedTop}px`;
          toolbarRef.current.style.left = `${boundedLeft}px`;
        }
        
        // 更新currentToolbarPos.current以反映边界检查后的结果
        currentToolbarPos.current = { top: boundedTop, left: boundedLeft };
        
        // 保存最终位置到状态
        setSelectionToolbarPos({ 
          top: boundedTop, 
          left: boundedLeft 
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isToolbarDragging]);

  useEffect(() => {
    const saved = localStorage.getItem(CONSTANTS.STORAGE_KEYS.CUSTOM_COLORS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomColors(parsed);
      } catch {
        console.error('Failed to load custom colors');
      }
    }
  }, []);

  // 历史记录管理函数
  const addToHistory = useCallback((newLayers: Layer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newLayers)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // 图层合并渲染函数 - 将所有可见图层合并为一个像素数组
  const mergeVisibleLayers = (): Record<string, string> => {
    const mergedPixels: Record<string, string> = {};
    
    // 反转图层顺序（从下到上）
    [...layers].reverse().forEach(layer => {
      if (!layer.visible) return;
      
      Object.keys(layer.pixels).forEach(key => {
        // 保留最后绘制的像素（上层覆盖下层）
        mergedPixels[key] = layer.pixels[key];
      });
    });
    
    return mergedPixels;
  };

  // PNG导出功能
  const exportPNG = () => {
    try {
      const mergedPixels = mergeVisibleLayers();
      const scaledWidth = canvasSize.width * exportScale;
      const scaledHeight = canvasSize.height * exportScale;
      
      // 创建导出画布
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = scaledWidth;
      exportCanvas.height = scaledHeight;
      const ctx = exportCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('无法创建画布上下文');
      }
      
      // 设置背景为透明
      ctx.clearRect(0, 0, scaledWidth, scaledHeight);
      
      // 绘制像素
      Object.keys(mergedPixels).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const scaledX = x * exportScale;
        const scaledY = y * exportScale;
        
        ctx.fillStyle = mergedPixels[key];
        ctx.fillRect(scaledX, scaledY, exportScale, exportScale);
      });
      
      // 转换为Blob并下载
      exportCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pixel_art_${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setIsExporting(false);
          setShowExportDialog(false);
        } else {
          throw new Error('PNG导出失败');
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('PNG导出错误:', error);
      alert('PNG导出失败，请重试');
      setIsExporting(false);
    }
  };

  // JPG导出功能
  const exportJPG = () => {
    try {
      const mergedPixels = mergeVisibleLayers();
      const scaledWidth = canvasSize.width * exportScale;
      const scaledHeight = canvasSize.height * exportScale;
      
      // 创建导出画布
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = scaledWidth;
      exportCanvas.height = scaledHeight;
      const ctx = exportCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('无法创建画布上下文');
      }
      
      // 设置背景为白色（JPG不支持透明）
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);
      
      // 绘制像素
      Object.keys(mergedPixels).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const scaledX = x * exportScale;
        const scaledY = y * exportScale;
        
        ctx.fillStyle = mergedPixels[key];
        ctx.fillRect(scaledX, scaledY, exportScale, exportScale);
      });
      
      // 转换为Blob并下载
      exportCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pixel_art_${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setIsExporting(false);
          setShowExportDialog(false);
        } else {
          throw new Error('JPG导出失败');
        }
      }, 'image/jpeg', exportQuality);
      
    } catch (error) {
      console.error('JPG导出错误:', error);
      alert('JPG导出失败，请重试');
      setIsExporting(false);
    }
  };

  // SVG导出功能
  const exportSVG = () => {
    try {
      const mergedPixels = mergeVisibleLayers();
      const scaledWidth = canvasSize.width * exportScale;
      const scaledHeight = canvasSize.height * exportScale;
      
      // 创建SVG内容
      const svgElements: string[] = [];
      
      // 按颜色分组像素以减少SVG元素数量
      const colorGroups: Record<string, string[]> = {};
      Object.keys(mergedPixels).forEach(key => {
        const color = mergedPixels[key];
        if (!colorGroups[color]) {
          colorGroups[color] = [];
        }
        colorGroups[color].push(key);
      });
      
      // 生成SVG rect元素
      Object.keys(colorGroups).forEach(color => {
        const pixels = colorGroups[color];
        const rects = pixels.map(key => {
          const [x, y] = key.split(',').map(Number);
          const scaledX = x * exportScale;
          const scaledY = y * exportScale;
          return `<rect x="${scaledX}" y="${scaledY}" width="${exportScale}" height="${exportScale}" fill="${color}"/>`;
        }).join('');
        svgElements.push(rects);
      });
      
      // 构建完整SVG
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${scaledWidth}" height="${scaledHeight}" viewBox="0 0 ${scaledWidth} ${scaledHeight}">
  ${svgElements.join('\n  ')}
</svg>`;
      
      // 创建Blob并下载
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixel_art_${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
      setShowExportDialog(false);
      
    } catch (error) {
      console.error('SVG导出错误:', error);
      alert('SVG导出失败，请重试');
      setIsExporting(false);
    }
  };

  // JSON数据导出功能
  const exportJSON = () => {
    try {
      // 准备项目数据结构
      const projectData = {
        version: '1.0.0',
        canvasSize: canvasSize,
        layers: layers.map(layer => ({
          id: layer.id,
          name: layer.name,
          pixels: layer.pixels,
          visible: layer.visible,
          opacity: layer.opacity,
          locked: layer.locked
        })),
        selectedColor: currentColor,
        customPalette: customPalette,
        timestamp: new Date().toISOString()
      };
      
      // 转换为格式化的JSON字符串
      const jsonContent = JSON.stringify(projectData, null, 2);
      
      // 创建Blob并下载
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixel_art_project_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
      setShowExportDialog(false);
      
    } catch (error) {
      console.error('JSON导出错误:', error);
      alert('JSON导出失败，请重试');
      setIsExporting(false);
    }
  };



  // 自动保存函数
  const autoSave = useCallback(() => {
    try {
      const projectData = {
        version: '1.0.0',
        canvasSize: canvasSize,
        layers: layers.map(layer => ({
          id: layer.id,
          name: layer.name,
          pixels: layer.pixels,
          visible: layer.visible,
          opacity: layer.opacity,
          locked: layer.locked
        })),
        customPalette: customPalette,
        selectedColor: currentColor,
        timestamp: Date.now(),
        autoSave: true
      };
      
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.AUTOSAVE, JSON.stringify(projectData));
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }, [canvasSize, layers, customPalette, currentColor]);

  // 文件导入处理函数
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      alert('请选择JSON格式的项目文件');
      return;
    }

    try {
      setIsExporting(true); // 使用相同的加载状态
      const text = await file.text();
      const projectData = JSON.parse(text);

      // 验证项目数据结构
      if (!projectData.canvasSize || !projectData.layers) {
        throw new Error('无效的项目文件格式');
      }

      // 恢复画布尺寸
      const newSize = CONSTANTS.CANVAS_SIZES.find(size => 
        size.width === (projectData.canvasSize?.width || 16) && 
        size.height === (projectData.canvasSize?.height || 16)
      ) || CONSTANTS.CANVAS_SIZES[0];
      setCanvasSize(newSize);

      // 恢复图层数据
      const restoredLayers = (projectData.layers || []).map((layer: NonNullable<ProjectData['layers']>[0]) => ({
        id: layer.id || `layer-${Date.now()}`,
        name: layer.name || '导入图层',
        pixels: layer.pixels || {},
        visible: layer.visible !== false,
        opacity: layer.opacity || 1,
        locked: layer.locked || false
      }));

      setLayers(restoredLayers);

      // 设置活跃图层
      if (restoredLayers.length > 0) {
        setActiveLayerIndex(0);
      }

      // 恢复自定义色板
      if (projectData.customPalette && Array.isArray(projectData.customPalette)) {
        setCustomPalette(projectData.customPalette);
      }

      // 清空历史记录
      setHistory([restoredLayers]);
      setHistoryIndex(0);

      // 重置视图
      setCanvasScale(1);
      setCanvasOffset({ x: 0, y: 0 });

      alert('项目导入成功！');
      setIsExporting(false);

    } catch (error) {
      console.error('项目导入失败:', error);
      alert('项目导入失败，请检查文件格式是否正确');
      setIsExporting(false);
    }

    // 清空文件输入
    event.target.value = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 取消粘贴预览
      if (e.code === 'Escape' && isPastePreviewing) {
        e.preventDefault();
        setIsPastePreviewing(false);
        return;
      }
      
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      
      // 复制选中的像素
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC' && toolMode === 'select' && Object.keys(selectedPixels).length > 0) {
        e.preventDefault();
        
        if (selection) {
          const minX = Math.min(selection.startX, selection.endX);
          const maxX = Math.max(selection.startX, selection.endX);
          const minY = Math.min(selection.startY, selection.endY);
          const maxY = Math.max(selection.startY, selection.endY);
          
          // 将选中的像素转换为相对坐标
          const relativePixels: Record<string, string> = {};
          Object.keys(selectedPixels).forEach(key => {
            const [x, y] = key.split(',').map(Number);
            const relativeKey = (x - minX) + ',' + (y - minY);
            relativePixels[relativeKey] = selectedPixels[key];
          });
          
          setClipboardPixels(relativePixels);
          setClipboardSize({width: maxX - minX + 1, height: maxY - minY + 1});
        }
      }
      
      // 粘贴像素
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV' && Object.keys(clipboardPixels).length > 0) {
        e.preventDefault();
        
        // 进入粘贴预览模式
        setIsPastePreviewing(true);
        setPastePreviewPos({
          x: Math.max(0, mousePos.x),
          y: Math.max(0, mousePos.y)
        });
      }
      
      // 删除选中的像素
      if ((e.code === 'Delete' || e.code === 'Backspace') && (toolMode === 'select' || toolMode === 'magic' || toolMode === 'lasso') && selection && Object.keys(selectedPixels).length > 0) {
        e.preventDefault();
        
        const newLayers = [...layers];
        const activeLayer = { ...newLayers[activeLayerIndex] };
        const newPixels = { ...activeLayer.pixels };
        
        // 清除选中的像素
        Object.keys(selectedPixels).forEach(key => {
          delete newPixels[key];
        });
        
        activeLayer.pixels = newPixels;
        newLayers[activeLayerIndex] = activeLayer;
        
        setLayers(newLayers);
        setSelectedPixels({});
        setSelection(null);
        addToHistory(newLayers);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, toolMode, selection, selectedPixels, layers, activeLayerIndex, addToHistory, clipboardPixels, isPastePreviewing, mousePos.x, mousePos.y]);



  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);

      if (width < 480) {
        setScreenSize('small');
      } else if (width < 768) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };
    
    // 屏蔽浏览器右键菜单
    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    // 添加右键菜单屏蔽
    document.addEventListener('contextmenu', preventRightClick);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('contextmenu', preventRightClick);
    };
  }, []);

  // 自动保存 - 当数据变化时自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      if (layers.length > 0) {
        autoSave();
      }
    }, 1000); // 1秒后保存，避免频繁保存

    return () => clearTimeout(timer);
  }, [layers, canvasSize, customPalette, currentColor, autoSave]);

  // 自动恢复 - 页面加载时检查是否有自动保存的数据
  useEffect(() => {
    const checkAutoRestore = () => {
      try {
        const savedData = localStorage.getItem(CONSTANTS.STORAGE_KEYS.AUTOSAVE);
        if (savedData) {
          const projectData = JSON.parse(savedData);
          
          // 如果有自动保存数据且不是刚导入的，询问是否恢复
          if (projectData.autoSave && projectData.timestamp) {
            const timeDiff = Date.now() - projectData.timestamp;
            
            // 如果数据超过5分钟，认为是有效的自动保存数据
            if (timeDiff > 5 * 60 * 1000) {
              setShowRestoreDialog(true);
              setRestoreData(projectData);
            }
          }
        }
      } catch (error) {
        console.error('检查自动恢复数据失败:', error);
      }
    };

    // 延迟检查，避免与初始加载冲突
    const timer = setTimeout(checkAutoRestore, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 恢复项目数据
  const restoreProject = () => {
    if (!restoreData) return;

    try {
      // 恢复画布尺寸
      const newSize = CONSTANTS.CANVAS_SIZES.find(size => 
        size.width === (restoreData.canvasSize?.width || 16) && 
        size.height === (restoreData.canvasSize?.height || 16)
      ) || CONSTANTS.CANVAS_SIZES[0];
      setCanvasSize(newSize);

      // 恢复图层数据
      const restoredLayers = (restoreData.layers || []).map((layer: NonNullable<ProjectData['layers']>[0]) => ({
        id: layer.id || `layer-${Date.now()}`,
        name: layer.name || '恢复图层',
        pixels: layer.pixels || {},
        visible: layer.visible !== false,
        opacity: layer.opacity || 1,
        locked: layer.locked || false
      })) || [];

      setLayers(restoredLayers);

      // 设置活跃图层
      if (restoredLayers.length > 0) {
        setActiveLayerIndex(0);
      }

      // 恢复自定义色板
      if (restoreData.customPalette && Array.isArray(restoreData.customPalette)) {
        setCustomPalette(restoreData.customPalette);
      }

      // 设置当前颜色
      if (restoreData.selectedColor) {
        setCurrentColor(restoreData.selectedColor);
      }

      // 清空历史记录
      setHistory([restoredLayers]);
      setHistoryIndex(0);

      // 重置视图
      setCanvasScale(1);
      setCanvasOffset({ x: 0, y: 0 });

      // 清除自动保存数据
      localStorage.removeItem(CONSTANTS.STORAGE_KEYS.AUTOSAVE);
      
      setShowRestoreDialog(false);
      setRestoreData(null);
      
      alert('项目恢复成功！');
    } catch (error) {
      console.error('项目恢复失败:', error);
      alert('项目恢复失败，请重试');
    }
  };

  // 忽略恢复
  const ignoreRestore = () => {
    setShowRestoreDialog(false);
    setRestoreData(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvasSize.width;
    const height = canvasSize.height;
    const basePixelSize = isMobile ?
      Math.min(300 / width, 400 / height) :
      Math.min(400 / width, 400 / height);

    const pixelSize = basePixelSize * canvasScale;

    canvas.width = width * pixelSize;
    canvas.height = height * pixelSize;

    // 绘制棋盘背景
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? '#CCCCCC' : '#999999';
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    // 绘制所有可见图层（反转顺序，使列表中显示的最顶层图层实际绘制在最上面）
    [...layers].reverse().forEach(layer => {
      if (!layer.visible) return;
      
      ctx.globalAlpha = layer.opacity;
      
      Object.keys(layer.pixels).forEach(key => {
        const parts = key.split(',');
        const x = Number(parts[0]);
        const y = Number(parts[1]);
        ctx.fillStyle = layer.pixels[key];
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      });
      
      ctx.globalAlpha = 1;
    });

    // 绘制网格线
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i++) {
      ctx.beginPath();
      ctx.moveTo(i * pixelSize, 0);
      ctx.lineTo(i * pixelSize, height * pixelSize);
      ctx.stroke();
    }
    for (let i = 0; i <= height; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * pixelSize);
      ctx.lineTo(width * pixelSize, i * pixelSize);
      ctx.stroke();
    }

    // 绘制套索路径（选择过程中）
    if (isLassoSelecting && lassoPath.length > 1) {
      ctx.strokeStyle = '#0078FF';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      
      ctx.beginPath();
      ctx.moveTo(lassoPath[0].x * pixelSize, lassoPath[0].y * pixelSize);
      for (let i = 1; i < lassoPath.length; i++) {
        ctx.lineTo(lassoPath[i].x * pixelSize, lassoPath[i].y * pixelSize);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 绘制选择区域
    if (selection) {
      const minX = Math.min(selection.startX, selection.endX);
      const maxX = Math.max(selection.startX, selection.endX);
      const minY = Math.min(selection.startY, selection.endY);
      const maxY = Math.max(selection.startY, selection.endY);
      
      // 优化：精确显示每个被选中的像素
      if (Object.keys(selectedPixels).length > 0) {
        // 合并遍历，提高性能
        Object.keys(selectedPixels).forEach(key => {
          const [x, y] = key.split(',').map(Number);
          
          // 为每个选中的像素绘制半透明的蓝色覆盖层
          ctx.fillStyle = 'rgba(0, 120, 255, 0.2)';
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          
          // 为每个选中的像素绘制蓝色边框，提高对比度
          ctx.strokeStyle = '#0078FF';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        });
      } else {
        // 如果没有选中的像素，则绘制传统的选择框
        ctx.fillStyle = 'rgba(0, 120, 255, 0.2)';
        ctx.fillRect(minX * pixelSize, minY * pixelSize, (maxX - minX + 1) * pixelSize, (maxY - minY + 1) * pixelSize);
        
        ctx.strokeStyle = '#0078FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(minX * pixelSize, minY * pixelSize, (maxX - minX + 1) * pixelSize, (maxY - minY + 1) * pixelSize);
      }
      
      // 绘制移动时的预览
      if (isMovingSelection && Object.keys(selectedPixels).length > 0) {
        const dx = moveOffset.x;
        const dy = moveOffset.y;

        // 绘制移动预览的半透明像素
        ctx.globalAlpha = 0.6;
        Object.keys(selectedPixels).forEach(key => {
          const [x, y] = key.split(',').map(Number);
          const newX = x + dx;
          const newY = y + dy;
          
          // 只绘制非透明像素，与实际移动行为一致
          if (newX >= 0 && newX < width && newY >= 0 && newY < height && selectedPixels[key]) {
            ctx.fillStyle = selectedPixels[key];
            ctx.fillRect(newX * pixelSize, newY * pixelSize, pixelSize, pixelSize);
          }
        });
        ctx.globalAlpha = 1;

        // 绘制移动预览的边框，精确显示每个像素
        ctx.strokeStyle = '#FF7800';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        Object.keys(selectedPixels).forEach(key => {
          const [x, y] = key.split(',').map(Number);
          const newX = x + dx;
          const newY = y + dy;
          
          // 只绘制非透明像素的边框，与实际移动行为一致
          if (newX >= 0 && newX < width && newY >= 0 && newY < height && selectedPixels[key]) {
            ctx.strokeRect(newX * pixelSize, newY * pixelSize, pixelSize, pixelSize);
          }
        });
        ctx.setLineDash([]);
      }
    }

    // 绘制粘贴预览
    if (isPastePreviewing && Object.keys(clipboardPixels).length > 0) {
      const x = pastePreviewPos.x;
      const y = pastePreviewPos.y;
      
      // 设置50%透明度
      ctx.globalAlpha = 0.5;
      
      // 绘制粘贴预览的像素
      Object.keys(clipboardPixels).forEach(key => {
        const [rx, ry] = key.split(',').map(Number);
        const newX = x + rx;
        const newY = y + ry;
        
        // 确保预览在画布范围内
        if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
          ctx.fillStyle = clipboardPixels[key];
          ctx.fillRect(newX * pixelSize, newY * pixelSize, pixelSize, pixelSize);
        }
      });
      
      // 恢复不透明
      ctx.globalAlpha = 1;
      
      // 绘制预览边框
      ctx.strokeStyle = '#FF7800';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(
        x * pixelSize,
        y * pixelSize,
        clipboardSize.width * pixelSize,
        clipboardSize.height * pixelSize
      );
      ctx.setLineDash([]);
    }
  }, [layers, canvasSize, isMobile, canvasScale, selection, selectedPixels, isMovingSelection, moveOffset, isLassoSelecting, lassoPath, isPastePreviewing, pastePreviewPos, clipboardPixels, clipboardSize]);

  // 颜色距离计算函数（RGB空间欧氏距离）
  const colorDistance = (color1: string, color2: string): number => {
    if (color1 === color2) return 0;
    
    const parseHex = (hex: string) => {
      const r = parseInt(hex.substr(1, 2), 16);
      const g = parseInt(hex.substr(3, 2), 16);
      const b = parseInt(hex.substr(5, 2), 16);
      return { r, g, b };
    };
    
    const c1 = parseHex(color1);
    const c2 = parseHex(color2);
    
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };
  
  // 魔棒选择的洪水填充算法
  const floodFillSelect = (startX: number, startY: number, tolerance: number) => {
    const activeLayer = layers[activeLayerIndex];
    const targetColor = activeLayer.pixels[startX + ',' + startY];
    
    // 如果点击的位置没有像素，则不进行选择
    if (!targetColor) {
      setSelectedPixels({});
      setSelection(null);
      return;
    }
    
    const width = canvasSize.width;
    const height = canvasSize.height;
    const visited = new Set<string>();
    const selected: Record<string, string> = {};
    const queue = [{ x: startX, y: startY }];
    
    let minX = startX;
    let maxX = startX;
    let minY = startY;
    let maxY = startY;
    
    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const key = x + ',' + y;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited.has(key)) continue;
      
      visited.add(key);
      
      const currentColor = activeLayer.pixels[key];
      if (!currentColor) continue;
      
      // 检查颜色是否在容差范围内
      if (colorDistance(currentColor, targetColor) <= tolerance) {
        selected[key] = currentColor;
        
        // 更新选区边界
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        
        // 将相邻像素加入队列
        queue.push({ x: x - 1, y });
        queue.push({ x: x + 1, y });
        queue.push({ x, y: y - 1 });
        queue.push({ x, y: y + 1 });
      }
    }
    
    setSelectedPixels(selected);
    setSelection({ startX: minX, startY: minY, endX: maxX, endY: maxY });
  };

  const handleCanvasInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (isSpacePressed || isDragging || isMovingSelection) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = canvasSize.width;
    const height = canvasSize.height;
    const pixelSize = (canvas.width / width);

    let clientX = 0;
    let clientY = 0;
    if (e.type.startsWith('touch')) {
      const touchEvent = e as React.TouchEvent;
      clientX = touchEvent.touches[0].clientX;
      clientY = touchEvent.touches[0].clientY;
    } else {
      const mouseEvent = e as React.MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    const x = Math.floor((clientX - rect.left) / pixelSize);
    const y = Math.floor((clientY - rect.top) / pixelSize);

    setMousePos({ x, y });

    if (x >= 0 && x < width && y >= 0 && y < height) {
      const key = x + ',' + y;
      const activeLayer = layers[activeLayerIndex];
      
      if (activeLayer.locked) {
        setToastMessage('图层已锁定，无法编辑');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        return;
      }
      
      const newLayers = [...layers];
      const newPixels = { ...activeLayer.pixels };

      if (toolMode === 'draw') {
        newPixels[key] = currentColor;
      } else if (toolMode === 'erase') {
        delete newPixels[key];
      }

      newLayers[activeLayerIndex] = {
        ...activeLayer,
        pixels: newPixels
      };
      setLayers(newLayers);

      if (!isDrawing) {
        addToHistory(newLayers);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2 || isSpacePressed) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
      return;
    }

    if (e.button === 0 && !isSpacePressed) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      
      const canvasRect = canvas.getBoundingClientRect();
      const width = canvasSize.width;
      const pixelSize = canvas.width / width;
      
      // 检查鼠标是否在画布范围内
      const isOnCanvas = e.clientX >= canvasRect.left && 
                        e.clientX <= canvasRect.right && 
                        e.clientY >= canvasRect.top && 
                        e.clientY <= canvasRect.bottom;
      
      if (isOnCanvas) {
        // 鼠标在画布内，正常处理
        const x = Math.floor((e.clientX - canvasRect.left) / pixelSize);
        const y = Math.floor((e.clientY - canvasRect.top) / pixelSize);
        
        if (toolMode === 'select') {
          // 检查是否点击在现有选区内
          if (selection) {
            const minX = Math.min(selection.startX, selection.endX);
            const maxX = Math.max(selection.startX, selection.endX);
            const minY = Math.min(selection.startY, selection.endY);
            const maxY = Math.max(selection.startY, selection.endY);
            
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
              // 开始移动选区
              setIsMovingSelection(true);
              setIsDrawing(false); // 确保不是绘制状态
              // 记录鼠标点击位置的像素坐标
              selectionStartPosRef.current = {x, y};
              return;
            }
          }
          
          // 开始创建新选区，清除旧的选中像素
          setIsSelecting(true);
          setSelectedPixels({});
          setSelection({startX: x, startY: y, endX: x, endY: y});
        } else if (toolMode === 'magic') {
          // 魔棒选择
          floodFillSelect(x, y, tolerance);
        } else if (toolMode === 'lasso') {
          // 开始套索选择
          setIsLassoSelecting(true);
          setLassoPath([{x, y}]);
        } else {
          setIsDrawing(true);
          handleCanvasInteraction(e);
        }
      } else {
        // 鼠标在画布外，但仍在容器内，开始选择操作
        if (toolMode === 'select') {
          // 开始创建新选区，位置设为画布边界
          setIsSelecting(true);
          setSelectedPixels({});
          
          // 计算相对于画布的坐标，如果超出边界则限制在画布范围内
          let x = Math.floor((e.clientX - canvasRect.left) / pixelSize);
          let y = Math.floor((e.clientY - canvasRect.top) / pixelSize);
          
          // 限制坐标在画布范围内
          x = Math.max(0, Math.min(width - 1, x));
          const height = canvasSize.height;
          y = Math.max(0, Math.min(height - 1, y));
          
          setSelection({startX: x, startY: y, endX: x, endY: y});
        }
        // 其他工具模式在画布外点击时不执行任何操作
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCanvasOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const canvasRect = canvas.getBoundingClientRect();
    const width = canvasSize.width;
    const height = canvasSize.height;
    const pixelSize = canvas.width / width;

    // 检查鼠标是否在画布范围内
    const isOnCanvas = e.clientX >= canvasRect.left && 
                      e.clientX <= canvasRect.right && 
                      e.clientY >= canvasRect.top && 
                      e.clientY <= canvasRect.bottom;

    let x = Math.floor((e.clientX - canvasRect.left) / pixelSize);
    let y = Math.floor((e.clientY - canvasRect.top) / pixelSize);

    // 限制坐标在画布范围内
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));

    if (isDrawing && !isSpacePressed && !isMovingSelection && isOnCanvas) {
      handleCanvasInteraction(e);
    } else if (isSelecting && toolMode === 'select') {
      // 更新选区
      if (selection) {
        setSelection({
          ...selection,
          endX: Math.max(0, Math.min(width - 1, x)),
          endY: Math.max(0, Math.min(height - 1, y))
        });
      }
    } else if (isMovingSelection && toolMode === 'select' && selection) {
      // 移动选区
      // 计算鼠标相对于点击位置的像素偏移量（使用ref确保获取最新值）
      const dx = x - selectionStartPosRef.current.x;
      const dy = y - selectionStartPosRef.current.y;
      
      // 使用像素偏移量作为整个选区的移动偏移量
      // 这样预览的移动位置就会与实际结果匹配
      setMoveOffset({ x: dx, y: dy });
    } else if (isLassoSelecting && toolMode === 'lasso') {
      // 更新套索路径
      if (x >= 0 && x < width && y >= 0 && y < height) {
        setLassoPath(prev => [...prev, {x, y}]);
      }
    } else if (isPastePreviewing) {
      // 更新粘贴预览位置
      setPastePreviewPos({
        x: Math.max(0, Math.min(width - 1, x)),
        y: Math.max(0, Math.min(height - 1, y))
      });
    } else {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        setMousePos({ x, y });
      }
    }
  };

  // 检查点是否在多边形内部的函数（射线法）
  const pointInPolygon = (x: number, y: number, polygon: {x: number; y: number}[]): boolean => {
    if (polygon.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > y) !== (yj > y)) && 
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }

    if (isDrawing) {
      addToHistory(layers);
      setIsDrawing(false);
    }

    if (isSelecting) {
      setIsSelecting(false);
      if (selection) {
        // 提取选中的像素
        const minX = Math.min(selection.startX, selection.endX);
        const maxX = Math.max(selection.startX, selection.endX);
        const minY = Math.min(selection.startY, selection.endY);
        const maxY = Math.max(selection.startY, selection.endY);
        
        const activeLayer = layers[activeLayerIndex];
        const selected: Record<string, string> = {};
        
        // 根据设置决定是否包含透明像素
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const key = x + ',' + y;
            if (selectTransparent) {
              selected[key] = activeLayer.pixels[key] || '';
            } else if (activeLayer.pixels[key]) {
              selected[key] = activeLayer.pixels[key];
            }
          }
        }
        
        setSelectedPixels(selected);
      }
    } else if (isLassoSelecting) {
      setIsLassoSelecting(false);
      
      if (lassoPath.length >= 3) {
        const activeLayer = layers[activeLayerIndex];
        const selected: Record<string, string> = {};
        
        // 计算套索路径的边界框
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        lassoPath.forEach(point => {
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
        });
        
        // 检查边界框内的所有像素是否在多边形内
        for (let y = Math.max(0, minY); y <= Math.min(canvasSize.height - 1, maxY); y++) {
          for (let x = Math.max(0, minX); x <= Math.min(canvasSize.width - 1, maxX); x++) {
            if (pointInPolygon(x, y, lassoPath)) {
              const key = x + ',' + y;
              if (selectTransparent) {
                selected[key] = activeLayer.pixels[key] || '';
              } else if (activeLayer.pixels[key]) {
                selected[key] = activeLayer.pixels[key];
              }
            }
          }
        }
        
        setSelectedPixels(selected);
        setSelection({ startX: minX, startY: minY, endX: maxX, endY: maxY });
      }
      
      // 清空套索路径
      setLassoPath([]);
    }

    if (isMovingSelection && selection && Object.keys(selectedPixels).length > 0) {
      setIsMovingSelection(false);
      
      // 移动选中的像素
      
      const dx = moveOffset.x;
      const dy = moveOffset.y;
      
      const newLayers = [...layers];
      const activeLayer = { ...newLayers[activeLayerIndex] };
      const newPixels = { ...activeLayer.pixels };
      
      // 清除原位置的像素（只清除被选中的非透明像素）
      Object.keys(selectedPixels).forEach(key => {
        if (selectedPixels[key]) {
          delete newPixels[key];
        }
      });
      
      // 在新位置绘制像素
      Object.keys(selectedPixels).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const newX = x + dx;
        const newY = y + dy;
        if (newX >= 0 && newX < canvasSize.width && newY >= 0 && newY < canvasSize.height) {
          const newKey = newX + ',' + newY;
          // 只有当像素值不为空字符串时才绘制（避免透明像素被填充）
          if (selectedPixels[key]) {
            newPixels[newKey] = selectedPixels[key];
          }
        }
      });
      
      activeLayer.pixels = newPixels;
      newLayers[activeLayerIndex] = activeLayer;
      
      setLayers(newLayers);
      addToHistory(newLayers);
      
      // 更新选区位置
      setSelection({
        startX: selection.startX + dx,
        startY: selection.startY + dy,
        endX: selection.endX + dx,
        endY: selection.endY + dy
      });
      
      // 更新选中像素的位置
      const updatedSelectedPixels: Record<string, string> = {};
      Object.keys(selectedPixels).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const newKey = (x + dx) + ',' + (y + dy);
        updatedSelectedPixels[newKey] = selectedPixels[key];
      });
      
      setSelectedPixels(updatedSelectedPixels);
      setMoveOffset({ x: 0, y: 0 });
    }

    // 处理粘贴预览模式下的点击
    if (isPastePreviewing && Object.keys(clipboardPixels).length > 0) {
      // 退出预览模式
      setIsPastePreviewing(false);
      
      // 执行粘贴操作
      const newLayers = [...layers];
      const activeLayer = { ...newLayers[activeLayerIndex] };
      const newPixels = { ...activeLayer.pixels };
      
      // 确保粘贴内容在画布范围内
      const canvasMaxX = canvasSize.width - 1;
      const canvasMaxY = canvasSize.height - 1;
      
      // 遍历剪贴板像素并粘贴到新位置
      Object.keys(clipboardPixels).forEach(key => {
        if (clipboardPixels[key]) {
          const [rx, ry] = key.split(',').map(Number);
          const newX = pastePreviewPos.x + rx;
          const newY = pastePreviewPos.y + ry;
          
          // 确保像素在画布范围内
          if (newX >= 0 && newX <= canvasMaxX && newY >= 0 && newY <= canvasMaxY) {
            const newKey = newX + ',' + newY;
            newPixels[newKey] = clipboardPixels[key];
          }
        }
      });
      
      activeLayer.pixels = newPixels;
      newLayers[activeLayerIndex] = activeLayer;
      
      setLayers(newLayers);
      addToHistory(newLayers);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // 不调用 stopPropagation，让事件可以正常处理

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.1, Math.min(10, canvasScale + delta));
      setCanvasScale(newScale);
    }
  };

  // 添加全局原生事件监听器来阻止浏览器默认缩放
  useEffect(() => {
    const handleGlobalWheel = (e: Event) => {
      const wheelEvent = e as WheelEvent;
      if (wheelEvent.ctrlKey || wheelEvent.metaKey) {
        e.preventDefault();
      }
    };

    // 添加多种事件类型以兼容不同浏览器
    const events = ['wheel', 'mousewheel', 'DOMMouseScroll'];
    events.forEach(event => {
      // 使用 passive: false 确保 preventDefault() 能正常工作
      window.addEventListener(event, handleGlobalWheel as EventListener, {
        capture: true,
        passive: false
      });
    });

    // 同时阻止触摸缩放
    const handleTouchMove = (e: TouchEvent) => {
      // 阻止双指缩放
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchmove', handleTouchMove, {
      capture: true,
      passive: false
    });

    return () => {
      // 清理所有事件监听器
      events.forEach(event => {
        window.removeEventListener(event, handleGlobalWheel as EventListener, {
          capture: true
        });
      });
      window.removeEventListener('touchmove', handleTouchMove, {
        capture: true
      });
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const resetView = () => {
    setCanvasScale(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLayers(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLayers(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const handleSizeChange = (sizeValue: string) => {
    if (sizeValue === 'custom') {
      setShowCustomSizeDialog(true);
      return;
    }

    const size = CONSTANTS.CANVAS_SIZES.find(s => {
      const sizeKey = s.width + 'x' + s.height;
      return sizeKey === sizeValue;
    });

    if (!size) return;

    setPendingSize(size);
    setShowConfirmDialog(true);
  };

  const confirmSizeChange = () => {
    if (pendingSize) {
      setCanvasSize(pendingSize);
      
      // 更新所有图层，只保留新画布边界内的像素
      const newLayers = layers.map(layer => {
        const updatedPixels: Record<string, string> = {};
        const { width, height } = pendingSize;
        
        // 过滤出在新画布边界内的像素
        Object.keys(layer.pixels).forEach(key => {
          const [x, y] = key.split(',').map(Number);
          if (x >= 0 && x < width && y >= 0 && y < height) {
            updatedPixels[key] = layer.pixels[key];
          }
        });
        
        // 返回更新后的图层，保留原有属性
        return {
          ...layer,
          pixels: updatedPixels
        };
      });
      
      setLayers(newLayers);
      setHistory([JSON.parse(JSON.stringify(newLayers))]);
      setHistoryIndex(0);
      setShowConfirmDialog(false);
      setPendingSize(null);
    }
  };

  const applyCustomSize = () => {
    const w = Math.max(8, Math.min(512, parseInt(customWidth) || 64));
    const h = Math.max(8, Math.min(512, parseInt(customHeight) || 64));

    const newSize = {
      label: w + 'x' + h,
      width: w,
      height: h
    };

    setPendingSize(newSize);
    setShowCustomSizeDialog(false);
    setShowConfirmDialog(true);
  };

  const confirmDeleteColor = () => {
    if (pendingDeleteColor) {
      const newColors = customColors.filter(c => c !== pendingDeleteColor);
      setCustomColors(newColors);
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.CUSTOM_COLORS, JSON.stringify(newColors));
      setShowDeleteColorDialog(false);
      setPendingDeleteColor(null);
    }
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    const hex = value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setCurrentColor(hex.toUpperCase());
    } else if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
      const r = hex[1];
      const g = hex[2];
      const b = hex[3];
      const fullHex = '#' + r + r + g + g + b + b;
      setCurrentColor(fullHex.toUpperCase());
    }
  };

  const addCustomColor = (color: string) => {
    const upperColor = color.toUpperCase();
    if (customColors.includes(upperColor)) {
      return false;
    }
    const newColors = [...customColors, upperColor];
    setCustomColors(newColors);
    localStorage.setItem(CONSTANTS.STORAGE_KEYS.CUSTOM_COLORS, JSON.stringify(newColors));
    return true;
  };

  // 色板栏拖动相关事件处理函数
  const handlePaletteMouseDown = (e: React.MouseEvent) => {
    setIsPaletteDragging(true);
    setDragStartX(e.clientX);
    e.preventDefault();
  };

  const handleLayersPanelMouseDown = (e: React.MouseEvent) => {
    setIsLayersPanelDragging(true);
    setDragStartX(e.clientX);
    e.preventDefault();
  };

  // 监听窗口大小变化，确保最大宽度始终是屏幕的1/3
  useEffect(() => {
    const handlePaletteMouseMove = (e: MouseEvent) => {
      if (!isPaletteDragging) return;
      
      const deltaX = dragStartX - e.clientX;
      const newWidth = paletteWidth + deltaX;
      
      // 确保新宽度在有效范围内
      if (newWidth < minPaletteWidth) {
        setIsPaletteCollapsed(true);
        setIsPaletteDragging(false);
      } else {
        const maxWidth = Math.floor(window.innerWidth / 3);
        const clampedWidth = Math.min(maxWidth, Math.max(minPaletteWidth, newWidth));
        setPaletteWidth(clampedWidth);
        setDragStartX(e.clientX);
      }
    };

    const handlePaletteMouseUp = () => {
      setIsPaletteDragging(false);
    };

    const handleLayersPanelMouseMove = (e: MouseEvent) => {
      if (!isLayersPanelDragging) return;
      
      const deltaX = e.clientX - dragStartX;
      const newWidth = layersPanelWidth + deltaX;
      
      const maxWidth = Math.floor(window.innerWidth / 3);
      const clampedWidth = Math.min(maxWidth, Math.max(minLayersPanelWidth, newWidth));
      setLayersPanelWidth(clampedWidth);
      setDragStartX(e.clientX);
    };

    const handleLayersPanelMouseUp = () => {
      setIsLayersPanelDragging(false);
    };

    window.addEventListener('mousemove', handlePaletteMouseMove);
    window.addEventListener('mouseup', handlePaletteMouseUp);
    window.addEventListener('mousemove', handleLayersPanelMouseMove);
    window.addEventListener('mouseup', handleLayersPanelMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handlePaletteMouseMove);
      window.removeEventListener('mouseup', handlePaletteMouseUp);
      window.removeEventListener('mousemove', handleLayersPanelMouseMove);
      window.removeEventListener('mouseup', handleLayersPanelMouseUp);
    };
  }, [isPaletteDragging, isLayersPanelDragging, dragStartX, paletteWidth, layersPanelWidth, minPaletteWidth, minLayersPanelWidth]);

  const handleQuickAddColor = () => {
    const upperColor = currentColor.toUpperCase();

    if (customColors.includes(upperColor)) {
      setToastMessage('颜色已存在');
      setShowToast(true);
      setHighlightColor(upperColor);
      setActivePalette('custom');
      setIsPaletteCollapsed(false);

      setTimeout(() => {
        setShowToast(false);
      }, 2000);

      setTimeout(() => {
        setHighlightColor(null);
      }, 3000);
    } else {
      const added = addCustomColor(currentColor);
      if (added) {
        setToastMessage('已添加到自定义色板');
        setShowToast(true);
        setHighlightColor(upperColor);
        setActivePalette('custom');
        setIsPaletteCollapsed(false);

        setTimeout(() => {
          setShowToast(false);
        }, 2000);

        setTimeout(() => {
          setHighlightColor(null);
        }, 3000);
      }
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value.toUpperCase();
    setCurrentColor(color);
    setHexInput(color);
  };





  const handleAddCurrentColor = () => {
    const upperColor = currentColor.toUpperCase();

    if (customColors.includes(upperColor)) {
      setToastMessage('颜色已存在');
      setShowToast(true);
      setHighlightColor(upperColor);
      setActivePalette('custom');

      setTimeout(() => {
        setShowToast(false);
      }, 2000);

      setTimeout(() => {
        setHighlightColor(null);
      }, 3000);

      setShowAddColorDialog(false);
    } else {
      addCustomColor(currentColor);
      setShowAddColorDialog(false);
    }
  };

  const handleAddNewColor = () => {
    const hex = newColorInput.trim();
    let validColor = null;

    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      validColor = hex.toUpperCase();
    } else if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
      const r = hex[1];
      const g = hex[2];
      const b = hex[3];
      validColor = ('#' + r + r + g + g + b + b).toUpperCase();
    }

    if (validColor) {
      if (customColors.includes(validColor)) {
        setToastMessage('颜色已存在');
        setShowToast(true);
        setHighlightColor(validColor);
        setActivePalette('custom');

        setTimeout(() => {
          setShowToast(false);
        }, 2000);

        setTimeout(() => {
          setHighlightColor(null);
        }, 3000);

        setShowAddColorDialog(false);
      } else {
        addCustomColor(validColor);
        setNewColorInput(CONSTANTS.DEFAULT_COLOR);
        setShowAddColorDialog(false);
      }
    } else {
      alert('请输入有效的HEX颜色代码（例如：#FF0000 或 #F00）');
    }
  };

  const previewWidth = Math.max(8, Math.min(512, parseInt(customWidth) || 64));
  const previewHeight = Math.max(8, Math.min(512, parseInt(customHeight) || 64));
  const totalPixels = previewWidth * previewHeight;



  const getToolbarPadding = () => {
    if (screenSize === 'small') return '6px 8px';
    if (screenSize === 'medium') return '8px 12px';
    return '12px 16px';
  };

  const getToolbarGap = () => {
    if (screenSize === 'small') return '6px';
    if (screenSize === 'medium') return '8px';
    return '12px';
  };

  const getIconSize = () => {
    if (screenSize === 'small') return 14;
    if (screenSize === 'medium') return 16;
    return 18;
  };

  const getColorBoxSize = () => {
    if (screenSize === 'small') return '28px';
    if (screenSize === 'medium') return '32px';
    return '40px';
  };

  const getHexInputWidth = () => {
    if (screenSize === 'small') return '65px';
    if (screenSize === 'medium') return '70px';
    return '80px';
  };

  const getButtonPadding = () => {
    if (screenSize === 'small') return '5px 10px';
    if (screenSize === 'medium') return '6px 12px';
    return '8px 16px';
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1A1A1A',
      color: '#E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      // 阻止触摸设备上的缩放行为
      touchAction: 'none'
    }} onWheel={handleWheel}>
      {/* Toast 提示 */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#2D3748',
          color: '#E2E8F0',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          zIndex: 2000,
          border: '1px solid #00D4FF',
          fontSize: '14px',
          fontWeight: '600',
          animation: 'slideDown 0.3s ease'
        }}>
          {toastMessage}
        </div>
      )}

      {showAddColorDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1002,
          padding: '20px'
        }} onClick={() => setShowAddColorDialog(false)}>
          <div style={{
            backgroundColor: '#2D3748',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid rgba(0, 212, 255, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#00D4FF'
            }}>
              添加到自定义色板
            </h2>

            <div style={{
              backgroundColor: '#1A1A1A',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #4A5568'
            }}>
              <div style={{ fontSize: '12px', color: '#718096', marginBottom: '8px' }}>
                当前颜色
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: currentColor,
                  borderRadius: '8px',
                  border: '2px solid #4A5568'
                }} />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#E2E8F0' }}>
                    {currentColor}
                  </div>
                  <button
                    onClick={handleAddCurrentColor}
                    style={{
                      marginTop: '4px',
                      padding: '4px 12px',
                      backgroundColor: '#00D4FF',
                      color: '#1A1A1A',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    添加此颜色
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#A0AEC0', marginBottom: '8px' }}>
                使用取色器选择
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={currentColor}
                  onChange={handleColorPickerChange}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    backgroundColor: '#1A1A1A',
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#1A1A1A',
                  borderRadius: '8px',
                  border: '1px solid #4A5568'
                }}>
                  <Pipette size={16} color="#00D4FF" />
                  <span style={{ fontSize: '13px', color: '#A0AEC0' }}>
                    点击取色器选择颜色
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#A0AEC0', marginBottom: '8px' }}>
                或手动输入颜色代码
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newColorInput}
                  onChange={(e) => setNewColorInput(e.target.value)}
                  placeholder="#FF0000"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    backgroundColor: '#1A1A1A',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#E2E8F0',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleAddNewColor}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#00D4FF',
                    color: '#1A1A1A',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  添加
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowAddColorDialog(false)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'transparent',
                color: '#A0AEC0',
                border: '2px solid #4A5568',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          padding: '20px'
        }} onClick={() => setShowConfirmDialog(false)}>
          <div style={{
            backgroundColor: '#2D3748',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid rgba(255, 100, 100, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 100, 100, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                fontSize: '24px'
              }}>
                ⚠️
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#E2E8F0'
              }}>
                确认更改画布尺寸
              </h2>
            </div>

            <p style={{
              color: '#A0AEC0',
              fontSize: '15px',
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              缩小画布尺寸会使当前所有图层被裁剪只保留相应左上角，扩大画布尺寸会使当前所有图层置于新画布对应左上角，此操作不可撤销。确定要继续吗？
            </p>

            {pendingSize && (
              <div style={{
                backgroundColor: '#1A1A1A',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #4A5568'
              }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>
                  新画布尺寸
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#00D4FF' }}>
                  {pendingSize.width} x {pendingSize.height} 像素
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPendingSize(null);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#A0AEC0',
                  border: '2px solid #4A5568',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '100px'
                }}
              >
                取消
              </button>
              <button
                onClick={confirmSizeChange}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#FF6464',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '100px',
                  boxShadow: '0 4px 12px rgba(255, 100, 100, 0.3)'
                }}
              >
                确认更改
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteColorDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          padding: '20px'
        }} onClick={() => {
          setShowDeleteColorDialog(false);
          setPendingDeleteColor(null);
        }}>
          <div style={{
            backgroundColor: '#2D3748',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid rgba(255, 100, 100, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 100, 100, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                fontSize: '24px'
              }}>
                ⚠️
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#E2E8F0'
              }}>
                确认删除颜色
              </h2>
            </div>

            <p style={{
              color: '#A0AEC0',
              fontSize: '15px',
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              确定要删除颜色 {pendingDeleteColor} 吗？此操作不可撤销。
            </p>

            {pendingDeleteColor && (
              <div style={{
                backgroundColor: '#1A1A1A',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #4A5568'
              }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>
                  要删除的颜色
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px' 
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: pendingDeleteColor,
                    borderRadius: '6px',
                    border: '2px solid #4A5568'
                  }} />
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#00D4FF' }}>
                    {pendingDeleteColor}
                  </div>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowDeleteColorDialog(false);
                  setPendingDeleteColor(null);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#A0AEC0',
                  border: '2px solid #4A5568',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '100px'
                }}
              >
                取消
              </button>
              <button
                onClick={confirmDeleteColor}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#FF6464',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '100px',
                  boxShadow: '0 4px 12px rgba(255, 100, 100, 0.3)'
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomSizeDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowCustomSizeDialog(false)}>
          <div style={{
            backgroundColor: '#2D3748',
            borderRadius: '16px',
            padding: isMobile ? '24px 20px' : '32px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            maxWidth: '460px',
            width: '100%',
            border: '1px solid rgba(0, 212, 255, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid #4A5568'
            }}>
              <div style={{
                width: '4px',
                height: '24px',
                backgroundColor: '#00D4FF',
                borderRadius: '2px',
                marginRight: '12px'
              }} />
              <h2 style={{
                margin: 0,
                fontSize: isMobile ? '18px' : '22px',
                fontWeight: '600',
                color: '#00D4FF'
              }}>
                自定义画布尺寸
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#A0AEC0',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  宽度
                </label>
                <input
                  type="number"
                  min="8"
                  max="512"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#1A1A1A',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#E2E8F0',
                    fontSize: '16px',
                    fontWeight: '500',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#718096'
                }}>
                  范围: 8-512
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#A0AEC0',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  高度
                </label>
                <input
                  type="number"
                  min="8"
                  max="512"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#1A1A1A',
                    border: '2px solid #4A5568',
                    borderRadius: '8px',
                    color: '#E2E8F0',
                    fontSize: '16px',
                    fontWeight: '500',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#718096'
                }}>
                  范围: 8-512
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#1A1A1A',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #4A5568'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#A0AEC0',
                marginBottom: '4px'
              }}>
                预览尺寸
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#00D4FF'
              }}>
                {previewWidth} x {previewHeight} 像素
              </div>
              <div style={{
                fontSize: '11px',
                color: '#718096',
                marginTop: '4px'
              }}>
                总像素数: {totalPixels.toLocaleString()}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowCustomSizeDialog(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#A0AEC0',
                  border: '2px solid #4A5568',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '100px'
                }}
              >
                取消
              </button>
              <button
                onClick={applyCustomSize}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#00D4FF',
                  color: '#1A1A1A',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '100px',
                  boxShadow: '0 4px 12px rgba(0, 212, 255, 0.3)'
                }}
              >
                应用
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          padding: '20px'
        }} onClick={() => setShowExportDialog(false)}>
          <div style={{
            backgroundColor: '#2D3748',
            borderRadius: '16px',
            padding: isMobile ? '24px 20px' : '32px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(0, 212, 255, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid #4A5568'
            }}>
              <div style={{
                width: '4px',
                height: '24px',
                backgroundColor: '#00D4FF',
                borderRadius: '2px',
                marginRight: '12px'
              }} />
              <h2 style={{
                margin: 0,
                fontSize: isMobile ? '18px' : '22px',
                fontWeight: '600',
                color: '#00D4FF'
              }}>
                导出图片
              </h2>
            </div>

            <div style={{
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#A0AEC0',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    格式
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(CONSTANTS.EXPORT_FORMATS[e.target.value as keyof typeof CONSTANTS.EXPORT_FORMATS])}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#1A1A1A',
                      border: '2px solid #4A5568',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                      fontSize: '16px',
                      fontWeight: '500',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="png">PNG（推荐）</option>
                    <option value="jpg">JPG</option>
                    <option value="svg">SVG</option>
                    <option value="json">JSON数据</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#A0AEC0',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    缩放倍数
                  </label>
                  <select
                    value={exportScale}
                    onChange={(e) => setExportScale(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#1A1A1A',
                      border: '2px solid #4A5568',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                      fontSize: '16px',
                      fontWeight: '500',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value={1}>1x（原始大小）</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                    <option value={8}>8x</option>
                    <option value={16}>16x</option>
                  </select>
                </div>
              </div>

              {exportFormat !== CONSTANTS.EXPORT_FORMATS.JSON && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#A0AEC0',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    缩放倍数
                  </label>
                  <select
                    value={exportScale}
                    onChange={(e) => setExportScale(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#1A1A1A',
                      border: '2px solid #4A5568',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                      fontSize: '16px',
                      fontWeight: '500',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value={1}>1x（原始大小）</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                    <option value={8}>8x</option>
                    <option value={16}>16x</option>
                  </select>
                </div>
              )}

              {exportFormat === CONSTANTS.EXPORT_FORMATS.JPG && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#A0AEC0',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    JPG质量 ({Math.round(exportQuality * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={exportQuality}
                    onChange={(e) => setExportQuality(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: '#4A5568',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#718096',
                    marginTop: '4px'
                  }}>
                    <span>低质量</span>
                    <span>高质量</span>
                  </div>
                </div>
              )}

              <div style={{
                backgroundColor: '#1A1A1A',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #4A5568'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#718096',
                  marginBottom: '8px'
                }}>
                  导出预览
                </div>
                {exportFormat === CONSTANTS.EXPORT_FORMATS.JSON ? (
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#00D4FF',
                    marginBottom: '4px'
                  }}>
                    {canvasSize.width} x {canvasSize.height} 像素
                  </div>
                ) : (
                  <>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#00D4FF',
                      marginBottom: '4px'
                    }}>
                      {canvasSize.width * exportScale} x {canvasSize.height * exportScale} 像素
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#718096'
                    }}>
                      总像素数: {(canvasSize.width * exportScale * canvasSize.height * exportScale).toLocaleString()}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowExportDialog(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#A0AEC0',
                  border: '2px solid #4A5568',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '100px'
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  setIsExporting(true);
                  // 实现导出功能
                  if (exportFormat === CONSTANTS.EXPORT_FORMATS.PNG) {
                    exportPNG();
                  } else if (exportFormat === CONSTANTS.EXPORT_FORMATS.JPG) {
                    exportJPG();
                  } else if (exportFormat === CONSTANTS.EXPORT_FORMATS.SVG) {
                    exportSVG();
                  } else if (exportFormat === CONSTANTS.EXPORT_FORMATS.JSON) {
                    exportJSON();
                  }
                }}
                disabled={isExporting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isExporting ? '#4A5568' : '#00D4FF',
                  color: isExporting ? '#A0AEC0' : '#1A1A1A',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '120px',
                  boxShadow: isExporting ? 'none' : '0 4px 12px rgba(0, 212, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isExporting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #A0AEC0',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    导出中...
                  </>
                ) : (
                  '开始导出'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 自动恢复对话框 */}
      {showRestoreDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
          }}
          onClick={ignoreRestore}
        >
          <div
            style={{
              backgroundColor: '#2D3748',
              padding: '32px',
              borderRadius: '12px',
              border: '2px solid #00D4FF',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#00D4FF',
              marginBottom: '16px'
            }}>
              发现未保存的项目
            </div>
            
            <div style={{
              fontSize: '14px',
              color: '#E2E8F0',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              检测到您有未完成的像素画作品，是否要恢复到上次的工作状态？
              <br />
              <span style={{ fontSize: '12px', color: '#A0AEC0' }}>
                （数据保存在 {restoreData?.timestamp ? new Date(restoreData.timestamp).toLocaleString() : ''}）
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={ignoreRestore}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#A0AEC0',
                  border: '2px solid #4A5568',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '100px'
                }}
              >
                忽略
              </button>
              <button
                onClick={restoreProject}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#00D4FF',
                  color: '#1A1A1A',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '120px',
                  boxShadow: '0 4px 12px rgba(0, 212, 255, 0.3)'
                }}
              >
                恢复项目
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: '#2D3748',
        padding: getToolbarPadding(),
        display: 'flex',
        alignItems: 'center',
        gap: getToolbarGap(),
        flexWrap: 'wrap',
        borderBottom: '1px solid #4A5568',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'), color: '#A0AEC0' }}>
            画布:
          </span>
          <select
            value={
              CONSTANTS.CANVAS_SIZES.some(s => s.width === canvasSize.width && s.height === canvasSize.height)
                ? (canvasSize.width + 'x' + canvasSize.height)
                : 'custom'
            }
            onChange={(e) => handleSizeChange(e.target.value)}
            style={{
              backgroundColor: '#4A5568',
              color: '#E2E8F0',
              border: 'none',
              borderRadius: '6px',
              padding: screenSize === 'small' ? '4px 6px' : (screenSize === 'medium' ? '4px 8px' : '6px 12px'),
              fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
              cursor: 'pointer'
            }}
          >
            {CONSTANTS.CANVAS_SIZES.map(size => (
              <option key={size.label} value={size.width + 'x' + size.height}>
                {size.label}
              </option>
            ))}
            <option value="custom">
              自定义 {!CONSTANTS.CANVAS_SIZES.some(s => s.label === canvasSize.label) ? ('(' + canvasSize.label + ')') : ''}
            </option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            title="撤销"
            style={{
              backgroundColor: historyIndex === 0 ? '#2D3748' : '#4A5568',
              color: historyIndex === 0 ? '#718096' : '#E2E8F0',
              border: 'none',
              borderRadius: '6px',
              padding: screenSize === 'small' ? '5px' : (screenSize === 'medium' ? '6px' : '8px'),
              cursor: historyIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Undo size={getIconSize()} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            title="重做"
            style={{
              backgroundColor: historyIndex === history.length - 1 ? '#2D3748' : '#4A5568',
              color: historyIndex === history.length - 1 ? '#718096' : '#E2E8F0',
              border: 'none',
              borderRadius: '6px',
              padding: screenSize === 'small' ? '5px' : (screenSize === 'medium' ? '6px' : '8px'),
              cursor: historyIndex === history.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Redo size={getIconSize()} />
          </button>
        </div>

        <div style={{
          display: 'flex',
          backgroundColor: '#1A1A1A',
          borderRadius: '8px',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            onClick={() => {
              setToolMode('draw');
              setSelection(null);
              setSelectedPixels({});
            }}
            title="绘制模式"
            style={{
              backgroundColor: toolMode === 'draw' ? '#00D4FF' : 'transparent',
              color: toolMode === 'draw' ? '#1A1A1A' : '#A0AEC0',
              border: 'none',
              borderRadius: '6px',
              padding: getButtonPadding(),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <Pencil size={getIconSize()} />
            {screenSize === 'large' && <span>绘制</span>}
          </button>
          <button
            onClick={() => setToolMode('select')}
            title="选择模式"
            style={{
              backgroundColor: toolMode === 'select' ? '#00D4FF' : 'transparent',
              color: toolMode === 'select' ? '#1A1A1A' : '#A0AEC0',
              border: 'none',
              borderRadius: '6px',
              padding: getButtonPadding(),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <MousePointer size={getIconSize()} />
            {screenSize === 'large' && <span>选择</span>}
          </button>
          <button
            onClick={() => {
              setToolMode('erase');
              setSelection(null);
              setSelectedPixels({});
            }}
            title="擦除模式"
            style={{
              backgroundColor: toolMode === 'erase' ? '#00D4FF' : 'transparent',
              color: toolMode === 'erase' ? '#1A1A1A' : '#A0AEC0',
              border: 'none',
              borderRadius: '6px',
              padding: getButtonPadding(),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <Eraser size={getIconSize()} />
            {screenSize === 'large' && <span>擦除</span>}
          </button>
          <button
            onClick={() => setToolMode('magic')}
            title="魔棒选择模式"
            style={{
              backgroundColor: toolMode === 'magic' ? '#00D4FF' : 'transparent',
              color: toolMode === 'magic' ? '#1A1A1A' : '#A0AEC0',
              border: 'none',
              borderRadius: '6px',
              padding: getButtonPadding(),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <Pipette size={getIconSize()} />
            {screenSize === 'large' && <span>魔棒</span>}
          </button>
          <button
            onClick={() => setToolMode('lasso')}
            title="套索选择模式"
            style={{
              backgroundColor: toolMode === 'lasso' ? '#00D4FF' : 'transparent',
              color: toolMode === 'lasso' ? '#1A1A1A' : '#A0AEC0',
              border: 'none',
              borderRadius: '6px',
              padding: getButtonPadding(),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <Pencil size={getIconSize()} />
            {screenSize === 'large' && <span>套索</span>}
          </button>
        </div>
        

        
        {/* 魔棒容差调节滑块 */}
        {toolMode === 'magic' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1A1A1A',
            borderRadius: '8px',
            padding: '6px 12px',
            minWidth: screenSize === 'small' ? '120px' : '150px'
          }}>
            <span style={{
              fontSize: screenSize === 'small' ? '10px' : (screenSize === 'medium' ? '11px' : '12px'),
              color: '#A0AEC0',
              fontWeight: '600'
            }}>
              容差: {tolerance}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={tolerance}
              onChange={(e) => setTolerance(parseInt(e.target.value))}
              title="调整魔棒选择的颜色容差"
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: '#4A5568',
                borderRadius: '2px',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none'
              }}
            />
          </div>
        )}
        
        {/* 导入导出按钮 */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => document.getElementById('import-file')?.click()}
            title="导入项目"
            style={{
              backgroundColor: '#4A5568',
              color: '#00D4FF',
              border: 'none',
              borderRadius: '6px',
              padding: getButtonPadding(),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0, 212, 255, 0.2)'
            }}
          >
            <Upload size={getIconSize()} />
            {screenSize === 'large' && <span>导入</span>}
          </button>
          <button
            onClick={() => setShowExportDialog(true)}
            title="导出PNG/JPG/SVG/JSON"
            style={{
              backgroundColor: '#4A5568',
              color: '#00D4FF',
              border: 'none',
              borderRadius: '6px',
              padding: getButtonPadding(),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0, 212, 255, 0.2)'
            }}
          >
            <Download size={getIconSize()} />
            {screenSize === 'large' && <span>导出</span>}
          </button>
        </div>
        
        {/* 隐藏的文件输入 */}
        <input
          id="import-file"
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileImport}
        />
        
        {/* 缩放控制 */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1A1A1A',
            borderRadius: '8px',
            padding: '4px'
          }}>
            <button
              onClick={() => setCanvasScale(Math.max(0.1, canvasScale - 0.1))}
              title="缩小 (Ctrl + 滚轮)"
              style={{
                padding: screenSize === 'small' ? '4px' : '6px',
                backgroundColor: 'transparent',
                color: '#A0AEC0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ZoomOut size={getIconSize()} />
            </button>

            <span style={{
              fontSize: screenSize === 'small' ? '11px' : '12px',
              color: '#E2E8F0',
              fontWeight: '600',
              minWidth: screenSize === 'small' ? '45px' : '50px',
              textAlign: 'center',
              fontFamily: 'monospace'
            }}>
              {Math.round(canvasScale * 100)}%
            </span>

            <button
              onClick={() => setCanvasScale(Math.min(10, canvasScale + 0.1))}
              title="放大 (Ctrl + 滚轮)"
              style={{
                padding: screenSize === 'small' ? '4px' : '6px',
                backgroundColor: 'transparent',
                color: '#A0AEC0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ZoomIn size={getIconSize()} />
            </button>

            <button
              onClick={resetView}
              title="重置视图"
              style={{
                padding: screenSize === 'small' ? '4px' : '6px',
                backgroundColor: 'transparent',
                color: '#A0AEC0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <RotateCcw size={getIconSize()} />
            </button>
          </div>
        )}

        {/* 色板面板按钮 */}
        <button
          onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
          title={isPaletteCollapsed ? "显示色板面板" : "隐藏色板面板"}
          style={{
            padding: screenSize === 'small' ? '5px' : (screenSize === 'medium' ? '6px' : '8px'),
            backgroundColor: !isPaletteCollapsed ? '#00D4FF' : '#4A5568',
            color: !isPaletteCollapsed ? '#1A1A1A' : '#A0AEC0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
            marginRight: '8px'
          }}
        >
          <Palette size={getIconSize()} />
        </button>

        {/* 图层面板按钮 */}
        <button
          onClick={() => setShowLayersPanel(!showLayersPanel)}
          title={showLayersPanel ? "隐藏图层面板" : "显示图层面板"}
          style={{
            padding: screenSize === 'small' ? '5px' : (screenSize === 'medium' ? '6px' : '8px'),
            backgroundColor: showLayersPanel ? '#00D4FF' : '#4A5568',
            color: showLayersPanel ? '#1A1A1A' : '#A0AEC0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}
        >
          <Layers size={getIconSize()} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginLeft: isMobile ? '0' : 'auto'
        }}>
          <Palette size={getIconSize()} color="#A0AEC0" />
          <div
            onClick={() => setShowColorPicker(!showColorPicker)}
            style={{
              width: getColorBoxSize(),
              height: getColorBoxSize(),
              backgroundColor: currentColor,
              border: '2px solid #4A5568',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
          >
            <input
              ref={colorPickerRef}
              type="color"
              value={currentColor}
              onChange={handleColorPickerChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
          </div>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInputChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="#000000"
            style={{
              width: getHexInputWidth(),
              padding: screenSize === 'small' ? '4px 6px' : (screenSize === 'medium' ? '4px 6px' : '6px 8px'),
              backgroundColor: '#1A1A1A',
              border: '2px solid #4A5568',
              borderRadius: '6px',
              color: '#E2E8F0',
              fontSize: screenSize === 'small' ? '10px' : (screenSize === 'medium' ? '11px' : '12px'),
              fontFamily: 'monospace',
              outline: 'none'
            }}
          />
          <button
            onClick={handleQuickAddColor}
            title="添加当前颜色到自定义色板"
            style={{
              padding: screenSize === 'small' ? '5px' : (screenSize === 'medium' ? '6px' : '8px'),
              backgroundColor: '#4A5568',
              color: '#00D4FF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={getIconSize()} />
          </button>
        </div>
        {/* 悬浮选择操作栏 */}
        {(toolMode === 'select' || toolMode === 'magic' || toolMode === 'lasso') && (
          <div
            ref={toolbarRef}
            style={{
              position: 'absolute',
              top: `${selectionToolbarPos.top}px`,
              left: `${selectionToolbarPos.left}px`,
              display: 'flex',
              backgroundColor: '#1A1A1A',
              borderRadius: '8px',
              padding: '4px',
              gap: '4px',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 1000,
              cursor: isToolbarDragging ? 'grabbing' : 'default'
            }}
            onMouseUp={() => {
              // 如果正在拖拽画布，触发主容器的mouseup处理
              if (isDragging || isSpacePressed) {
                handleMouseUp();
              }
            }}
            onMouseMove={(e) => {
              // 如果正在拖拽画布，让事件冒泡到主容器
              if (isDragging || isSpacePressed) {
                // 直接调用主容器的处理函数
                handleMouseMove(e);
              }
            }}
            onMouseDown={(e) => {
              // 只有在真正拖拽工具栏时才处理，避免干扰画布拖拽
              if ((e.target === e.currentTarget || (e.target as HTMLElement).closest('.toolbar-grabber')) && 
                  !isDragging && !isSpacePressed) {
                e.preventDefault();
                // 使用ref立即更新拖拽状态，避免state异步更新延迟
                isToolbarDraggingRef.current = true;
                setIsToolbarDragging(true);
                // 记录拖拽起始位置
                dragStartPos.current = { x: e.clientX, y: e.clientY };
                // 初始化lastMousePos
                lastMousePos.current = { x: e.clientX, y: e.clientY };
                
                // 直接从DOM获取当前工具栏位置，确保位置准确性
                if (toolbarRef.current && containerRef.current) {
                  const containerRect = containerRef.current.getBoundingClientRect();
                  const toolbarRect = toolbarRef.current.getBoundingClientRect();
                  
                  const top = toolbarRect.top - containerRect.top;
                  const left = toolbarRect.left - containerRect.left;
                  
                  // 存储工具栏尺寸，避免拖拽中动态获取尺寸导致的重排和尺寸值不准确
                  toolbarSizeRef.current = {
                    width: toolbarRect.width,
                    height: toolbarRect.height
                  };
                  
                  dragStartToolbarPos.current = { top, left };
                  currentToolbarPos.current = { top, left };
                } else if (toolbarRef.current) {
                  const computedStyle = window.getComputedStyle(toolbarRef.current);
                  const topStr = computedStyle.top;
                  const leftStr = computedStyle.left;
                  
                  const top = topStr ? parseFloat(topStr) : selectionToolbarPos.top;
                  const left = leftStr ? parseFloat(leftStr) : selectionToolbarPos.left;
                  
                  // 存储工具栏尺寸
                  toolbarSizeRef.current = {
                    width: parseFloat(computedStyle.width),
                    height: parseFloat(computedStyle.height)
                  };
                  
                  dragStartToolbarPos.current = { top, left };
                  currentToolbarPos.current = { top, left };
                } else {
                  // 无法从DOM获取时，使用默认值
                  toolbarSizeRef.current = {
                    width: 300,
                    height: 40
                  };
                  
                  dragStartToolbarPos.current = { ...selectionToolbarPos };
                  currentToolbarPos.current = { ...selectionToolbarPos };
                }
              } else {
                // 如果用户在拖拽画布（右键或空格键），让事件冒泡到主容器
                // 这样可以避免干扰画布拖拽状态
                if (isDragging || isSpacePressed) {
                  e.stopPropagation();
                }
              }
            }}
          >
            {/* 抓手元素 */}
            <div
              className="toolbar-grabber"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: '#2D3748',
                color: '#A0AEC0',
                cursor: 'grab',
                userSelect: 'none'
              }}
              title="拖动工具栏"
            >
              <Move size={getIconSize()} />
            </div>
            {/* 选择透明像素开关 */}
            {(toolMode === 'select' || toolMode === 'lasso') && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#2D3748',
                borderRadius: '6px',
                color: '#E2E8F0'
              }}>
                <label style={{
                  fontSize: screenSize === 'small' ? '10px' : (screenSize === 'medium' ? '11px' : '12px'),
                  fontWeight: '500'
                }}>
                  透明像素
                </label>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '30px',
                  height: '16px'
                }}>
                  <input
                    type="checkbox"
                    checked={selectTransparent}
                    onChange={(e) => setSelectTransparent(e.target.checked)}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: selectTransparent ? '#00D4FF' : '#4A5568',
                    transition: '.4s',
                    borderRadius: '16px'
                  }}></span>
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: '2px',
                    left: '2px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#FFFFFF',
                    transition: '.4s',
                    borderRadius: '50%',
                    transform: selectTransparent ? 'translateX(14px)' : 'translateX(0)'
                  }}></span>
                </label>
              </div>
            )}
            {/* 取消选择按钮 */}
            <button
              onClick={() => {
                setSelection(null);
                setSelectedPixels({});
              }}
              title="取消选择"
              style={{
                backgroundColor: Object.keys(selectedPixels).length > 0 ? '#E53E3E' : 'transparent',
                color: Object.keys(selectedPixels).length > 0 ? '#FFFFFF' : '#A0AEC0',
                border: 'none',
                borderRadius: '6px',
                padding: getButtonPadding(),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <X size={getIconSize()} />
              {screenSize === 'large' && <span>取消选择</span>}
            </button>
            
            {/* 复制按钮 */}
            <button
              onClick={() => {
                if (!selection || Object.keys(selectedPixels).length === 0) return;
                const minX = Math.min(selection.startX, selection.endX);
                const maxX = Math.max(selection.startX, selection.endX);
                const minY = Math.min(selection.startY, selection.endY);
                const maxY = Math.max(selection.startY, selection.endY);
                const activeLayer = layers[activeLayerIndex];
                const relativePixels: Record<string, string> = {};
                for (let y = minY; y <= maxY; y++) {
                  for (let x = minX; x <= maxX; x++) {
                    const key = x + ',' + y;
                    if (activeLayer.pixels[key]) {
                      relativePixels[(x - minX) + ',' + (y - minY)] = activeLayer.pixels[key];
                    }
                  }
                }
                setClipboardPixels(relativePixels);
                setClipboardSize({ width: maxX - minX + 1, height: maxY - minY + 1 });
              }}
              title="复制选中内容"
              disabled={Object.keys(selectedPixels).length === 0}
              style={{
                backgroundColor: Object.keys(selectedPixels).length > 0 ? '#10B981' : 'transparent',
                color: Object.keys(selectedPixels).length > 0 ? '#FFFFFF' : '#A0AEC0',
                border: 'none',
                borderRadius: '6px',
                padding: getButtonPadding(),
                cursor: Object.keys(selectedPixels).length > 0 ? 'pointer' : 'not-allowed',
                opacity: Object.keys(selectedPixels).length > 0 ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <Copy size={getIconSize()} />
              {screenSize === 'large' && <span>复制</span>}
            </button>
            
            {/* 粘贴按钮 */}
            <button
              onClick={() => {
                if (Object.keys(clipboardPixels).length === 0) return;
                // 进入粘贴预览模式
                setIsPastePreviewing(true);
                setPastePreviewPos({
                  x: Math.max(0, mousePos.x),
                  y: Math.max(0, mousePos.y)
                });
              }}
              title="粘贴内容"
              disabled={Object.keys(clipboardPixels).length === 0}
              style={{
                backgroundColor: Object.keys(clipboardPixels).length > 0 ? '#3B82F6' : 'transparent',
                color: Object.keys(clipboardPixels).length > 0 ? '#FFFFFF' : '#A0AEC0',
                border: 'none',
                borderRadius: '6px',
                padding: getButtonPadding(),
                cursor: Object.keys(clipboardPixels).length > 0 ? 'pointer' : 'not-allowed',
                opacity: Object.keys(clipboardPixels).length > 0 ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={getIconSize()} />
              {screenSize === 'large' && <span>粘贴</span>}
            </button>
            
            {/* 删除按钮 */}
            <button
              onClick={() => {
                if (!selection || Object.keys(selectedPixels).length === 0) return;
                const newLayers = [...layers];
                const activeLayer = { ...newLayers[activeLayerIndex] };
                const newPixels = { ...activeLayer.pixels };
                Object.keys(selectedPixels).forEach(key => delete newPixels[key]);
                activeLayer.pixels = newPixels;
                newLayers[activeLayerIndex] = activeLayer;
                setLayers(newLayers);
                setSelectedPixels({});
                setSelection(null);
                addToHistory(newLayers);
              }}
              title="删除选中内容"
              disabled={Object.keys(selectedPixels).length === 0}
              style={{
                backgroundColor: Object.keys(selectedPixels).length > 0 ? '#E53E3E' : 'transparent',
                color: Object.keys(selectedPixels).length > 0 ? '#FFFFFF' : '#A0AEC0',
                border: 'none',
                borderRadius: '6px',
                padding: getButtonPadding(),
                cursor: Object.keys(selectedPixels).length > 0 ? 'pointer' : 'not-allowed',
                opacity: Object.keys(selectedPixels).length > 0 ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <Trash2 size={getIconSize()} />
              {screenSize === 'large' && <span>删除</span>}
            </button>
            
            {/* 填充按钮 */}
            <button
              onClick={() => {
                if (Object.keys(selectedPixels).length === 0) return;
                const newLayers = [...layers];
                const activeLayer = { ...newLayers[activeLayerIndex] };
                const newPixels = { ...activeLayer.pixels };
                // 只填充selectedPixels中包含的实际选中坐标
                Object.keys(selectedPixels).forEach(key => {
                  newPixels[key] = currentColor;
                });
                
                activeLayer.pixels = newPixels;
                newLayers[activeLayerIndex] = activeLayer;
                setLayers(newLayers);
                addToHistory(newLayers);
              }}
              title="以当前颜色填充"
              disabled={Object.keys(selectedPixels).length === 0}
              style={{
                backgroundColor: Object.keys(selectedPixels).length > 0 ? '#3B82F6' : 'transparent',
                color: Object.keys(selectedPixels).length > 0 ? '#FFFFFF' : '#A0AEC0',
                border: 'none',
                borderRadius: '6px',
                padding: getButtonPadding(),
                cursor: Object.keys(selectedPixels).length > 0 ? 'pointer' : 'not-allowed',
                opacity: Object.keys(selectedPixels).length > 0 ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: screenSize === 'small' ? '11px' : (screenSize === 'medium' ? '12px' : '14px'),
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              <Palette size={getIconSize()} />
              {screenSize === 'large' && <span>填充</span>}
            </button>
          </div>
        )}
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* 图层面板 */}
        <div style={{
          width: isMobile ? (showLayersPanel ? '100%' : '0') : (showLayersPanel ? `${layersPanelWidth}px` : '0'),
          backgroundColor: '#2D3748',
          borderRight: isMobile ? 'none' : '1px solid #4A5568',
          borderBottom: isMobile ? '1px solid #4A5568' : 'none',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
          padding: showLayersPanel ? '0' : '0',
          overflowY: showLayersPanel ? 'auto' : 'hidden',
          overflowX: 'hidden',
          position: 'relative'
        }}>
          {/* 图层面板拖动手柄 */}
          {!isMobile && showLayersPanel && (
            <div
              style={{
                position: 'absolute',
                right: '-7.5px',
                top: '0',
                bottom: '0',
                width: '15px',
                cursor: 'col-resize',
                backgroundColor: 'transparent',
                zIndex: 10
              }}
              onMouseDown={handleLayersPanelMouseDown}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00D4FF';
                e.currentTarget.style.opacity = '0.3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.opacity = '1';
              }}
            />
          )}
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#1A1A1A',
              borderBottom: '1px solid #4A5568',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: screenSize === 'small' ? '16px' : '18px',
                color: '#00D4FF',
                fontWeight: '600'
              }}>
                图层
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <button
                  onClick={() => {
                    const newLayer: Layer = {
                      id: `layer-${Date.now()}`,
                      name: `图层 ${layers.length + 1}`,
                      visible: true,
                      locked: false,
                      opacity: 1,
                      pixels: {}
                    };
                    const newLayers = [...layers, newLayer];
                    setLayers(newLayers);
                    setActiveLayerIndex(newLayers.length - 1);
                    addToHistory(newLayers);
                  }}
                  title="添加新图层"
                  style={{
                    padding: screenSize === 'small' ? '5px' : '6px',
                    backgroundColor: '#4A5568',
                    color: '#00D4FF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Plus size={getIconSize()} />
                </button>
                <button
                  onClick={() => setShowLayersPanel(false)}
                  title="关闭图层面板"
                  style={{
                    padding: screenSize === 'small' ? '5px' : '6px',
                    backgroundColor: '#4A5568',
                    color: '#A0AEC0',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={getIconSize()} />
                </button>
              </div>
            </div>
            
            {/* 图层列表 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px'
            }}>
              {layers.map((layer, index) => {
                const isActive = index === activeLayerIndex;
                
                return (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayerIndex(index)}
                    style={{
                      backgroundColor: isActive ? '#4A5568' : '#1A1A1A',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '6px',
                      cursor: layer.locked ? 'not-allowed' : 'pointer',
                      border: isActive ? '2px solid #00D4FF' : '2px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: layer.locked ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* 图层操作按钮组 - 固定宽度 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}>
                      {/* 可见性 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newLayers = [...layers];
                          newLayers[index] = {
                            ...layer,
                            visible: !layer.visible
                          };
                          setLayers(newLayers);
                          addToHistory(newLayers);
                        }}
                        title={layer.visible ? "隐藏图层" : "显示图层"}
                        style={{
                          padding: '3px',
                          backgroundColor: 'transparent',
                          color: layer.visible ? '#E2E8F0' : '#718096',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      
                      {/* 锁定 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newLayers = [...layers];
                          newLayers[index] = {
                            ...layer,
                            locked: !layer.locked
                          };
                          setLayers(newLayers);
                          addToHistory(newLayers);
                        }}
                        title={layer.locked ? "解锁图层" : "锁定图层"}
                        style={{
                          padding: '3px',
                          backgroundColor: 'transparent',
                          color: layer.locked ? '#FF6464' : '#718096',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                    </div>
                    
                    {/* 图层名称 - 占据中间空间 */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                      overflow: 'hidden'
                    }}>
                      {/* 图层预览缩略图 */}
                      <canvas
                        width={24}
                        height={24}
                        ref={(canvas) => {
                          if (!canvas) return;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          
                          // 绘制缩略图画板背景
                          ctx.fillStyle = '#CCCCCC';
                          ctx.fillRect(0, 0, 24, 24);
                          
                          // 绘制图层内容
                          ctx.globalAlpha = layer.opacity;
                          
                          // 计算像素大小
                          const pixelSize = 24 / Math.max(canvasSize.width, canvasSize.height);
                          
                          // 绘制所有像素
                          Object.keys(layer.pixels).forEach(key => {
                            const parts = key.split(',');
                            const x = Number(parts[0]);
                            const y = Number(parts[1]);
                            
                            ctx.fillStyle = layer.pixels[key];
                            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
                          });
                          
                          ctx.globalAlpha = 1;
                          
                          // 如果图层被锁定，添加锁的标记
                          if (layer.locked) {
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                            ctx.fillRect(0, 0, 24, 24);
                          }
                          
                          // 如果图层不可见，添加透明标记
                          if (!layer.visible) {
                            ctx.strokeStyle = '#FF6464';
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(4, 4);
                            ctx.lineTo(20, 20);
                            ctx.moveTo(20, 4);
                            ctx.lineTo(4, 20);
                            ctx.stroke();
                          }
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '2px',
                          backgroundColor: '#CCCCCC',
                          cursor: 'pointer',
                          border: isActive ? '1px solid #00D4FF' : '1px solid transparent',
                          flexShrink: 0
                        }}
                      />
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '1px',
                        backgroundColor: isActive ? '#00D4FF' : '#4A5568',
                        cursor: 'pointer',
                        flexShrink: 0
                      }} />
                      {editingLayerId === layer.id ? (
                        <input
                          ref={nameInputRef}
                          type="text"
                          value={editingLayerName}
                          onChange={(e) => setEditingLayerName(e.target.value)}
                          onBlur={() => {
                            // 保存图层名称
                            const trimmedName = editingLayerName.trim();
                            if (trimmedName) {
                              const newLayers = [...layers];
                              newLayers[index] = {
                                ...layer,
                                name: trimmedName
                              };
                              setLayers(newLayers);
                              addToHistory(newLayers);
                            }
                            setEditingLayerId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              // 保存图层名称
                              const trimmedName = editingLayerName.trim();
                              if (trimmedName) {
                                const newLayers = [...layers];
                                newLayers[index] = {
                                  ...layer,
                                  name: trimmedName
                                };
                                setLayers(newLayers);
                                addToHistory(newLayers);
                              }
                              setEditingLayerId(null);
                            } else if (e.key === 'Escape') {
                              // 取消编辑
                              setEditingLayerId(null);
                            }
                          }}
                          style={{
                            fontSize: screenSize === 'small' ? '13px' : '14px',
                            color: '#E2E8F0',
                            fontWeight: isActive ? '600' : '400',
                            backgroundColor: isActive ? '#3A4750' : '#151515',
                            border: '1px solid #00D4FF',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            outline: 'none',
                            width: '100%',
                            minWidth: '0'
                          }}
                        />
                      ) : (
                        <span 
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingLayerId(layer.id);
                            setEditingLayerName(layer.name);
                            setTimeout(() => {
                              if (nameInputRef.current) {
                                nameInputRef.current.focus();
                                nameInputRef.current.select();
                              }
                            }, 0);
                          }}
                          style={{
                            fontSize: screenSize === 'small' ? '13px' : '14px',
                            color: layer.visible ? '#E2E8F0' : '#718096',
                            fontWeight: isActive ? '600' : '400',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'text',
                            minWidth: '0'
                          }}
                        >
                          {layer.name}
                        </span>
                      )}
                    </div>
                    
                    {/* 图层顺序和删除按钮 - 固定在最右侧 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0,
                      marginLeft: 'auto'
                    }}>
                      {/* 向上 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index === 0) return;
                          const newLayers = [...layers];
                          const temp = newLayers[index];
                          newLayers[index] = newLayers[index - 1];
                          newLayers[index - 1] = temp;
                          setLayers(newLayers);
                          setActiveLayerIndex(index - 1);
                          addToHistory(newLayers);
                        }}
                        disabled={index === 0}
                        title="上移图层"
                        style={{
                          padding: '3px',
                          backgroundColor: 'transparent',
                          color: index === 0 ? '#4A5568' : '#718096',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      
                      {/* 向下 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index === layers.length - 1) return;
                          const newLayers = [...layers];
                          const temp = newLayers[index];
                          newLayers[index] = newLayers[index + 1];
                          newLayers[index + 1] = temp;
                          setLayers(newLayers);
                          setActiveLayerIndex(index + 1);
                          addToHistory(newLayers);
                        }}
                        disabled={index === layers.length - 1}
                        title="下移图层"
                        style={{
                          padding: '3px',
                          backgroundColor: 'transparent',
                          color: index === layers.length - 1 ? '#4A5568' : '#718096',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: index === layers.length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>
                      
                      {/* 删除 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (layers.length <= 1) return;
                          const newLayers = layers.filter((_, i) => i !== index);
                          setLayers(newLayers);
                          setActiveLayerIndex(Math.min(activeLayerIndex, newLayers.length - 1));
                          addToHistory(newLayers);
                        }}
                        disabled={layers.length <= 1}
                        title="删除图层"
                        style={{
                          padding: '3px',
                          backgroundColor: 'transparent',
                          color: layers.length <= 1 ? '#4A5568' : '#FF6464',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: layers.length <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 图层属性控制面板 */}
            {layers.length > 0 && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#1A1A1A',
                borderTop: '1px solid #4A5568',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <div style={{
                    fontSize: '12px',
                    color: '#718096',
                    marginBottom: '4px'
                  }}>
                    不透明度
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={layers[activeLayerIndex].opacity}
                    onChange={(e) => {
                      const newOpacity = parseFloat(e.target.value);
                      const newLayers = [...layers];
                      newLayers[activeLayerIndex] = {
                        ...newLayers[activeLayerIndex],
                        opacity: newOpacity
                      };
                      setLayers(newLayers);
                      addToHistory(newLayers);
                    }}
                    style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#4A5568',
                      borderRadius: '3px',
                      outline: 'none',
                      WebkitAppearance: 'none'
                    }}
                  />
                  <div style={{
                    fontSize: '11px',
                    color: '#A0AEC0',
                    textAlign: 'right',
                    marginTop: '4px'
                  }}>
                    {(layers[activeLayerIndex].opacity * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            )}
          </div>




        {/* 移动端缩放控制 - 左下角浮动 */}
        {isMobile && (
          <div style={{
            position: 'fixed',
            left: '12px',
            bottom: '60px',
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            transition: 'bottom 0.3s ease'
          }}>
            <button
              onClick={() => setCanvasScale(Math.min(10, canvasScale + 0.2))}
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: '#2D3748',
                color: '#E2E8F0',
                border: '1px solid #4A5568',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'all 0.2s'
              }}
            >
              <ZoomIn size={20} />
            </button>

            <div style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#1A1A1A',
              color: '#00D4FF',
              border: '1px solid #4A5568',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
            }}>
              {Math.round(canvasScale * 100)}%
            </div>

            <button
              onClick={() => setCanvasScale(Math.max(0.1, canvasScale - 0.2))}
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: '#2D3748',
                color: '#E2E8F0',
                border: '1px solid #4A5568',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'all 0.2s'
              }}
            >
              <ZoomOut size={20} />
            </button>

            <button
              onClick={resetView}
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: '#2D3748',
                color: '#00D4FF',
                border: '1px solid #4A5568',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'all 0.2s'
              }}
            >
              <RotateCcw size={18} />
            </button>
          </div>
        )}
        <div 
          ref={containerRef}
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: isMobile ? '16px' : '24px',
            overflow: 'auto'
          }} 
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => handleMouseUp()}
          onContextMenu={handleContextMenu}>
          <div
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease',
              cursor: isSpacePressed || isDragging ? 'grab' : (toolMode === 'erase' ? 'cell' : 'crosshair')
            }}>
            <canvas
              ref={canvasRef}
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  e.preventDefault();
                  const touch1 = e.touches[0];
                  const touch2 = e.touches[1];
                  const dx = touch1.clientX - touch2.clientX;
                  const dy = touch1.clientY - touch2.clientY;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  setTouchStartDistance(distance);
                  setIsDragging(true);

                  const centerX = (touch1.clientX + touch2.clientX) / 2;
                  const centerY = (touch1.clientY + touch2.clientY) / 2;
                  setLastTouchPos({ x: centerX, y: centerY });
                } else if (e.touches.length === 1) {
                  setIsDrawing(true);
                  handleCanvasInteraction(e);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 2) {
                  e.preventDefault();

                  const touch1 = e.touches[0];
                  const touch2 = e.touches[1];
                  const dx = touch1.clientX - touch2.clientX;
                  const dy = touch1.clientY - touch2.clientY;
                  const currentDistance = Math.sqrt(dx * dx + dy * dy);

                  if (touchStartDistance > 0) {
                    const scale = currentDistance / touchStartDistance;
                    const newScale = Math.max(0.1, Math.min(10, canvasScale * scale));
                    setCanvasScale(newScale);
                    setTouchStartDistance(currentDistance);
                  }

                  const centerX = (touch1.clientX + touch2.clientX) / 2;
                  const centerY = (touch1.clientY + touch2.clientY) / 2;

                  if (lastTouchPos) {
                    setCanvasOffset({
                      x: canvasOffset.x + (centerX - lastTouchPos.x),
                      y: canvasOffset.y + (centerY - lastTouchPos.y)
                    });
                  }

                  setLastTouchPos({ x: centerX, y: centerY });
                } else if (e.touches.length === 1 && isDrawing) {
                  handleCanvasInteraction(e);
                }
              }}
              onTouchEnd={(e) => {
                if (e.touches.length === 0) {
                  setTouchStartDistance(0);
                  setLastTouchPos(null);
                  setIsDragging(false);

                  if (isDrawing) {
                    addToHistory(layers);
                    setIsDrawing(false);
                  }
                } else if (e.touches.length === 1) {
                  setTouchStartDistance(0);
                  setLastTouchPos(null);
                }
              }}
              style={{
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                borderRadius: '4px',
                touchAction: 'none'
              }}
            />
          </div>
        </div>

        <div style={{
          width: isMobile ? '100%' : (isPaletteCollapsed ? '0' : `${paletteWidth}px`),
          height: isMobile ? (isPaletteCollapsed ? '0' : 'auto') : 'auto',
          backgroundColor: '#2D3748',
          padding: isPaletteCollapsed ? '0' : '16px',
          overflowY: isPaletteCollapsed ? 'hidden' : 'auto',
          overflowX: 'hidden',
          borderLeft: isMobile ? 'none' : '1px solid #4A5568',
          borderTop: isMobile ? '1px solid #4A5568' : 'none',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}>
          {/* 色板栏拖动手柄 */}
          {!isMobile && !isPaletteCollapsed && (
            <div
              style={{
                position: 'absolute',
                left: '-7.5px',
                top: '0',
                bottom: '0',
                width: '15px',
                cursor: 'col-resize',
                backgroundColor: 'transparent',
                zIndex: 10
              }}
              onMouseDown={handlePaletteMouseDown}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00D4FF';
                e.currentTarget.style.opacity = '0.3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.opacity = '1';
              }}
            />
          )}
          {!isPaletteCollapsed && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: isMobile ? '14px' : '16px',
                  color: '#E2E8F0'
                }}>
                  调色板
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {activePalette === 'custom' && (
                    <button
                      onClick={() => setShowAddColorDialog(true)}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#00D4FF',
                        color: '#1A1A1A',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      + 添加
                    </button>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '12px',
                borderBottom: '1px solid #4A5568',
                paddingBottom: '8px',
                overflowX: 'auto',
                flexWrap: 'wrap'
              }}>
                {(Object.keys(CONSTANTS.COLOR_PALETTES) as Array<keyof typeof CONSTANTS.COLOR_PALETTES>).map(key => (
                  <button
                    key={key}
                    onClick={() => setActivePalette(key)}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: activePalette === key ? '#00D4FF' : 'transparent',
                      color: activePalette === key ? '#1A1A1A' : '#A0AEC0',
                      border: activePalette === key ? 'none' : '1px solid #4A5568',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {CONSTANTS.COLOR_PALETTES[key].name}
                  </button>
                ))}
                <button
                  onClick={() => setActivePalette('custom')}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: activePalette === 'custom' ? '#00D4FF' : 'transparent',
                    color: activePalette === 'custom' ? '#1A1A1A' : '#A0AEC0',
                    border: activePalette === 'custom' ? 'none' : '1px solid #4A5568',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  自定义 ({customColors.length})
                </button>
              </div>

              {activePalette === 'custom' ? (
                <div>
                  {customColors.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '32px 16px',
                      color: '#718096',
                      fontSize: '13px'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎨</div>
                      <div>还没有自定义颜色</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>
                        点击上方"添加"按钮开始
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        fontSize: '11px',
                        color: '#718096',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: '#1A1A1A',
                        borderRadius: '6px'
                      }}>
                        💡 提示：右键点击(移动端长按)可删除颜色
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {customColors.map((color, index) => {
                          const isHighlighted = highlightColor === color;
                          return (
                            <div
                              key={'custom-' + index + '-' + color}
                              onMouseDown={(e) => {
                                if (e.button === 0) {
                                  setCurrentColor(color);
                                  setHexInput(color);
                                }
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                setPendingDeleteColor(color);
                                setShowDeleteColorDialog(true);

                                return false;
                              }}
                              onTouchStart={() => {
                                const touchTimer = setTimeout(() => {
                                  setPendingDeleteColor(color);
                                  setShowDeleteColorDialog(true);
                                }, 500);

                                const handleTouchEnd = () => {
                                  clearTimeout(touchTimer);
                                  document.removeEventListener('touchend', handleTouchEnd);
                                };
                                document.addEventListener('touchend', handleTouchEnd);
                              }}
                              style={{
                                width: getColorBoxSize(),
                                height: getColorBoxSize(),
                                backgroundColor: color,
                                border: currentColor === color ? '3px solid #00D4FF' : (isHighlighted ? '3px solid #FFD700' : '2px solid #4A5568'),
                                borderRadius: '6px',
                                cursor: 'pointer',
                                boxShadow: currentColor === color ?
                                  '0 0 8px rgba(0, 212, 255, 0.5)' :
                                  (isHighlighted ? '0 0 12px rgba(255, 215, 0, 0.6)' : '0 2px 4px rgba(0,0,0,0.2)'),
                                transition: 'all 0.2s',
                                position: 'relative',
                                animation: isHighlighted ? 'pulse 1s ease-in-out 3' : 'none',
                                userSelect: 'none'
                              }}
                              title={color + ' (右键删除)'}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {CONSTANTS.COLOR_PALETTES[activePalette as keyof typeof CONSTANTS.COLOR_PALETTES].colors.map((color: string, index: number) => (
                    <div
                      key={activePalette + '-' + index}
                      onClick={() => {
                        setCurrentColor(color);
                        setHexInput(color);
                      }}
                      style={{
                        width: getColorBoxSize(),
                        height: getColorBoxSize(),
                        backgroundColor: color,
                        border: currentColor === color ? '3px solid #00D4FF' : '2px solid #4A5568',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: currentColor === color ?
                          '0 0 8px rgba(0, 212, 255, 0.5)' :
                          '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s'
                      }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: '#2D3748',
        padding: screenSize === 'small' ? '6px 12px' : (screenSize === 'medium' ? '8px 16px' : '8px 16px'),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: screenSize === 'small' ? '10px' : (screenSize === 'medium' ? '11px' : '12px'),
        color: '#A0AEC0',
        borderTop: '1px solid #4A5568',
        flexWrap: 'wrap',
        gap: screenSize === 'small' ? '6px' : '8px'
      }}>
        <span>画布: {canvasSize.width}x{canvasSize.height}</span>
        <span>坐标: ({mousePos.x}, {mousePos.y})</span>
        <span>像素数: {Object.keys(pixels).length}</span>
        {screenSize !== 'small' && <span>模式: {toolMode === 'draw' ? '绘制' : toolMode === 'erase' ? '擦除' : '选择'}</span>}
        <span>缩放: {Math.round(canvasScale * 100)}%</span>
        {screenSize !== 'small' && <span>历史: {historyIndex}/{history.length - 1}</span>}
      </div>
    </div>
  );
}