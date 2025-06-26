# ShottrClone - Advanced Screenshot Application

A modern, cross-platform screenshot application built with Electron and React, featuring advanced editing tools and stylish export options.

## Features

### 🖼️ Screenshot Capture
- **Full Screen Capture**: Capture entire screen with `Cmd+Shift+3`
- **Region Selection**: Select custom regions with `Cmd+Shift+4`
- **Window Capture**: Capture specific windows with `Cmd+Shift+5`
- **Quick Capture**: Global keyboard shortcuts work even when app is not focused

### ✏️ Advanced Editing Tools
- **Selection Tool**: Move, resize, and manipulate objects
- **Drawing Tool**: Free-hand drawing with customizable brush
- **Shapes**: Add rectangles, circles, and arrows
- **Text Annotations**: Add text with custom fonts and colors
- **Undo/Redo**: Full editing history with keyboard shortcuts (`Cmd+Z`, `Cmd+Shift+Z`)

### 🎨 Stylish Export Options
- **Background Styles**: Add solid colors or beautiful gradients
- **Rounded Corners**: Customize corner radius for modern look
- **Drop Shadows**: Add depth with customizable shadows
- **Padding**: Add space around your screenshots
- **Format Options**: Export as PNG or JPEG with quality control

### 🚀 Export & Sharing
- **Save to Disk**: Save screenshots to your Pictures folder
- **Clipboard Copy**: Instantly copy to clipboard for quick sharing
- **Format Support**: PNG for transparency, JPEG for smaller file sizes

### 🎯 User Experience
- **Modern UI**: Clean, responsive interface with smooth animations
- **Dark/Light Theme**: Toggle between themes to match your preference
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Error Handling**: Robust error handling with user-friendly messages

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
To run the application in development mode:

```bash
npm start
```

This will start both the React development server and Electron application. The app will automatically reload when you make changes.

### 3. Build for Production
To build the application for distribution:

```bash
npm run build
```

### 4. Create Distributable
To create platform-specific installers:

```bash
npm run dist
```

This will create installers in the `release` folder for your current platform.

## Project Structure

```
shottr-clone/
├── electron/           # Electron main process files
│   ├── main.ts        # Main Electron process
│   └── preload.ts     # Preload script for secure IPC
├── src/               # React application source
│   ├── components/    # React components
│   ├── contexts/      # React contexts (Theme, etc.)
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── public/            # Static assets
└── build/             # Built React application
```

## Key Components

### Main Process (Electron)
- **main.ts**: Handles window creation, global shortcuts, and system integration
- **preload.ts**: Secure bridge between main and renderer processes

### Renderer Process (React)
- **App.tsx**: Main application component with routing logic
- **ImageEditor.tsx**: Advanced image editing interface using Fabric.js
- **CaptureToolbar.tsx**: Screenshot capture controls
- **ExportPanel.tsx**: Export options and styling controls

### Hooks & Contexts
- **useScreenCapture**: Manages screenshot capture operations
- **ThemeContext**: Handles light/dark theme switching

## Keyboard Shortcuts

### Global Shortcuts (work system-wide)
- `Cmd+Shift+3` (Mac) / `Ctrl+Shift+3` (Win/Linux): Full screen capture
- `Cmd+Shift+4` (Mac) / `Ctrl+Shift+4` (Win/Linux): Region selection
- `Cmd+Shift+5` (Mac) / `Ctrl+Shift+5` (Win/Linux): Window capture

### Editor Shortcuts
- `Cmd+Z` / `Ctrl+Z`: Undo
- `Cmd+Shift+Z` / `Ctrl+Shift+Z`: Redo
- `Delete` / `Backspace`: Delete selected objects
- `Escape`: Cancel current operation

## Development Notes

### Architecture Decisions
- **Electron + React**: Provides native desktop integration with modern web technologies
- **TypeScript**: Ensures type safety and better development experience
- **Fabric.js**: Powerful canvas library for image editing capabilities
- **Context API**: State management for themes and global app state

### Security Considerations
- Context isolation enabled for secure IPC communication
- Preload script prevents direct Node.js access from renderer
- All file operations handled through secure IPC channels

### Cross-Platform Compatibility
- Uses Electron's cross-platform APIs for consistent behavior
- Conditional styling and shortcuts for different operating systems
- Platform-specific build configurations

## Building for Different Platforms

### macOS
```bash
npm run dist:mac
```
Creates `.dmg` installer and `.app` bundle.

### Windows
```bash
npm run dist:win
```
Creates `.exe` installer and portable version.

### Linux
```bash
npm run dist:linux
```
Creates `.AppImage`, `.deb`, and `.rpm` packages.

## Troubleshooting

### Common Issues

1. **Canvas not rendering**: Ensure Fabric.js is properly loaded
2. **Screenshots not capturing**: Check screen recording permissions on macOS
3. **Global shortcuts not working**: May require accessibility permissions

### Performance Tips
- Limit canvas size for better performance
- Use PNG for screenshots with transparency
- Use JPEG for smaller file sizes when transparency isn't needed

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- Inspired by Shottr and other modern screenshot tools
- Built with Electron, React, and Fabric.js
- Icons and design inspired by macOS design principles