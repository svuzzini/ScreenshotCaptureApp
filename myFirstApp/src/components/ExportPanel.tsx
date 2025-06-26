import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ExportOptions } from '../types';

interface ExportPanelProps {
  onExport: (options: ExportOptions) => void;
  onClose: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  onExport,
  onClose
}) => {
  const { theme } = useTheme();
  const [format, setFormat] = useState<'png' | 'jpg'>('png');
  const [quality, setQuality] = useState(1);
  const [addBackground, setAddBackground] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [useGradient, setUseGradient] = useState(false);
  const [gradientColors, setGradientColors] = useState(['#667eea', '#764ba2']);
  const [roundedCorners, setRoundedCorners] = useState(0);
  const [dropShadow, setDropShadow] = useState(false);
  const [padding, setPadding] = useState(0);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const panelStyle: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '12px',
    padding: '24px',
    width: '400px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: theme.colors.text
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px',
    color: theme.colors.text,
    fontSize: '14px'
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const checkboxStyle: React.CSSProperties = {
    marginRight: '8px'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    margin: '0 8px'
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: theme.colors.primary,
    color: 'white'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`
  };

  const handleExport = () => {
    const options: ExportOptions = {
      format,
      quality: format === 'jpg' ? quality : undefined,
      addBackground,
      backgroundColor: useGradient ? undefined : backgroundColor,
      gradient: useGradient ? {
        colors: gradientColors,
        direction: 'linear-gradient(45deg, ' + gradientColors.join(', ') + ')'
      } : undefined,
      roundedCorners: roundedCorners > 0 ? roundedCorners : undefined,
      dropShadow,
      padding: padding > 0 ? padding : undefined
    };

    onExport(options);
    onClose();
  };

  const gradientPreviewStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    borderRadius: '6px',
    background: `linear-gradient(45deg, ${gradientColors.join(', ')})`,
    border: `1px solid ${theme.colors.border}`,
    marginTop: '8px'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px 0', color: theme.colors.text }}>
          Export Options
        </h3>

        <div style={sectionStyle}>
          <label style={labelStyle}>Format</label>
          <select
            style={selectStyle}
            value={format}
            onChange={(e) => setFormat(e.target.value as 'png' | 'jpg')}
          >
            <option value="png">PNG</option>
            <option value="jpg">JPEG</option>
          </select>
        </div>

        {format === 'jpg' && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Quality: {Math.round(quality * 100)}%</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        <div style={sectionStyle}>
          <label style={labelStyle}>
            <input
              type="checkbox"
              style={checkboxStyle}
              checked={addBackground}
              onChange={(e) => setAddBackground(e.target.checked)}
            />
            Add Stylish Background
          </label>
        </div>

        {addBackground && (
          <>
            <div style={sectionStyle}>
              <label style={labelStyle}>
                <input
                  type="radio"
                  name="backgroundType"
                  style={checkboxStyle}
                  checked={!useGradient}
                  onChange={() => setUseGradient(false)}
                />
                Solid Color
              </label>
              <label style={labelStyle}>
                <input
                  type="radio"
                  name="backgroundType"
                  style={checkboxStyle}
                  checked={useGradient}
                  onChange={() => setUseGradient(true)}
                />
                Gradient
              </label>
            </div>

            {!useGradient ? (
              <div style={sectionStyle}>
                <label style={labelStyle}>Background Color</label>
                <input
                  type="color"
                  style={{ ...inputStyle, height: '40px' }}
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
              </div>
            ) : (
              <div style={sectionStyle}>
                <label style={labelStyle}>Gradient Colors</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="color"
                    style={{ flex: 1, height: '40px', border: 'none', borderRadius: '6px' }}
                    value={gradientColors[0]}
                    onChange={(e) => setGradientColors([e.target.value, gradientColors[1]])}
                  />
                  <input
                    type="color"
                    style={{ flex: 1, height: '40px', border: 'none', borderRadius: '6px' }}
                    value={gradientColors[1]}
                    onChange={(e) => setGradientColors([gradientColors[0], e.target.value])}
                  />
                </div>
                <div style={gradientPreviewStyle}></div>
              </div>
            )}

            <div style={sectionStyle}>
              <label style={labelStyle}>Padding: {padding}px</label>
              <input
                type="range"
                min="0"
                max="100"
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={sectionStyle}>
              <label style={labelStyle}>Rounded Corners: {roundedCorners}px</label>
              <input
                type="range"
                min="0"
                max="50"
                value={roundedCorners}
                onChange={(e) => setRoundedCorners(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={sectionStyle}>
              <label style={labelStyle}>
                <input
                  type="checkbox"
                  style={checkboxStyle}
                  checked={dropShadow}
                  onChange={(e) => setDropShadow(e.target.checked)}
                />
                Drop Shadow
              </label>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button style={secondaryButtonStyle} onClick={onClose}>
            Cancel
          </button>
          <button style={primaryButtonStyle} onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};