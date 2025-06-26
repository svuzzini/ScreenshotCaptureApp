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
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  onExport,
  onCancel,
  canUndo,
  canRedo
}) => {
  const { theme } = useTheme();

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    backgroundColor: theme.colors.surface,
    borderBottom: `1px solid ${theme.colors.border}`,
    gap: '16px'
  };

  const toolGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const buttonStyle = (isActive: boolean = false): React.CSSProperties => ({
    padding: '8px 12px',
    backgroundColor: isActive ? theme.colors.primary : 'transparent',
    color: isActive ? 'white' : theme.colors.text,
    border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  });

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle(),
    opacity: 0.5,
    cursor: 'not-allowed'
  };

  const tools = [
    { id: 'select', icon: '↖️', label: 'Select' },
    { id: 'pen', icon: '✏️', label: 'Draw' },
    { id: 'rectangle', icon: '⬜', label: 'Rectangle' },
    { id: 'circle', icon: '⭕', label: 'Circle' },
    { id: 'arrow', icon: '➡️', label: 'Arrow' },
    { id: 'text', icon: '📝', label: 'Text' }
  ];

  return (
    <div style={toolbarStyle}>
      <div style={toolGroupStyle}>
        <button
          style={buttonStyle()}
          onClick={onCancel}
        >
          ✕ Cancel
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
          title="Undo (⌘Z)"
        >
          ↶ Undo
        </button>
        
        <button
          style={canRedo ? buttonStyle() : disabledButtonStyle}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (⌘⇧Z)"
        >
          ↷ Redo
        </button>

        <button
          style={buttonStyle()}
          onClick={onDelete}
          title="Delete Selected"
        >
          🗑️ Delete
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
          💾 Export
        </button>
      </div>
    </div>
  );
};