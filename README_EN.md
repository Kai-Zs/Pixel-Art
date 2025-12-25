# 🎨 Pixel Art

A powerful and beautifully designed pixel art creation tool.

![Pixel Art](https://img.shields.io/badge/Version-1.0.0-blue) ![React](https://img.shields.io/badge/React-18.2+-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6) ![Vite](https://img.shields.io/badge/Vite-7.2+-646CFF)

[中文文档](README.md) | [English Documentation](README_EN.md)

## ✨ Core Features

### 🖼️ Canvas System

- **Size Presets** - 16×16, 32×32, 64×64, 128×128, 256×256
- **Custom Dimensions** - 8-512 pixels, independent width/height
- **Transparent Background** - Checkerboard display
- **Undo/Redo** - Keyboard shortcut support

### 🎨 Drawing Tools

- **Three Modes**
  - ✏️ **Draw** - Freehand pixel drawing
  - 🖱️ **Select** - Rectangle, magic wand, lasso
  - 🧹 **Erase** - Precise pixel erasing
- **Smart Cursor** - Auto-switch based on mode
- **Magic Wand Tolerance** - Adjustable selection precision

### 🌈 Color System

- **10 Preset Palettes** - Basic, Retro, Flat, Macaron, Neon, Earth, Ocean, Sunset, Cyberpunk, Grayscale
- **HEX Input** - Supports #RGB and #RRGGBB
- **Custom Palette** - Color picker add, right-click delete, LocalStorage persistence

### 📚 Layer System

- Create, delete, rename layers
- Drag to sort, adjust opacity
- Show/hide/lock

### 🔍 Zoom & Navigation

- **Zoom** - Ctrl + scroll wheel, top buttons, pinch-to-zoom (mobile)
- **Pan** - Right-click drag, space + left-click drag
- **Reset View** - One-click zoom to fit
- **Status Bar** - Display size, coordinates, zoom level

### 🎯 User Experience

- **Movable Floating Toolbar** - With drag handle
- **Toast Notifications** - Operation feedback
- **Confirmation Dialogs** - Secondary confirmation for dangerous operations
- **Responsive Design** - Adapt to various screens

## 🚀 Quick Start

```bash
npm install
npm run dev
npm run build
```

## 📖 User Guide

### Basic Operations

1. Select canvas size
2. Choose color
3. Click or drag to draw
4. Switch between draw/select/edit/erase modes

### Selection & Editing

- **Rectangle Selection**: Drag to select in select mode
- **Magic Wand Selection**: Click to select similar colors, use tolerance slider
- **Lasso Selection**: Freehand selection
- **Move Selection**: Drag within selection
- **Copy/Paste**: Ctrl+C / Ctrl+V
- **Delete Selection**: Delete key

### Layer Operations

Right-side layer panel: Create, sort, adjust opacity, show/hide, lock

## 🎯 Development Roadmap

### ✅ Completed

- [x] Core canvas system
- [x] Tool modes (draw, select, edit, erase)
- [x] Selection tools (rectangle, magic wand, lasso)
- [x] Selection editing (move, copy, paste, delete)
- [x] Color system and palettes
- [x] Zoom and navigation
- [x] Layer system

### 🚧 In Progress

- [ ] PNG/JPG export
- [ ] SVG export
- [ ] Project import/export
- [ ] Auto-save

### 📋 Planned

- [ ] Reference image feature
- [ ] Complete keyboard shortcuts
- [ ] Extract palette from image
- [ ] Settings panel
- [ ] Advanced drawing tools
- [ ] Canvas transformations
- [ ] Performance optimization
- [ ] Mobile optimization

## 🛠️ Tech Stack

- React 18.2+ / TypeScript 5.0+ / Vite 7.2+
- Lucide React / CSS-in-JS / LocalStorage

## 📄 License

GNU General Public License v3.0

Copyright (C) 2025 KaiZs

## 🤝 Contributing

Issues and Pull Requests are welcome!

---

**Enjoy the fun of pixel art creation!** 🎮✨
