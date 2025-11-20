export interface Point {
  x: number;
  y: number;
}

export interface Translation {
  dx: number;
  dy: number;
}

export interface Reflection {
  axis: 'x' | 'y' | 'custom';
  m: number;
  c: number;
}

export interface Rotation {
  angle: number;
  center: Point | null;
  direction: 'clockwise' | 'anticlockwise';
}

export interface Enlargement {
  scale: number;
  center: Point | null;
}

export interface CanvasSettings {
  range: number;
  zoom: number;
}

export type TransformationMode = 'translation' | 'reflection' | 'rotation' | 'enlargement';

export interface Project {
  id: number;
  date: string;
  points: Point[];
  mode: TransformationMode;
  isShapeClosed: boolean;
  translation: Translation;
  reflection: Reflection;
  rotation: Rotation;
  enlargement: Enlargement;
  canvasSettings: CanvasSettings;
}
