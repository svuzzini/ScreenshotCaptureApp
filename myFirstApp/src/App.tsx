import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { CaptureToolbar } from './components/CaptureToolbar';
import { ImageEditor } from './components/ImageEditor';
import { RegionSelector } from './components/RegionSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast, useToast } from './components/Toast';
import { useScreenCapture } from './hooks/useScreenCapture';
import { Rectangle } from './types';

interface CaptureHistoryItem {
  id: string;
  thumbnail: string;
  timestamp: number;
}

const MAX_HISTORY = 20;

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
  const [captureHistory, setCaptureHistory] = useState<CaptureHistoryItem[]>([]);
  const { messages, addToast, dismissToast } = useToast();

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('captureHistory');
      if (saved) {
        setCaptureHistory(JSON.parse(saved));
      }
    } catch {
      // Ignore corrupted data
    }
  }, []);

  // Save history to localStorage
  const addToHistory = useCallback((dataUrl: string) => {
    setCaptureHistory(prev => {
      // Create a small thumbnail for history (resize to 200px wide)
      const newItem: CaptureHistoryItem = {
        id: Date.now().toString(),
        thumbnail: dataUrl,
        timestamp: Date.now()
      };
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem('captureHistory', JSON.stringify(updated));
      } catch {
        // localStorage may be full with large images - keep only 5
        const trimmed = updated.slice(0, 5);
        try {
          localStorage.setItem('captureHistory', JSON.stringify(trimmed));
        } catch {
          // Give up on persistence
        }
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    if (capturedImage) {
      setShowEditor(true);
    }
  }, [capturedImage]);

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFullScreenCapture = async () => {
    try {
      const result = await captureFullScreen();
      if (result && !Array.isArray(result)) {
        setCapturedImage(result.thumbnail);
        addToast('Screen captured', 'success');
      }
    } catch (error) {
      addToast('Failed to capture screen', 'error');
    }
  };

  const handleRegionCapture = () => {
    setShowRegionSelector(true);
  };

  const handleWindowCapture = async () => {
    try {
      const result = await captureWindow();
      if (Array.isArray(result) && result.length > 0) {
        if (result.length === 1) {
          selectSource(result[0]);
          addToast('Window captured', 'success');
        } else {
          addToast('Select a window from the grid', 'info');
        }
      }
    } catch (error) {
      addToast('Failed to capture window', 'error');
    }
  };

  const handleRegionSelected = async (region: Rectangle) => {
    setShowRegionSelector(false);

    try {
      const result = await captureFullScreen();
      if (result && !Array.isArray(result)) {
        const img = new Image();
        img.onload = () => {
          const scaleX = img.naturalWidth / window.innerWidth;
          const scaleY = img.naturalHeight / window.innerHeight;

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = region.width * scaleX;
          cropCanvas.height = region.height * scaleY;
          const ctx = cropCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              img,
              region.x * scaleX,
              region.y * scaleY,
              region.width * scaleX,
              region.height * scaleY,
              0,
              0,
              cropCanvas.width,
              cropCanvas.height
            );
            setCapturedImage(cropCanvas.toDataURL('image/png'));
            addToast('Region captured', 'success');
          }
        };
        img.src = result.thumbnail;
      }
    } catch (error) {
      addToast('Failed to capture region', 'error');
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
          addToast(`Saved to ${filePath}`, 'success');
        }

        await window.electronAPI.copyToClipboard(dataUrl);
        addToast('Copied to clipboard', 'success');
      }

      addToHistory(dataUrl);
      setShowEditor(false);
      clearCapture();
    } catch (error) {
      addToast('Failed to save image', 'error');
    }
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    clearCapture();
  };

  const handleHistoryClick = (item: CaptureHistoryItem) => {
    setCapturedImage(item.thumbnail);
  };

  const clearHistory = () => {
    setCaptureHistory([]);
    localStorage.removeItem('captureHistory');
    addToast('History cleared', 'info');
  };

  if (showRegionSelector) {
    return (
      <>
        <RegionSelector
          onRegionSelected={handleRegionSelected}
          onCancel={handleRegionCancel}
        />
        <Toast messages={messages} onDismiss={dismissToast} />
      </>
    );
  }

  if (showEditor && capturedImage) {
    return (
      <>
        <ImageEditor
          imageUrl={capturedImage}
          onSave={handleSaveImage}
          onCancel={handleCancelEdit}
        />
        <Toast messages={messages} onDismiss={dismissToast} />
      </>
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
        padding: '16px 20px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '600',
          color: theme.colors.text
        }}>
          ShottrClone
        </h1>

        <button
          onClick={toggleTheme}
          style={{
            padding: '6px 14px',
            backgroundColor: 'transparent',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            color: theme.colors.text,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {theme.name === 'light' ? 'Dark' : 'Light'}
        </button>
      </header>

      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '300',
            color: theme.colors.text,
            margin: '0 0 12px 0'
          }}>
            Capture & Edit Screenshots
          </h2>
          <p style={{
            fontSize: '15px',
            color: theme.colors.textSecondary,
            margin: 0,
            maxWidth: '460px'
          }}>
            Take screenshots with editing tools, stylish backgrounds, and easy sharing.
          </p>
        </div>

        {/* Loading indicator */}
        {isCapturing && (
          <div style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            backgroundColor: theme.colors.surface,
            borderRadius: '8px',
            color: theme.colors.textSecondary,
            fontSize: '14px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: `2px solid ${theme.colors.border}`,
              borderTopColor: theme.colors.primary,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            Capturing...
          </div>
        )}

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
            maxWidth: '800px',
            width: '100%'
          }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '16px', fontSize: '16px' }}>
              Select a window:
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {sources.map((source) => (
                <div
                  key={source.id}
                  style={{
                    cursor: 'pointer',
                    padding: '10px',
                    backgroundColor: theme.colors.background,
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border}`,
                    textAlign: 'center',
                    transition: 'border-color 0.2s ease'
                  }}
                  onClick={() => {
                    selectSource(source);
                    addToast('Window captured', 'success');
                  }}
                >
                  <img
                    src={source.thumbnail}
                    alt={source.name}
                    style={{
                      width: '100%',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '6px'
                    }}
                  />
                  <div style={{
                    fontSize: '11px',
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

        {/* Capture History */}
        {captureHistory.length > 0 && (
          <div style={{
            marginTop: '32px',
            width: '100%',
            maxWidth: '800px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 style={{
                color: theme.colors.text,
                fontSize: '16px',
                margin: 0
              }}>
                Recent Captures
              </h3>
              <button
                onClick={clearHistory}
                style={{
                  padding: '4px 10px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '4px',
                  color: theme.colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '10px'
            }}>
              {captureHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  style={{
                    cursor: 'pointer',
                    padding: '6px',
                    backgroundColor: theme.colors.surface,
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border}`,
                    textAlign: 'center',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <img
                    src={item.thumbnail}
                    alt="Capture"
                    style={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '4px'
                    }}
                  />
                  <div style={{
                    fontSize: '10px',
                    color: theme.colors.textSecondary
                  }}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Toast messages={messages} onDismiss={dismissToast} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
