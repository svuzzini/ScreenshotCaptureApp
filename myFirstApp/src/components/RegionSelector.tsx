import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Point, Rectangle } from '../types';

interface RegionSelectorProps {
  onRegionSelected: (region: Rectangle) => void;
  onCancel: () => void;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  onRegionSelected,
  onCancel
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [screenImage, setScreenImage] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const captureScreen = async () => {
      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.captureScreen({ type: 'fullscreen' });
          if (!Array.isArray(result)) {
            setScreenImage(result.thumbnail);
          }
        } catch (error) {
          console.error('Error capturing screen for region selection:', error);
        }
      }
    };

    captureScreen();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setStartPoint(point);
    setCurrentPoint(point);
    setIsSelecting(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !startPoint) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setCurrentPoint(point);
  }, [isSelecting, startPoint]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !startPoint || !currentPoint) return;

    const region: Rectangle = {
      x: Math.min(startPoint.x, currentPoint.x),
      y: Math.min(startPoint.y, currentPoint.y),
      width: Math.abs(currentPoint.x - startPoint.x),
      height: Math.abs(currentPoint.y - startPoint.y)
    };

    if (region.width > 10 && region.height > 10) {
      onRegionSelected(region);
    }

    setIsSelecting(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, [isSelecting, startPoint, currentPoint, onRegionSelected]);

  const getSelectionStyle = (): React.CSSProperties => {
    if (!startPoint || !currentPoint) return {};

    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    return {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      border: '2px solid #007AFF',
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
      pointerEvents: 'none'
    };
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        cursor: 'crosshair',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {screenImage && (
        <img
          src={screenImage}
          alt="Screen capture"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.8
          }}
        />
      )}
      
      {isSelecting && <div style={getSelectionStyle()} />}
      
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '14px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 12px',
          borderRadius: '4px'
        }}
      >
        Click and drag to select a region. Press ESC to cancel.
      </div>
    </div>
  );
};