import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { CaptureToolbar } from './components/CaptureToolbar';
import { ImageEditor } from './components/ImageEditor';
import { RegionSelector } from './components/RegionSelector';
import { useScreenCapture } from './hooks/useScreenCapture';
import { Rectangle } from './types';

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    isCapturing,
    capturedImage,
    sources,
    captureFullScreen,
    captureWindow,
    selectSource,
    clearCapture,
    setCapturedImage
  } = useScreenCapture();

  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (capturedImage) {
      setShowEditor(true);
    }
  }, [capturedImage]);

  useEffect(() => {
    // Listen for capture requests from main process
    if (window.electronAPI) {
      window.electronAPI.onCaptureRequested((data) => {
        if (data.type === 'fullscreen') {
          handleFullScreenCapture();
        } else if (data.type === 'window') {
          handleWindowCapture();
        }
      });

      return () => {
        window.electronAPI.removeCaptureListener();
      };
    }
  }, []);

  const handleFullScreenCapture = async () => {
    try {
      const result = await captureFullScreen();
      if (result && !Array.isArray(result)) {
        setCapturedImage(result.thumbnail);
      }
    } catch (error) {
      console.error('Error capturing full screen:', error);
    }
  };

  const handleRegionCapture = async () => {
    setShowRegionSelector(true);
  };

  const handleWindowCapture = async () => {
    try {
      const result = await captureWindow();
      if (Array.isArray(result) && result.length > 0) {
        // Show window selection if multiple windows
        if (result.length === 1) {
          selectSource(result[0]);
        } else {
          // For now, just select the first window
          selectSource(result[0]);
        }
      }
    } catch (error) {
      console.error('Error capturing window:', error);
    }
  };

  const handleRegionSelected = async (region: Rectangle) => {
    setShowRegionSelector(false);
    
    // For now, capture full screen and let user crop in editor
    try {
      const result = await captureFullScreen();
      if (result && !Array.isArray(result)) {
        setCapturedImage(result.thumbnail);
      }
    } catch (error) {
      console.error('Error capturing for region:', error);
    }
  };

  const handleRegionCancel = () => {
    setShowRegionSelector(false);
    if (window.electronAPI) {
      window.electronAPI.closeCaptureWindow();
    }
  };

  const handleSaveImage = async (dataUrl: string) => {
    try {
      if (window.electronAPI) {
        const filePath = await window.electronAPI.saveImage(dataUrl);
        if (filePath) {
          console.log('Image saved to:', filePath);
        }
        
        // Also copy to clipboard
        await window.electronAPI.copyToClipboard(dataUrl);
      }
      
      setShowEditor(false);
      clearCapture();
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    clearCapture();
  };

  if (showRegionSelector) {
    return (
      <RegionSelector
        onRegionSelected={handleRegionSelected}
        onCancel={handleRegionCancel}
      />
    );
  }

  if (showEditor && capturedImage) {
    return (
      <ImageEditor
        imageUrl={capturedImage}
        onSave={handleSaveImage}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        padding: '20px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '600',
          color: theme.colors.text
        }}>
          📸 ShottrClone
        </h1>
        
        <button
          onClick={toggleTheme}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            color: theme.colors.text,
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {theme.name === 'light' ? '🌙' : '☀️'}
          {theme.name === 'light' ? 'Dark' : 'Light'}
        </button>
      </header>

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '300',
            color: theme.colors.text,
            margin: '0 0 16px 0'
          }}>
            Capture & Edit Screenshots
          </h2>
          <p style={{
            fontSize: '16px',
            color: theme.colors.textSecondary,
            margin: 0,
            maxWidth: '500px'
          }}>
            Take beautiful screenshots with advanced editing tools, stylish backgrounds, and easy sharing options.
          </p>
        </div>

        <CaptureToolbar
          onFullScreen={handleFullScreenCapture}
          onRegion={handleRegionCapture}
          onWindow={handleWindowCapture}
          isCapturing={isCapturing}
        />

        {sources.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            backgroundColor: theme.colors.surface,
            borderRadius: '12px',
            maxWidth: '800px'
          }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '16px' }}>
              Select a window:
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {sources.map((source) => (
                <div
                  key={source.id}
                  style={{
                    cursor: 'pointer',
                    padding: '12px',
                    backgroundColor: theme.colors.background,
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border}`,
                    textAlign: 'center'
                  }}
                  onClick={() => selectSource(source)}
                >
                  <img
                    src={source.thumbnail}
                    alt={source.name}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}
                  />
                  <div style={{
                    fontSize: '12px',
                    color: theme.colors.textSecondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {source.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;