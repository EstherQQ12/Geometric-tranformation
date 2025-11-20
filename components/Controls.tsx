import React from 'react';
import { AxisIcon } from './Icons';
import { TransformationMode, Translation, Reflection, Rotation, Enlargement } from '../types';

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
}

const SliderControl: React.FC<SliderControlProps> = ({ label, value, onChange, min, max, step = 1, displayValue }) => (
  <div className="grid grid-cols-[80px_1fr_50px] items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
    <label className="font-bold text-gray-600 text-sm">{label}</label>
    <input type="range" value={value} onChange={onChange} min={min} max={max} step={step} className="w-full accent-blue-600 cursor-pointer" />
    <span className="font-mono font-bold text-sm text-center text-gray-700">{displayValue}</span>
  </div>
);

interface ControlsProps {
  mode: TransformationMode;
  translation: Translation;
  setTranslation: React.Dispatch<React.SetStateAction<Translation>>;
  reflection: Reflection;
  setReflection: React.Dispatch<React.SetStateAction<Reflection>>;
  rotation: Rotation;
  setRotation: React.Dispatch<React.SetStateAction<Rotation>>;
  isSettingRotationCenter: boolean;
  onSetRotationCenterClick: () => void;
  enlargement: Enlargement;
  setEnlargement: React.Dispatch<React.SetStateAction<Enlargement>>;
  isSettingEnlargementCenter: boolean;
  onSetEnlargementCenterClick: () => void;
  range: number;
}

