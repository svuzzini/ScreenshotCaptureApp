import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface CaptureToolbarProps {
  onFullScreen: () => void;
  onRegion: () => void;
  onWindow: () => void;
  isCapturing: boolean;
}

export const CaptureToolbar: React.FC<CaptureToolbarProps> = ({
  onFullScreen,
  onRegion,
  onWindow,
  isCapturing
}) => {
  const { theme } = useTheme();

  const buttonStyle: React.CSSProperties = {
    padding: '12px 20px',
    margin: '0 8px',
    backgroundColor: theme.colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: isCapturing ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: isCapturing ? 0.6 : 1,
    transition: 'all 0.2s ease'
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: theme.colors.surface,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    margin: '20px'
  };

  return (
    <div style={toolbarStyle}>
      <button
        style={buttonStyle}
        onClick={onFullScreen}
        disabled={isCapturing}
        onMouseEnter={(e) => {
          if (!isCapturing) {
            e.currentTarget.style.opacity = '0.8';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCapturing) {
            e.currentTarget.style.opacity = '1';
          }
        }}
      >
        <span>🖥️</span>
        Full Screen
        <span style={{ fontSize: '12px', opacity: 0.7 }}>⌘⇧3</span>
      </button>

      <button
        style={buttonStyle}
        onClick={onRegion}
        disabled={isCapturing}
        onMouseEnter={(e) => {
          if (!isCapturing) {
            e.currentTarget.style.opacity = '0.8';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCapturing) {
            e.currentTarget.style.opacity = '1';
          }
        }}
      >
        <span>⭕</span>
        Select Region
        <span style={{ fontSize: '12px', opacity: 0.7 }}>⌘⇧4</span>
      </button>

      <button
        style={buttonStyle}
        onClick={onWindow}
        disabled={isCapturing}
        onMouseEnter={(e) => {
          if (!isCapturing) {
            e.currentTarget.style.opacity = '0.8';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCapturing) {
            e.currentTarget.style.opacity = '1';
          }
        }}
      >
        <span>🪟</span>
        Window
        <span style={{ fontSize: '12px', opacity: 0.7 }}>⌘⇧5</span>
      </button>
    </div>
  );
};