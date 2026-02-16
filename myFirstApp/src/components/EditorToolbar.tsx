import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface EditorToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onExport: () => void;
  onCancel: () => void;
  canUndo: boolean;
  canRedo: boolean;
  drawColor: string;
  onDrawColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

const PRESET_COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#000000', '#FFFFFF'];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  onExport,
  onCancel,
  canUndo,
  canRedo,
  drawColor,
  onDrawColorChange,
  strokeWidth,
  onStrokeWidthChange
}) => {
  const { theme } = useTheme();

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    backgroundColor: theme.colors.surface,
    borderBottom: `1px solid ${theme.colors.border}`,
    gap: '12px',
    flexWrap: 'wrap'
  };

  const toolGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const buttonStyle = (isActive: boolean = false): React.CSSProperties => ({
    padding: '6px 10px',
    backgroundColor: isActive ? theme.colors.primary : 'transparent',
    color: isActive ? 'white' : theme.colors.text,
    border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease'
  });

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle(),
    opacity: 0.5,
    cursor: 'not-allowed'
  };

  const tools = [
    { id: 'select', icon: '\u2196\uFE0F', label: 'Select' },
    { id: 'pen', icon: '\u270F\uFE0F', label: 'Draw' },
    { id: 'rectangle', icon: '\u2B1C', label: 'Rectangle' },
    { id: 'circle', icon: '\u2B55', label: 'Circle' },
    { id: 'arrow', icon: '\u27A1\uFE0F', label: 'Arrow' },
    { id: 'text', icon: '\uD83D\uDCDD', label: 'Text' },
    { id: 'crop', icon: '\u2702\uFE0F', label: 'Crop' }
  ];

  const showColorControls = activeTool !== 'select' && activeTool !== 'crop';

  return (
    <div style={{ backgroundColor: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}` }}>
      <div style={toolbarStyle}>
        <div style={toolGroupStyle}>
          <button
            style={buttonStyle()}
            onClick={onCancel}
          >
            \u2715 Cancel
          </button>
        </div>

        <div style={toolGroupStyle}>
          {tools.map(tool => (
            <button
              key={tool.id}
              style={buttonStyle(activeTool === tool.id)}
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div style={toolGroupStyle}>
          <button
            style={canUndo ? buttonStyle() : disabledButtonStyle}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (\u2318Z)"
          >
            \u21B6
          </button>

          <button
            style={canRedo ? buttonStyle() : disabledButtonStyle}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (\u2318\u21E7Z)"
          >
            \u21B7
          </button>

          <button
            style={buttonStyle()}
            onClick={onDelete}
            title="Delete Selected"
          >
            \uD83D\uDDD1\uFE0F
          </button>
        </div>

        <div style={toolGroupStyle}>
          <button
            style={{
              ...buttonStyle(),
              backgroundColor: theme.colors.success,
              color: 'white',
              border: `1px solid ${theme.colors.success}`
            }}
            onClick={onExport}
          >
            \uD83D\uDCBE Export
          </button>
        </div>
      </div>

      {showColorControls && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 16px',
          gap: '12px',
          borderTop: `1px solid ${theme.colors.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Color:</span>
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => onDrawColorChange(color)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: drawColor === color
                    ? `2px solid ${theme.colors.primary}`
                    : `1px solid ${theme.colors.border}`,
                  cursor: 'pointer',
                  padding: 0,
                  outline: drawColor === color ? `2px solid ${theme.colors.primary}` : 'none',
                  outlineOffset: '1px'
                }}
                title={color}
              />
            ))}
            <input
              type="color"
              value={drawColor}
              onChange={(e) => onDrawColorChange(e.target.value)}
              style={{
                width: '24px',
                height: '24px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                padding: 0
              }}
              title="Custom color"
            />
          </div>

          <div style={{
            width: '1px',
            height: '20px',
            backgroundColor: theme.colors.border
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Width:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
              style={{ width: '80px' }}
            />
            <span style={{ fontSize: '12px', color: theme.colors.textSecondary, minWidth: '24px' }}>
              {strokeWidth}px
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