const Controls: React.FC<ControlsProps> = ({
  mode,
  translation,
  setTranslation,
  reflection,
  setReflection,
  rotation,
  setRotation,
  isSettingRotationCenter,
  onSetRotationCenterClick,
  enlargement,
  setEnlargement,
  isSettingEnlargementCenter,
  onSetEnlargementCenterClick,
  range
}) => {
  const maxMove = range + 40;
  const maxMC = range;

  return (
    <div className="space-y-3 mt-4 animate-fade-in">
      {mode === 'translation' && (
        <div className="space-y-2">
          <SliderControl label="X Move" value={translation.dx} onChange={e => setTranslation(t => ({ ...t, dx: +e.target.value }))} min={-maxMove} max={maxMove} displayValue={String(translation.dx)} />
          <SliderControl label="Y Move" value={translation.dy} onChange={e => setTranslation(t => ({ ...t, dy: +e.target.value }))} min={-maxMove} max={maxMove} displayValue={String(translation.dy)} />
        </div>
      )}

      {mode === 'reflection' && (
        <div className="space-y-2">
          <div className="bg-gray-50 p-2 rounded-lg grid grid-cols-[80px_1fr_50px] items-center gap-2 border border-gray-100">
            <label className="font-bold text-gray-600 text-sm">Reflect On</label>
            <div className="flex-1 flex gap-2">
              <button onClick={() => setReflection(r => ({ ...r, axis: 'x' }))} className={`flex-1 p-2 font-bold text-xs sm:text-sm rounded-md transition-all flex items-center justify-center gap-2 ${reflection.axis === 'x' ? 'bg-green-600 text-white shadow-md' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                <AxisIcon className="w-4 h-4" /> X-Axis
              </button>
              <button onClick={() => setReflection(r => ({ ...r, axis: 'y' }))} className={`flex-1 p-2 font-bold text-xs sm:text-sm rounded-md transition-all flex items-center justify-center gap-2 ${reflection.axis === 'y' ? 'bg-green-600 text-white shadow-md' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                <AxisIcon className="w-4 h-4 rotate-90" /> Y-Axis
              </button>
              <button onClick={() => setReflection(r => ({ ...r, axis: 'custom' }))} className={`flex-1 p-2 font-bold text-xs sm:text-sm rounded-md transition-all flex items-center justify-center gap-2 ${reflection.axis === 'custom' ? 'bg-green-600 text-white shadow-md' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                y=mx+c
              </button>
            </div>
            <span className="hidden sm:block font-mono font-bold text-xs text-center text-gray-700">
              {reflection.axis === 'x' && 'X-Axis'}
              {reflection.axis === 'y' && 'Y-Axis'}
              {reflection.axis === 'custom' && `y=${reflection.m}x+${reflection.c}`}
            </span>
          </div>

          {reflection.axis === 'custom' && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <SliderControl label="Slope (m)" value={reflection.m} onChange={e => setReflection(r => ({ ...r, m: +e.target.value }))} min={-maxMC} max={maxMC} step={1} displayValue={String(reflection.m.toFixed(0))} />
              <SliderControl label="Intercept (c)" value={reflection.c} onChange={e => setReflection(r => ({ ...r, c: +e.target.value }))} min={-maxMC} max={maxMC} displayValue={String(reflection.c)} />
            </div>
          )}
        </div>
      )}

      {mode === 'rotation' && (
        <div className="space-y-2">
          <div className="grid grid-cols-[80px_1fr_auto] items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <label className="font-bold text-gray-600 text-sm">Direction</label>
            <div className="flex-1 flex gap-2">
              <button onClick={() => setRotation(r => ({ ...r, direction: 'anticlockwise' }))} className={`flex-1 p-2 font-bold text-sm rounded-md transition-all ${rotation.direction === 'anticlockwise' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                Anticlockwise
              </button>
              <button onClick={() => setRotation(r => ({ ...r, direction: 'clockwise' }))} className={`flex-1 p-2 font-bold text-sm rounded-md transition-all ${rotation.direction === 'clockwise' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                Clockwise
              </button>
            </div>
          </div>
          <SliderControl label="Angle" value={rotation.angle} onChange={e => setRotation(r => ({ ...r, angle: +e.target.value }))} min={0} max={360} displayValue={`${rotation.angle}°`} />
          <div className="grid grid-cols-[80px_1fr_auto] items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <label className="font-bold text-gray-600 text-sm">Center</label>
            <button onClick={onSetRotationCenterClick} className={`p-2 w-full font-bold text-sm rounded-md transition-all text-white shadow-sm ${isSettingRotationCenter ? 'bg-pink-800 ring-2 ring-pink-400' : 'bg-pink-600 hover:bg-pink-700'}`}>
              {isSettingRotationCenter ? 'Click on Canvas...' : 'Set Rotation Center'}
            </button>
            <span className="font-mono font-bold text-sm text-center text-gray-700 w-28 truncate">
              {rotation.center ? `(${rotation.center.x}, ${rotation.center.y})` : 'Origin'}
            </span>
          </div>
        </div>
      )}

      {mode === 'enlargement' && (
        <div className="space-y-2">
          <SliderControl label="Scale Factor" value={enlargement.scale} onChange={e => setEnlargement(prev => ({ ...prev, scale: +e.target.value }))} min={0} max={10} step={0.1} displayValue={String(enlargement.scale.toFixed(1))} />
          <div className="grid grid-cols-[80px_1fr_auto] items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <label className="font-bold text-gray-600 text-sm">Center</label>
            <button onClick={onSetEnlargementCenterClick} className={`p-2 w-full font-bold text-sm rounded-md transition-all text-white shadow-sm ${isSettingEnlargementCenter ? 'bg-teal-800 ring-2 ring-teal-400' : 'bg-teal-600 hover:bg-teal-700'}`}>
              {isSettingEnlargementCenter ? 'Click on Canvas...' : 'Set Enlargement Center'}
            </button>
            <span className="font-mono font-bold text-sm text-center text-gray-700 w-28 truncate">
              {enlargement.center ? `(${enlargement.center.x}, ${enlargement.center.y})` : 'Origin'}
            </span>
          </div>
        </div>
      )}
      
      {/* Export Components for internal usage in Controls */}
    </div>
  );
};

export default Controls;
export { SliderControl };