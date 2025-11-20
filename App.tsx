import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Controls, { SliderControl } from './components/Controls';
import ProjectsPage from './components/ProjectsPage';
import { HomeIcon, SaveIcon, RotationIcon, ReflectionIcon, TranslationIcon, EnlargementIcon, TableIcon } from './components/Icons';
import { Point, Translation, Reflection, Rotation, Enlargement, CanvasSettings, TransformationMode, Project } from './types';

// --- MODAL COMPONENT ---
interface CoordinateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPoints: Point[];
  transformedPoints: Point[];
}

const CoordinateTableModal: React.FC<CoordinateTableModalProps> = ({ isOpen, onClose, originalPoints, transformedPoints }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                    <TableIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">Coordinate Mapping</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
        
        <div className="p-0 overflow-y-auto custom-scrollbar">
            {originalPoints.length > 0 ? (
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 w-20 font-bold tracking-wider">Point</th>
                            <th className="px-6 py-3 font-bold tracking-wider">Original <span className="normal-case font-mono ml-1">(x, y)</span></th>
                            <th className="px-6 py-3 font-bold tracking-wider">Transformed <span className="normal-case font-mono ml-1">(x', y')</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {originalPoints.map((p, i) => {
                            const tp = transformedPoints[i];
                            // Check if points differ significantly
                            const hasChanged = tp && (Math.abs(p.x - tp.x) > 0.01 || Math.abs(p.y - tp.y) > 0.01);
                            
                            return (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-pink-600">
                                        {String.fromCharCode(65 + i)}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">
                                        ({p.x}, {p.y})
                                    </td>
                                    <td className={`px-6 py-4 font-mono font-bold ${hasChanged ? 'text-blue-600' : 'text-slate-400'}`}>
                                        {tp ? (
                                            <>
                                              ({parseFloat(tp.x.toFixed(2))}, {parseFloat(tp.y.toFixed(2))})
                                            </>
                                        ) : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <div className="py-12 px-6 text-center text-slate-400 flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                    <p>Plot points on the grid to see coordinates.</p>
                </div>
            )}
        </div>
        <div className="bg-slate-50 p-3 border-t border-gray-100 text-xs text-center text-slate-500">
            Values are rounded to 2 decimal places.
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App: React.FC = () => {
  // STATE MANAGEMENT
  const [points, setPoints] = useState<Point[]>([]);
  const [isShapeClosed, setIsShapeClosed] = useState(false);
  const [mode, setMode] = useState<TransformationMode>('translation');

  // Transformation states
  const [translation, setTranslation] = useState<Translation>({ dx: 0, dy: 0 });
  const [reflection, setReflection] = useState<Reflection>({ axis: 'x', m: 1, c: 0 });
  const [rotation, setRotation] = useState<Rotation>({ angle: 0, center: null, direction: 'anticlockwise' });
  const [isSettingRotationCenter, setIsSettingRotationCenter] = useState(false);
  const [enlargement, setEnlargement] = useState<Enlargement>({ scale: 1, center: null });
  const [isSettingEnlargementCenter, setIsSettingEnlargementCenter] = useState(false);

  // UI states
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({ range: 20, zoom: 600 });
  const [statusText, setStatusText] = useState("Click to add first point!");
  const [currentPage, setCurrentPage] = useState<'main' | 'projects'>('main');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCoordinates, setShowCoordinates] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- PROJECT MANAGEMENT ---
  const getProjectsFromStorage = (): Project[] => {
    const stored = localStorage.getItem('geometryProjects');
    try {
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  const saveProjectsToStorage = (projs: Project[]) => {
    localStorage.setItem('geometryProjects', JSON.stringify(projs));
  };

  useEffect(() => {
    let projs = getProjectsFromStorage();
    if (!projs.some(p => p.id === 0)) {
      const emptyProject: Project = {
        id: 0,
        date: new Date().toLocaleString(),
        points: [],
        mode: 'translation',
        isShapeClosed: false,
        translation: { dx: 0, dy: 0 },
        reflection: { axis: 'x', m: 1, c: 0 },
        rotation: { angle: 0, center: null, direction: 'anticlockwise' },
        enlargement: { scale: 1, center: null },
        canvasSettings: { range: 20, zoom: 600 }
      };
      projs = [emptyProject, ...projs];
      saveProjectsToStorage(projs);
    }
    setProjects(projs);
  }, []);

  const handleShowProjects = () => {
    setProjects(getProjectsFromStorage());
    setCurrentPage('projects');
  };

  const handleSaveProject = () => {
    if (!points.length) {
      setStatusText("Cannot save an empty shape!");
      return;
    }

    const newProject: Project = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      points,
      mode,
      isShapeClosed,
      translation,
      reflection,
      rotation,
      enlargement,
      canvasSettings
    };

    const projs = getProjectsFromStorage();
    saveProjectsToStorage([...projs, newProject]);
    setStatusText('Project saved!');

    // PNG Download
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    const pad = 60;
    exportCanvas.width = canvas.width + pad * 2;
    exportCanvas.height = canvas.height + pad * 2;
    const eCtx = exportCanvas.getContext('2d');
    if (!eCtx) return;

    eCtx.fillStyle = '#fff';
    eCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    eCtx.drawImage(canvas, pad, pad);

    eCtx.fillStyle = '#c2185b';
    eCtx.font = 'bold 24px system-ui';
    eCtx.textAlign = 'center';
    eCtx.fillText(`${mode.charAt(0).toUpperCase() + mode.slice(1)} of Shapes`, exportCanvas.width / 2, 40);

    const a = document.createElement('a');
    a.download = `${mode}-shape-${newProject.id}.png`;
    a.href = exportCanvas.toDataURL('image/png');
    a.click();
  };

  const handleLoadProject = (id: number) => {
    const projs = getProjectsFromStorage();
    const p = projs.find(proj => proj.id === id);
    if (p) {
      setPoints(p.points);
      setIsShapeClosed(p.isShapeClosed);
      setMode(p.mode);
      setTranslation(p.translation);
      setReflection(p.reflection);
      setRotation(p.rotation);
      setEnlargement(p.enlargement || { scale: 1, center: null });
      setCanvasSettings(p.canvasSettings);
      setIsSettingRotationCenter(false);
      setIsSettingEnlargementCenter(false);
      setCurrentPage('main');
      setStatusText(p.id === 0 ? 'Empty project loaded!' : `Project #${id} loaded!`);
    }
  };

  const handleDeleteProject = (id: number) => {
    let projs = getProjectsFromStorage();
    projs = projs.filter(p => p.id !== id);
    saveProjectsToStorage(projs);
    setProjects(projs);
  };

  // TRANSFORMATION LOGIC
  const transformedPoints = useMemo(() => {
    if (!points.length) return [];
    
    let transformed: Point[] = [];

    if (mode === 'translation' && (translation.dx !== 0 || translation.dy !== 0)) {
      transformed = points.map(p => ({ x: p.x + translation.dx, y: p.y + translation.dy }));
    } else if (mode === 'reflection') {
      if (reflection.axis === 'x') {
        transformed = points.map(p => ({ x: p.x, y: -p.y }));
      } else if (reflection.axis === 'y') {
        transformed = points.map(p => ({ x: -p.x, y: p.y }));
      } else if (reflection.axis === 'custom') {
        const { m, c } = reflection;
        const denom = 1 + m * m;
        if (denom !== 0) {
          transformed = points.map(p => {
            const x = p.x;
            const y = p.y;
            const xPrime = (x * (1 - m * m) + y * 2 * m - 2 * m * c) / denom;
            const yPrime = (x * 2 * m + y * (m * m - 1) + 2 * c) / denom;
            return { x: xPrime, y: yPrime };
          });
        } else {
          transformed = [...points];
        }
      }
    } else if (mode === 'rotation' && rotation.angle !== 0) {
      const center = rotation.center || { x: 0, y: 0 };
      const sign = rotation.direction === 'clockwise' ? -1 : 1;
      const rad = rotation.angle * sign * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);

      transformed = points.map(p => ({
        x: cos * (p.x - center.x) - sin * (p.y - center.y) + center.x,
        y: sin * (p.x - center.x) + cos * (p.y - center.y) + center.y
      }));
    } else if (mode === 'enlargement' && enlargement.scale !== 1) {
      const center = enlargement.center || { x: 0, y: 0 };
      const scale = enlargement.scale;

      transformed = points.map(p => ({
        x: center.x + scale * (p.x - center.x),
        y: center.y + scale * (p.y - center.y)
      }));
    } else {
        // No transformation active, or default state
        transformed = [...points];
    }

    return transformed;
  }, [points, mode, translation, reflection, rotation, enlargement]);


  // DRAWING LOGIC
  const toPx = useCallback((p: Point) => {
    const { range: N, zoom } = canvasSettings;
    const CX = zoom / 2, CY = zoom / 2, UNIT = zoom / (2 * N);
    return { x: CX + p.x * UNIT, y: CY - p.y * UNIT };
  }, [canvasSettings]);

  const drawAxes = useCallback((ctx: CanvasRenderingContext2D) => {
    const { range: N, zoom } = canvasSettings;
    const W = zoom, H = zoom, CX = W / 2, CY = H / 2;
    const UNIT = W / (2 * N);
    const TICK = Math.max(4, UNIT * 0.15);
    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#f1f5f9'; // slate-100
    ctx.lineWidth = 1;
    for (let i = -N; i <= N; i++) {
      if (i === 0) continue;
      let p = { x: CX + i * UNIT, y: CY - i * UNIT };
      ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(W, p.y); ctx.stroke();
    }

    // Main Axes
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, CY); ctx.lineTo(W, CY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CX, 0); ctx.lineTo(CX, H); ctx.stroke();

    // Ticks and Labels
    const fs = Math.max(10, Math.floor(zoom / 60));
    ctx.font = `bold ${fs}px system-ui`;
    ctx.fillStyle = '#64748b'; // slate-500
    for (let i = -N; i <= N; i++) {
      if (i === 0) continue;
      let p = { x: CX + i * UNIT, y: CY - i * UNIT };
      
      ctx.beginPath(); ctx.moveTo(p.x, CY - TICK); ctx.lineTo(p.x, CY + TICK); ctx.stroke();
      if (i % 2 === 0 || N < 15) { // Skip every other label if congested
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(String(i), p.x, CY + TICK + 4);
      }

      ctx.beginPath(); ctx.moveTo(CX - TICK, p.y); ctx.lineTo(CX + TICK, p.y); ctx.stroke();
      if (i % 2 === 0 || N < 15) {
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(String(i), CX - TICK - 4, p.y);
      }
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('0', CX - 4, CY + 4);
  }, [canvasSettings]);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, pts: Point[], color: string, fill: boolean, label = '', labelsEnabled = false, showCoordinates = false, labelSuffix = '') => {
    if (!pts.length) return;
    ctx.beginPath();
    let p0 = toPx(pts[0]);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < pts.length; i++) {
      let p = toPx(pts[i]);
      ctx.lineTo(p.x, p.y);
    }
    if (isShapeClosed && pts.length > 2) ctx.closePath();

    if (fill) {
      ctx.fillStyle = `${color}30`; // 20% opacity approx
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw points (dots)
    pts.forEach((p, i) => {
      let px = toPx(p);
      
      // Outer dot (Colored)
      ctx.fillStyle = color; 
      ctx.beginPath(); ctx.arc(px.x, px.y, 6, 0, Math.PI * 2); ctx.fill();
      
      // Inner dot (White)
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(px.x, px.y, 2, 0, Math.PI * 2); ctx.fill();
      
      if (labelsEnabled || showCoordinates) {
          ctx.fillStyle = color;
          ctx.font = 'bold 12px system-ui';
          ctx.textAlign = 'left';
          
          let text = '';
          if (labelsEnabled) text += String.fromCharCode(65 + i) + labelSuffix;
          if (showCoordinates) text += ` (${p.x}, ${p.y})`;
          
          // Small shadow/outline for readability against grid lines
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.strokeText(text, px.x + 8, px.y - 8);
          ctx.fillText(text, px.x + 8, px.y - 8);
      }
    });

    // Draw center label if provided
    if (label && pts.length) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      pts.forEach(p => {
          const px = toPx(p);
          minX = Math.min(minX, px.x);
          maxX = Math.max(maxX, px.x);
          minY = Math.min(minY, px.y);
          maxY = Math.max(maxY, px.y);
      });
      
      const centerX = (minX + maxX) / 2;
      const centerY = minY - 20; // Above the top

      ctx.fillStyle = color;
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 4;
      ctx.fillText(label, centerX, centerY);
      ctx.shadowBlur = 0;
    }
  }, [isShapeClosed, toPx]);

  const drawCenterDot = useCallback((ctx: CanvasRenderingContext2D, center: Point | null, color: string) => {
    if (!center) return;
    const p = toPx(center);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'white'; ctx.stroke();

    const txt = `(${center.x}, ${center.y})`;
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Text outline
    ctx.lineWidth = 3; ctx.strokeStyle = 'white'; ctx.strokeText(txt, p.x, p.y + 20);
    ctx.fillStyle = color;
    ctx.fillText(txt, p.x, p.y + 20);
  }, [toPx]);

  const drawReflectionLine = useCallback((ctx: CanvasRenderingContext2D, m: number, c: number, color = '#607d8b') => {
    const { range: N, zoom } = canvasSettings;
    const CX = zoom / 2, CY = zoom / 2, UNIT = zoom / (2 * N);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);

    ctx.beginPath();
    const x1 = -N;
    const y1 = m * x1 + c;
    const px1 = CX + x1 * UNIT;
    const py1 = CY - y1 * UNIT;

    const x2 = N;
    const y2 = m * x2 + c;
    const px2 = CX + x2 * UNIT;
    const py2 = CY - y2 * UNIT;

    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [canvasSettings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawAxes(ctx);
    // Draw original with labels (true) but NO coordinates (false)
    drawShape(ctx, points, '#be185d', true, 'Original', true, false); 

    // Check if any transformation is effectively applied
    let applied = false;
    
    if (mode === 'translation' && (translation.dx !== 0 || translation.dy !== 0)) {
      applied = true;
    } else if (mode === 'reflection') {
      if (reflection.axis === 'x') {
        applied = true;
      } else if (reflection.axis === 'y') {
        applied = true;
      } else if (reflection.axis === 'custom') {
          drawReflectionLine(ctx, reflection.m, reflection.c);
          applied = true;
      }
    } else if (mode === 'rotation' && rotation.angle !== 0) {
      drawCenterDot(ctx, rotation.center, '#9c27b0');
      applied = true;
    } else if (mode === 'enlargement' && enlargement.scale !== 1) {
      drawCenterDot(ctx, enlargement.center, '#009688');
      applied = true;
    }

    if (applied && transformedPoints.length > 0) {
      // Transformed shape: showCoordinates = false, no label (title), but ENABLE point labels (A', B')
      drawShape(ctx, transformedPoints, '#0ea5e9', true, '', true, false, "'"); 
    }

  }, [points, transformedPoints, mode, translation, reflection, rotation, enlargement, isShapeClosed, drawAxes, drawShape, drawCenterDot, drawReflectionLine]);

  useEffect(() => {
    if (points.length === 0) {
      setStatusText("Click anywhere on the grid to plot your first point.");
    } else if (!isShapeClosed) {
      setStatusText(`Plotting point ${points.length + 1}... Click near the first point to close the shape.`);
    } else {
      if (mode === 'rotation' && isSettingRotationCenter) {
        setStatusText("Click anywhere on the canvas to set the center of rotation.");
      } else if (mode === 'enlargement' && isSettingEnlargementCenter) {
        setStatusText("Click anywhere on the canvas to set the center of enlargement.");
      } else if (mode === 'reflection' && reflection.axis === 'custom') {
        setStatusText(`Adjust 'm' and 'c' sliders to reflect across y=${reflection.m.toFixed(0)}x+${reflection.c.toFixed(0)}.`);
      } else {
        setStatusText("Shape closed! Use the controls above to transform it.");
      }
    }
  }, [points, isShapeClosed, mode, isSettingRotationCenter, isSettingEnlargementCenter, reflection]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left + container.scrollLeft;
    const my = e.clientY - rect.top + container.scrollTop;

    const fromPx = (px: number, py: number) => {
      const { range: N, zoom } = canvasSettings;
      const CX = zoom / 2, CY = zoom / 2, UNIT = zoom / (2 * N);
      return { x: (px - CX) / UNIT, y: (CY - py) / UNIT };
    };

    let pt = fromPx(mx, my);
    // Snap to grid
    pt = { x: Math.round(pt.x), y: Math.round(pt.y) };

    // Check if clicking existing point to delete (only if shape not closed)
    if (!isShapeClosed) {
        for (let i = 0; i < points.length; i++) {
        const { x, y } = toPx(points[i]);
        // Tolerance for click
        if (Math.hypot(mx - x, my - y) <= 15) {
            setPoints(pts => {
            const newPts = [...pts];
            newPts.splice(i, 1);
            return newPts;
            });
            return;
        }
        }
    }

    if (points.length > 2 && !isShapeClosed) {
      const first = points[0];
      if (Math.hypot(pt.x - first.x, pt.y - first.y) <= 0.8) {
        setIsShapeClosed(true);
        return;
      }
    }

    if (mode === 'rotation' && isSettingRotationCenter) {
      setRotation(r => ({ ...r, center: pt }));
      setIsSettingRotationCenter(false);
      return;
    }

    if (mode === 'enlargement' && isSettingEnlargementCenter) {
      setEnlargement(e => ({ ...e, center: pt }));
      setIsSettingEnlargementCenter(false);
      return;
    }

    if (!isShapeClosed) {
      setPoints(pts => [...pts, pt]);
    }
  };

  const handleModeChange = (newMode: TransformationMode) => {
    setMode(newMode);
    // Reset transformations specific to the new mode
    if (newMode === 'translation') setTranslation({ dx: 0, dy: 0 });
    if (newMode === 'reflection') setReflection({ axis: 'x', m: 1, c: 0 });
    if (newMode === 'rotation') {
        setRotation({ angle: 0, center: null, direction: 'anticlockwise' });
        setIsSettingRotationCenter(false);
    }
    if (newMode === 'enlargement') {
        setEnlargement({ scale: 1, center: null });
        setIsSettingEnlargementCenter(false);
    }
  };

  const handleClear = () => {
    setPoints([]);
    setIsShapeClosed(false);
    handleReset();
  };

  const handleReset = () => {
    if (mode === 'translation') {
      setTranslation({ dx: 0, dy: 0 });
    } else if (mode === 'reflection') {
      setReflection({ axis: 'x', m: 1, c: 0 });
    } else if (mode === 'rotation') {
      setRotation({ angle: 0, center: null, direction: 'anticlockwise' });
      setIsSettingRotationCenter(false);
    } else if (mode === 'enlargement') {
      setEnlargement({ scale: 1, center: null });
      setIsSettingEnlargementCenter(false);
    }
  };

  return (
    <>
      {currentPage === 'projects' && (
        <ProjectsPage
          projects={projects}
          onLoad={handleLoadProject}
          onDelete={handleDeleteProject}
          onClose={() => setCurrentPage('main')}
        />
      )}
      
      <CoordinateTableModal 
        isOpen={showCoordinates} 
        onClose={() => setShowCoordinates(false)} 
        originalPoints={points}
        transformedPoints={transformedPoints}
      />

      <div className="min-h-screen flex flex-col items-center py-8 px-4 font-sans">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          
          {/* Top Navigation Bar */}
          <div className="bg-slate-50 border-b border-gray-100 p-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-600 rounded-lg shadow-lg shadow-pink-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Geometric<span className="text-pink-600">Transformations</span></h1>
             </div>
             <div className="flex gap-3">
                 <button onClick={handleShowProjects} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-pink-200 hover:text-pink-600 transition-all shadow-sm">
                    <HomeIcon className="w-5 h-5" /> <span className="hidden sm:inline">My Projects</span>
                 </button>
                 <button onClick={handleSaveProject} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-200">
                    <SaveIcon className="w-5 h-5" /> <span className="hidden sm:inline">Save & Export</span>
                 </button>
             </div>
          </div>

          <div className="flex flex-col lg:flex-row h-full">
            
            {/* Left Sidebar - Controls */}
            <div className="w-full lg:w-1/3 p-6 bg-white border-r border-gray-50 flex flex-col gap-6 z-10">
                
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleModeChange('translation')} className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center gap-2 transition-all border-2 ${mode === 'translation' ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                        <TranslationIcon className="w-6 h-6" /> Translation
                    </button>
                    <button onClick={() => handleModeChange('reflection')} className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center gap-2 transition-all border-2 ${mode === 'reflection' ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                        <ReflectionIcon className="w-6 h-6" /> Reflection
                    </button>
                    <button onClick={() => handleModeChange('rotation')} className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center gap-2 transition-all border-2 ${mode === 'rotation' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                        <RotationIcon className="w-6 h-6" /> Rotation
                    </button>
                    <button onClick={() => handleModeChange('enlargement')} className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center gap-2 transition-all border-2 ${mode === 'enlargement' ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                        <EnlargementIcon className="w-6 h-6" /> Enlargement
                    </button>
                </div>

                <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">Controls</h3>
                    <Controls
                        mode={mode}
                        translation={translation}
                        setTranslation={setTranslation}
                        reflection={reflection}
                        setReflection={setReflection}
                        rotation={rotation}
                        setRotation={setRotation}
                        isSettingRotationCenter={isSettingRotationCenter}
                        onSetRotationCenterClick={() => setIsSettingRotationCenter(c => !c)}
                        enlargement={enlargement}
                        setEnlargement={setEnlargement}
                        isSettingEnlargementCenter={isSettingEnlargementCenter}
                        onSetEnlargementCenterClick={() => setIsSettingEnlargementCenter(c => !c)}
                        range={canvasSettings.range}
                    />

                    {/* NEW BUTTON FOR COORDINATE MAPPING */}
                    <button 
                        onClick={() => setShowCoordinates(true)}
                        className="w-full mt-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm flex items-center justify-center gap-2 group"
                    >
                        <div className="p-1 bg-gray-100 rounded text-gray-500 group-hover:text-blue-500 transition-colors">
                           <TableIcon className="w-5 h-5" />
                        </div>
                        Show Coordinate Mapping
                    </button>
                </div>
            </div>

            {/* Right Content - Canvas */}
            <div className="w-full lg:w-2/3 bg-slate-50 relative flex flex-col h-full min-h-[600px]">
                
                {/* Info Banner */}
                <div className="bg-blue-50/50 border-b border-blue-100 p-3 text-center text-sm font-medium text-blue-800">
                    {statusText}
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative overflow-hidden" ref={containerRef}>
                     <div className="absolute inset-0 flex items-center justify-center p-4">
                        <canvas 
                            ref={canvasRef} 
                            width={canvasSettings.zoom} 
                            height={canvasSettings.zoom} 
                            className="bg-white shadow-xl rounded-lg cursor-crosshair"
                            onClick={handleCanvasClick}
                        />
                     </div>
                </div>

                {/* Bottom Controls Bar (Zoom, Range, Reset, Clear) */}
                <div className="bg-white border-t border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {/* Range & Zoom Controls */}
                        <div className="space-y-3">
                            <SliderControl 
                                label="Grid Range" 
                                value={canvasSettings.range} 
                                onChange={e => setCanvasSettings(cs => ({...cs, range: +e.target.value}))} 
                                min={5} max={50} 
                                displayValue={String(canvasSettings.range)} 
                            />
                            <SliderControl 
                                label="Zoom Level" 
                                value={canvasSettings.zoom} 
                                onChange={e => setCanvasSettings(cs => ({...cs, zoom: +e.target.value}))} 
                                min={400} max={2000} step={50} 
                                displayValue={String(canvasSettings.zoom)} 
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 items-center">
                            <button onClick={handleReset} className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                Reset Values
                            </button>
                            <button onClick={handleClear} className="flex-1 py-3 px-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 hover:text-red-700 transition-all border border-red-100 flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                Clear Canvas
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-400 mt-6 text-sm">© {new Date().getFullYear()} Geometric Transformations Explorer</p>
      </div>
    </>
  );
}

export default App;