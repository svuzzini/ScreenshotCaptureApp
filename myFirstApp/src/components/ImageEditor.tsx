import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useTheme } from '../contexts/ThemeContext';
import { EditAction, ExportOptions } from '../types';
import { EditorToolbar } from './EditorToolbar';
import { ExportPanel } from './ExportPanel';

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
  const [editHistory, setEditHistory] = useState<EditAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showExportPanel, setShowExportPanel] = useState(false);

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
    });

    // Set up event handlers
    canvas.on('path:created', handlePathCreated);
    canvas.on('object:added', handleObjectAdded);

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  const handlePathCreated = useCallback((e: any) => {
    const path = e.path;
    if (activeTool === 'pen') {
      path.set({
        stroke: '#FF3B30',
        strokeWidth: 3,
        fill: '',
        selectable: true
      });
    }
  }, [activeTool]);

  const handleObjectAdded = useCallback((e: any) => {
    saveState();
  }, []);

  const saveState = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const state = JSON.stringify(fabricCanvasRef.current.toJSON());
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push({
      id: Date.now().toString(),
      type: activeTool as any,
      data: state,
      timestamp: Date.now()
    });

    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [editHistory, historyIndex, activeTool]);

  const undo = useCallback(() => {
    if (historyIndex > 0 && fabricCanvasRef.current) {
      const prevState = editHistory[historyIndex - 1];
      fabricCanvasRef.current.loadFromJSON(prevState.data, () => {
        fabricCanvasRef.current?.renderAll();
      });
      setHistoryIndex(historyIndex - 1);
    }
  }, [editHistory, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < editHistory.length - 1 && fabricCanvasRef.current) {
      const nextState = editHistory[historyIndex + 1];
      fabricCanvasRef.current.loadFromJSON(nextState.data, () => {
        fabricCanvasRef.current?.renderAll();
      });
      setHistoryIndex(historyIndex + 1);
    }
  }, [editHistory, historyIndex]);

  const addRectangle = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: 'transparent',
      stroke: theme.colors.primary,
      strokeWidth: 2
    });

    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
  }, [theme.colors.primary]);

  const addCircle = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: 'transparent',
      stroke: theme.colors.primary,
      strokeWidth: 2
    });

    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
  }, [theme.colors.primary]);

  const addArrow = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const line = new fabric.Line([50, 100, 200, 100], {
      stroke: theme.colors.error,
      strokeWidth: 3,
      selectable: true
    });

    // Create arrowhead
    const triangle = new fabric.Triangle({
      left: 200,
      top: 100,
      width: 20,
      height: 20,
      fill: theme.colors.error,
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
  }, [theme.colors.error]);

  const addText = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const text = new fabric.IText('Type here...', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: theme.colors.text,
      fontFamily: 'Arial'
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    text.enterEditing();
  }, [theme.colors.text]);

  const enableDrawing = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    fabricCanvasRef.current.isDrawingMode = true;
    fabricCanvasRef.current.freeDrawingBrush.width = 3;
    fabricCanvasRef.current.freeDrawingBrush.color = theme.colors.error;
  }, [theme.colors.error]);

  const disableDrawing = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.isDrawingMode = false;
  }, []);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    activeObjects.forEach((obj: fabric.Object) => {
      fabricCanvasRef.current?.remove(obj);
    });
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();
  }, []);

  const handleToolChange = useCallback((tool: string) => {
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
      default:
        disableDrawing();
    }
  }, [disableDrawing, enableDrawing, addRectangle, addCircle, addArrow, addText]);

  const handleExport = useCallback((options: ExportOptions) => {
    if (!fabricCanvasRef.current) return;

    const dataUrl = fabricCanvasRef.current.toDataURL({
      format: options.format,
      quality: options.quality || 1
    });

    onSave(dataUrl);
  }, [onSave]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < editHistory.length - 1;

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
      />

      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        />
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