import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useTheme } from '../contexts/ThemeContext';
import { ExportOptions } from '../types';
import { EditorToolbar } from './EditorToolbar';
import { ExportPanel } from './ExportPanel';

interface HistoryEntry {
  id: string;
  data: string;
  timestamp: number;
}

interface ImageEditorProps {
  imageUrl: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  imageUrl,
  onSave,
  onCancel
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [editHistory, setEditHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [drawColor, setDrawColor] = useState('#FF3B30');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const cropRectRef = useRef<fabric.Rect | null>(null);

  // Refs to avoid stale closures in Fabric.js event handlers
  const activeToolRef = useRef(activeTool);
  const editHistoryRef = useRef(editHistory);
  const historyIndexRef = useRef(historyIndex);
  const drawColorRef = useRef(drawColor);
  const strokeWidthRef = useRef(strokeWidth);
  const isSavingStateRef = useRef(false);

  activeToolRef.current = activeTool;
  editHistoryRef.current = editHistory;
  historyIndexRef.current = historyIndex;
  drawColorRef.current = drawColor;
  strokeWidthRef.current = strokeWidth;

  const saveState = useCallback(() => {
    if (!fabricCanvasRef.current || isSavingStateRef.current) return;
    isSavingStateRef.current = true;

    const state = JSON.stringify(fabricCanvasRef.current.toJSON());
    const currentHistory = editHistoryRef.current;
    const currentIndex = historyIndexRef.current;

    const newHistory = currentHistory.slice(0, currentIndex + 1);
    newHistory.push({
      id: Date.now().toString(),
      data: state,
      timestamp: Date.now()
    });

    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Allow next save after state settles
    requestAnimationFrame(() => {
      isSavingStateRef.current = false;
    });
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: 'white'
    });

    fabricCanvasRef.current = canvas;

    // Load the image
    fabric.Image.fromURL(imageUrl, (img: fabric.Image) => {
      const canvasWidth = 800;
      const canvasHeight = 600;

      const scaleX = canvasWidth / (img.width || 1);
      const scaleY = canvasHeight / (img.height || 1);
      const scale = Math.min(scaleX, scaleY);

      img.scale(scale);
      img.set({
        left: (canvasWidth - (img.width || 0) * scale) / 2,
        top: (canvasHeight - (img.height || 0) * scale) / 2,
        selectable: false,
        evented: false
      });

      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();

      // Save initial state
      saveState();
    });

    // Use refs in handlers to always read current values
    canvas.on('path:created', (e: any) => {
      const path = e.path;
      if (activeToolRef.current === 'pen') {
        path.set({
          stroke: drawColorRef.current,
          strokeWidth: strokeWidthRef.current,
          fill: '',
          selectable: true
        });
        canvas.renderAll();
      }
    });

    canvas.on('object:modified', () => {
      saveState();
    });

    return () => {
      canvas.dispose();
    };
  }, [imageUrl, saveState]);

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    const history = editHistoryRef.current;
    if (idx > 0 && fabricCanvasRef.current) {
      const prevState = history[idx - 1];
      isSavingStateRef.current = true;
      fabricCanvasRef.current.loadFromJSON(prevState.data, () => {
        fabricCanvasRef.current?.renderAll();
        isSavingStateRef.current = false;
      });
      setHistoryIndex(idx - 1);
    }
  }, []);

  const redo = useCallback(() => {
    const idx = historyIndexRef.current;
    const history = editHistoryRef.current;
    if (idx < history.length - 1 && fabricCanvasRef.current) {
      const nextState = history[idx + 1];
      isSavingStateRef.current = true;
      fabricCanvasRef.current.loadFromJSON(nextState.data, () => {
        fabricCanvasRef.current?.renderAll();
        isSavingStateRef.current = false;
      });
      setHistoryIndex(idx + 1);
    }
  }, []);

  const addRectangle = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: 'transparent',
      stroke: drawColorRef.current,
      strokeWidth: strokeWidthRef.current
    });

    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    saveState();
  }, [saveState]);

  const addCircle = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: 'transparent',
      stroke: drawColorRef.current,
      strokeWidth: strokeWidthRef.current
    });

    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
    saveState();
  }, [saveState]);

  const addArrow = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const color = drawColorRef.current;
    const sw = strokeWidthRef.current;

    const line = new fabric.Line([50, 100, 200, 100], {
      stroke: color,
      strokeWidth: sw,
      selectable: true
    });

    const triangle = new fabric.Triangle({
      left: 200,
      top: 100,
      width: 20,
      height: 20,
      fill: color,
      angle: 90,
      originX: 'center',
      originY: 'center',
      selectable: false
    });

    const arrow = new fabric.Group([line, triangle], {
      left: 100,
      top: 100
    });

    fabricCanvasRef.current.add(arrow);
    saveState();
  }, [saveState]);

  const addText = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const text = new fabric.IText('Type here...', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: drawColorRef.current,
      fontFamily: 'Arial'
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    text.enterEditing();
    saveState();
  }, [saveState]);

  const enableDrawing = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    fabricCanvasRef.current.isDrawingMode = true;
    fabricCanvasRef.current.freeDrawingBrush.width = strokeWidthRef.current;
    fabricCanvasRef.current.freeDrawingBrush.color = drawColorRef.current;
  }, []);

  const disableDrawing = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.isDrawingMode = false;
  }, []);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    if (activeObjects.length === 0) return;
    activeObjects.forEach((obj: fabric.Object) => {
      fabricCanvasRef.current?.remove(obj);
    });
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();
    saveState();
  }, [saveState]);

  const startCrop = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    // Remove existing crop rect if any
    if (cropRectRef.current) {
      canvas.remove(cropRectRef.current);
    }

    const cropRect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 300,
      height: 200,
      fill: 'rgba(0, 122, 255, 0.1)',
      stroke: '#007AFF',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      cornerColor: '#007AFF',
      cornerSize: 10,
      transparentCorners: false,
      hasRotatingPoint: false,
      lockRotation: true
    });

    cropRectRef.current = cropRect;
    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    canvas.renderAll();
    setIsCropping(true);
  }, []);

  const applyCrop = useCallback(() => {
    if (!fabricCanvasRef.current || !cropRectRef.current) return;
    const canvas = fabricCanvasRef.current;
    const cropRect = cropRectRef.current;

    const left = cropRect.left || 0;
    const top = cropRect.top || 0;
    const width = (cropRect.width || 0) * (cropRect.scaleX || 1);
    const height = (cropRect.height || 0) * (cropRect.scaleY || 1);

    // Remove crop rect before exporting
    canvas.remove(cropRect);
    canvas.discardActiveObject();
    canvas.renderAll();

    // Export the cropped area
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      left,
      top,
      width,
      height
    });

    // Reload as new canvas content
    canvas.clear();
    canvas.setBackgroundColor('white', () => {});

    fabric.Image.fromURL(dataUrl, (img: fabric.Image) => {
      const canvasWidth = 800;
      const canvasHeight = 600;

      const scaleX = canvasWidth / (img.width || 1);
      const scaleY = canvasHeight / (img.height || 1);
      const scale = Math.min(scaleX, scaleY, 1);

      img.scale(scale);
      img.set({
        left: (canvasWidth - (img.width || 0) * scale) / 2,
        top: (canvasHeight - (img.height || 0) * scale) / 2,
        selectable: false,
        evented: false
      });

      canvas.add(img);
      canvas.sendToBack(img);
      canvas.renderAll();
      saveState();
    });

    cropRectRef.current = null;
    setIsCropping(false);
  }, [saveState]);

  const cancelCrop = useCallback(() => {
    if (!fabricCanvasRef.current || !cropRectRef.current) return;
    fabricCanvasRef.current.remove(cropRectRef.current);
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();
    cropRectRef.current = null;
    setIsCropping(false);
    setActiveTool('select');
  }, []);

  // Zoom functions
  const handleZoom = useCallback((delta: number) => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    zoom = Math.min(Math.max(0.25, zoom), 5);
    canvas.zoomToPoint(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2), zoom);
    setZoomLevel(zoom);
  }, []);

  const resetZoom = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomLevel(1);
  }, []);

  const handleToolChange = useCallback((tool: string) => {
    // If switching away from crop, cancel it
    if (isCropping && tool !== 'crop') {
      cancelCrop();
    }

    setActiveTool(tool);

    switch (tool) {
      case 'select':
        disableDrawing();
        break;
      case 'pen':
        enableDrawing();
        break;
      case 'rectangle':
        disableDrawing();
        addRectangle();
        break;
      case 'circle':
        disableDrawing();
        addCircle();
        break;
      case 'arrow':
        disableDrawing();
        addArrow();
        break;
      case 'text':
        disableDrawing();
        addText();
        break;
      case 'crop':
        disableDrawing();
        startCrop();
        break;
      default:
        disableDrawing();
    }
  }, [disableDrawing, enableDrawing, addRectangle, addCircle, addArrow, addText, startCrop, isCropping, cancelCrop]);

  // Update drawing brush when color/stroke changes
  useEffect(() => {
    if (fabricCanvasRef.current && fabricCanvasRef.current.isDrawingMode) {
      fabricCanvasRef.current.freeDrawingBrush.color = drawColor;
      fabricCanvasRef.current.freeDrawingBrush.width = strokeWidth;
    }
  }, [drawColor, strokeWidth]);

  const handleExport = useCallback((options: ExportOptions) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const originalWidth = canvas.getWidth();
    const originalHeight = canvas.getHeight();

    // If no styling options, just export the raw canvas
    if (!options.addBackground && !options.padding && !options.roundedCorners && !options.dropShadow) {
      const dataUrl = canvas.toDataURL({
        format: options.format,
        quality: options.quality || 1
      });
      onSave(dataUrl);
      return;
    }

    // Create an offscreen canvas for styled export
    const pad = options.padding || 0;
    const totalWidth = originalWidth + pad * 2;
    const totalHeight = originalHeight + pad * 2;
    const offscreen = document.createElement('canvas');
    offscreen.width = totalWidth;
    offscreen.height = totalHeight;
    const ctx = offscreen.getContext('2d')!;

    // Draw background
    if (options.addBackground) {
      if (options.gradient) {
        const gradient = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
        gradient.addColorStop(0, options.gradient.colors[0]);
        gradient.addColorStop(1, options.gradient.colors[1]);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = options.backgroundColor || '#FFFFFF';
      }
      ctx.fillRect(0, 0, totalWidth, totalHeight);
    }

    // Get the canvas content as an image
    const canvasDataUrl = canvas.toDataURL({ format: 'png', quality: 1 });
    const img = new Image();
    img.onload = () => {
      ctx.save();

      // Apply rounded corners with clipping
      if (options.roundedCorners && options.roundedCorners > 0) {
        const r = options.roundedCorners;
        const x = pad;
        const y = pad;
        const w = originalWidth;
        const h = originalHeight;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.clip();
      }

      // Draw drop shadow
      if (options.dropShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;
        // Draw a rect to cast the shadow
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(pad, pad, originalWidth, originalHeight);
        ctx.shadowColor = 'transparent';
      }

      // Draw the screenshot content
      ctx.drawImage(img, pad, pad, originalWidth, originalHeight);
      ctx.restore();

      const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
      const finalDataUrl = offscreen.toDataURL(mimeType, options.quality || 1);
      onSave(finalDataUrl);
    };
    img.src = canvasDataUrl;
  }, [onSave]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < editHistory.length - 1;

  // Keyboard shortcuts for editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (mod && e.key === '0') {
        e.preventDefault();
        resetZoom();
      } else if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoom(-100);
      } else if (mod && e.key === '-') {
        e.preventDefault();
        handleZoom(100);
      } else if (e.key === 'Escape' && isCropping) {
        e.preventDefault();
        cancelCrop();
      } else if (e.key === 'Enter' && isCropping) {
        e.preventDefault();
        applyCrop();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = fabricCanvasRef.current?.getActiveObject();
        if (active && (active as any).isEditing) return;
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteSelected, handleZoom, resetZoom, isCropping, cancelCrop, applyCrop]);

  // Mouse wheel zoom
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleWheel = (opt: any) => {
      const e = opt.e as WheelEvent;
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod) {
        e.preventDefault();
        e.stopPropagation();
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** (e.deltaY);
        zoom = Math.min(Math.max(0.25, zoom), 5);
        canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), zoom);
        setZoomLevel(zoom);
      } else if (e.altKey) {
        // Alt + scroll = pan
        e.preventDefault();
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] -= e.deltaX;
          vpt[5] -= e.deltaY;
          canvas.setViewportTransform(vpt);
        }
      }
    };

    canvas.on('mouse:wheel', handleWheel);

    return () => {
      canvas.off('mouse:wheel', handleWheel);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: theme.colors.background
    }}>
      <EditorToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onUndo={undo}
        onRedo={redo}
        onDelete={deleteSelected}
        onExport={() => setShowExportPanel(true)}
        onCancel={onCancel}
        canUndo={canUndo}
        canRedo={canRedo}
        drawColor={drawColor}
        onDrawColorChange={setDrawColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        position: 'relative'
      }}>
        {/* Crop action bar */}
        {isCropping && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            padding: '8px 16px',
            backgroundColor: theme.colors.surface,
            borderRadius: '8px',
            border: `1px solid ${theme.colors.primary}`,
            alignItems: 'center',
            fontSize: '13px',
            color: theme.colors.textSecondary
          }}>
            Drag handles to adjust crop area.
            <button
              onClick={applyCrop}
              style={{
                padding: '4px 12px',
                backgroundColor: theme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Apply (Enter)
            </button>
            <button
              onClick={cancelCrop}
              style={{
                padding: '4px 12px',
                backgroundColor: 'transparent',
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Cancel (Esc)
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        />

        {/* Zoom indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '10px',
          fontSize: '12px',
          color: theme.colors.textSecondary
        }}>
          <button
            onClick={() => handleZoom(100)}
            style={{
              padding: '2px 8px',
              backgroundColor: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              color: theme.colors.text,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            -
          </button>
          <span
            onClick={resetZoom}
            style={{ cursor: 'pointer', minWidth: '40px', textAlign: 'center' }}
            title="Click to reset zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => handleZoom(-100)}
            style={{
              padding: '2px 8px',
              backgroundColor: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              color: theme.colors.text,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            +
          </button>
          <span style={{ marginLeft: '8px', opacity: 0.6 }}>
            Ctrl+Scroll to zoom, Alt+Scroll to pan
          </span>
        </div>
      </div>

      {showExportPanel && (
        <ExportPanel
          onExport={handleExport}
          onClose={() => setShowExportPanel(false)}
        />
      )}
    </div>
  );
};