export interface ScreenSource {
  id: string;
  name: string;
  thumbnail: string;
}

export interface CaptureOptions {
  type: 'fullscreen' | 'window' | 'region';
}

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EditAction {
  id: string;
  type: 'crop' | 'annotate' | 'blur' | 'highlight' | 'arrow' | 'text' | 'rectangle' | 'circle';
  data: any;
  timestamp: number;
}

export interface AnnotationData {
  type: string;
  startPoint: Point;
  endPoint?: Point;
  text?: string;
  color: string;
  strokeWidth: number;
  fillColor?: string;
}

export interface ExportOptions {
  format: 'png' | 'jpg';
  quality?: number;
  addBackground?: boolean;
  backgroundColor?: string;
  gradient?: {
    colors: string[];
    direction: string;
  };
  roundedCorners?: number;
  dropShadow?: boolean;
  padding?: number;
}

export interface Theme {
  name: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
}

export interface AppSettings {
  theme: Theme['name'];
  autoSave: boolean;
  defaultExportFormat: 'png' | 'jpg';
  captureDelay: number;
  showCursor: boolean;
  shortcuts: {
    fullscreen: string;
    region: string;
    window: string;
  };
}

declare global {
  interface Window {
    electronAPI: {
      captureScreen: (options: CaptureOptions) => Promise<ScreenSource | ScreenSource[]>;
      saveImage: (dataUrl: string, filename?: string) => Promise<string | null>;
      copyToClipboard: (dataUrl: string) => Promise<boolean>;
      showCaptureWindow: () => Promise<void>;
      closeCaptureWindow: () => Promise<void>;
      getScreenSize: () => Promise<{ width: number; height: number }>;
      onCaptureRequested: (callback: (data: any) => void) => void;
      removeCaptureListener: () => void;
    };
  }
}