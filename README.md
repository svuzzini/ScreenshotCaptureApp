# PixelSnap

A cross-platform screenshot application built with Electron and React. Capture, edit, and export screenshots with annotation tools, stylish backgrounds, and one-click sharing.

## Features

### Screenshot Capture
- **Full Screen** (`Cmd+Shift+3` / `Ctrl+Shift+3`) - Captures the entire primary display
- **Region Selection** (`Cmd+Shift+4` / `Ctrl+Shift+4`) - Click and drag to capture a specific area, cropped to pixel-perfect selection
- **Window Capture** (`Cmd+Shift+5` / `Ctrl+Shift+5`) - Browse and select from a grid of open windows
- All shortcuts work system-wide, even when the app is in the background

### Editing Tools
- **Select** - Move, resize, rotate any annotation object
- **Pen** - Freehand drawing with configurable color and stroke width
- **Rectangle / Circle** - Shape overlays with transparent fill and colored stroke
- **Arrow** - Line with arrowhead for pointing out details
- **Text** - Editable text annotations with inline editing
- **Crop** - Adjustable crop rectangle with Apply/Cancel workflow (Enter/Esc)
- **Color Picker** - 9 preset colors + custom color picker, visible for all drawing tools
- **Stroke Width** - Adjustable from 1px to 20px via slider

### Zoom & Pan
- **Ctrl/Cmd + Scroll** to zoom (0.25x - 5x range)
- **Alt + Scroll** to pan around the canvas
- **Ctrl/Cmd + 0** to reset zoom to 100%
- **Ctrl/Cmd + / -** to zoom in/out from keyboard
- Zoom percentage indicator with click-to-reset

### Export Options
- **Format**: PNG (with transparency) or JPEG (with quality slider)
- **Background**: Solid color picker or dual-color gradient with live preview
- **Rounded Corners**: 0-50px radius slider
- **Drop Shadow**: Toggleable shadow effect
- **Padding**: 0-100px around the screenshot
- All styling is applied during export via offscreen canvas compositing

### Save & Share
- **Save to Disk** - Opens system save dialog, defaults to Pictures folder
- **Copy to Clipboard** - Automatic clipboard copy on every save
- **Format-Aware Save** - Produces actual JPEG files when JPEG is selected (not just renamed PNGs)

### Capture History
- Recent captures shown as a thumbnail grid on the home screen
- Click any previous capture to re-open it in the editor
- Persisted in localStorage across sessions (up to 20 entries)
- Clear button to remove all history

### UI & Theming
- Light and dark themes with one-click toggle
- Theme persisted in localStorage
- Scrollbar styling synced with app theme via `data-theme` attribute
- Loading spinner during capture operations
- Toast notifications for save, copy, error, and info feedback
- Error boundary with friendly recovery UI

## Keyboard Shortcuts

| Action | Mac | Windows / Linux |
|---|---|---|
| Full screen capture | `Cmd+Shift+3` | `Ctrl+Shift+3` |
| Region capture | `Cmd+Shift+4` | `Ctrl+Shift+4` |
| Window capture | `Cmd+Shift+5` | `Ctrl+Shift+5` |
| Undo | `Cmd+Z` | `Ctrl+Z` |
| Redo | `Cmd+Shift+Z` | `Ctrl+Shift+Z` |
| Delete selected | `Delete` / `Backspace` | `Delete` / `Backspace` |
| Zoom in | `Cmd+=` | `Ctrl+=` |
| Zoom out | `Cmd+-` | `Ctrl+-` |
| Reset zoom | `Cmd+0` | `Ctrl+0` |
| Apply crop | `Enter` | `Enter` |
| Cancel crop | `Escape` | `Escape` |

## Tech Stack

- **Electron 23** - Desktop shell, global shortcuts, native dialogs, clipboard
- **React 18** - UI rendering with functional components and hooks
- **TypeScript** - Full type coverage across renderer and main processes
- **Fabric.js 5** - Canvas-based image editing with object model
- **Create React App** - Build toolchain for the renderer process
- **electron-builder** - Packaging and distribution

## Project Structure

```
myFirstApp/
├── electron/
│   ├── main.ts              # Main process: windows, IPC, shortcuts
│   └── preload.ts           # Secure IPC bridge (contextBridge)
├── src/
│   ├── App.tsx               # Root component, routing, capture logic, history
│   ├── index.tsx             # React entry point
│   ├── index.css             # Global styles, animations, scrollbar theming
│   ├── components/
│   │   ├── CaptureToolbar.tsx    # Capture mode buttons
│   │   ├── ImageEditor.tsx       # Fabric.js canvas, tools, zoom, crop, export
│   │   ├── EditorToolbar.tsx     # Tool buttons, color/stroke picker
│   │   ├── ExportPanel.tsx       # Export options modal
│   │   ├── RegionSelector.tsx    # Full-screen overlay for region selection
│   │   ├── Toast.tsx             # Toast notification system + useToast hook
│   │   └── ErrorBoundary.tsx     # React error boundary with recovery
│   ├── contexts/
│   │   └── ThemeContext.tsx       # Light/dark theme provider
│   ├── hooks/
│   │   └── useScreenCapture.ts   # Screen capture state and methods
│   └── types/
│       └── index.ts              # TypeScript interfaces and global types
├── public/
│   ├── index.html
│   └── manifest.json
├── package.json
├── tsconfig.json                 # Renderer TypeScript config
└── tsconfig.electron.json        # Main process TypeScript config
```

## Getting Started

### Prerequisites
- Node.js 16+
- npm

### Install
```bash
cd myFirstApp
npm install
```

### Development
```bash
npm start
```
Starts the React dev server on port 3000 and launches Electron pointing at it. Hot reload is enabled for the renderer process.

### Build
```bash
npm run build
```
Compiles the React app to `build/` and the Electron main process to `dist/`.

### Package for Distribution
```bash
npm run dist
```
Creates platform-specific installers in the `release/` folder:
- **macOS**: `.dmg` and `.app`
- **Windows**: `.exe` installer
- **Linux**: `.AppImage`, `.deb`, `.rpm`

### Lint
```bash
npm run lint
```

## Architecture

### Security
- `contextIsolation: true` and `nodeIntegration: false` in all windows
- All Node.js/Electron APIs exposed through a whitelisted preload script
- No remote module usage

### State Management
- **React Context** for theme (global UI state)
- **Custom hooks** for capture logic (`useScreenCapture`)
- **Component state** for editor tools, history, and UI
- **localStorage** for theme preference and capture history

### IPC Channels
| Channel | Direction | Purpose |
|---|---|---|
| `capture-screen` | Renderer -> Main | Request screen/window sources |
| `save-image` | Renderer -> Main | Save image to disk with format detection |
| `copy-to-clipboard` | Renderer -> Main | Write image to system clipboard |
| `show-capture-window` | Renderer -> Main | Open region selection overlay |
| `close-capture-window` | Renderer -> Main | Close region selection overlay |
| `get-screen-size` | Renderer -> Main | Get primary display dimensions |
| `capture-requested` | Main -> Renderer | Global shortcut triggered |

## Troubleshooting

| Issue | Solution |
|---|---|
| Screenshots are blank | Grant Screen Recording permission in System Preferences > Privacy (macOS) |
| Global shortcuts not working | Grant Accessibility permission, or check for conflicts with other apps |
| Canvas not rendering | Verify Fabric.js installed correctly (`npm ls fabric`) |
| Export styling not visible | Make sure "Add Stylish Background" is checked in the export panel |

## License

MIT
