import { useState, useCallback } from 'react';
import { ScreenSource, CaptureOptions } from '../types';

export const useScreenCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [sources, setSources] = useState<ScreenSource[]>([]);

  const captureScreen = useCallback(async (options: CaptureOptions) => {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    try {
      setIsCapturing(true);
      const result = await window.electronAPI.captureScreen(options);
      
      if (Array.isArray(result)) {
        setSources(result);
        return result;
      } else {
        setCapturedImage(result.thumbnail);
        return result;
      }
    } catch (error) {
      console.error('Error capturing screen:', error);
      throw error;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const captureFullScreen = useCallback(async () => {
    return await captureScreen({ type: 'fullscreen' });
  }, [captureScreen]);

  const captureRegion = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.showCaptureWindow();
    }
  }, []);

  const captureWindow = useCallback(async () => {
    return await captureScreen({ type: 'window' });
  }, [captureScreen]);

  const selectSource = useCallback((source: ScreenSource) => {
    setCapturedImage(source.thumbnail);
  }, []);

  const clearCapture = useCallback(() => {
    setCapturedImage(null);
    setSources([]);
  }, []);

  return {
    isCapturing,
    capturedImage,
    sources,
    captureFullScreen,
    captureRegion,
    captureWindow,
    selectSource,
    clearCapture,
    setCapturedImage
  };
};