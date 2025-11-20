import React, { useRef, useEffect } from 'react';
import { Project } from '../types';

interface ProjectThumbnailProps {
  project: Project;
}

const drawThumbnail = (canvas: HTMLCanvasElement, project: Project) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 80, H = 80;
  const N = project.canvasSettings.range;
  const CX = W / 2, CY = H / 2;
  const UNIT = W / (2 * N);

  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#e2e8f0'; // slate-200
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, CY); ctx.lineTo(W, CY);
  ctx.moveTo(CX, 0); ctx.lineTo(CX, H);
  ctx.stroke();

  const toPx = (p: { x: number, y: number }) => ({ x: CX + p.x * UNIT, y: CY - p.y * UNIT });

  const pts = project.points;
  if (!pts.length) return;

  ctx.beginPath();
  const p0 = toPx(pts[0]);
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i < pts.length; i++) {
    const p = toPx(pts[i]);
    ctx.lineTo(p.x, p.y);
  }
  if (project.isShapeClosed) ctx.closePath();
  ctx.strokeStyle = '#d81b60';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw points lightly
  ctx.fillStyle = '#d81b60';
  pts.forEach(pt => {
     const p = toPx(pt);
     ctx.beginPath();
     ctx.arc(p.x, p.y, 1.5, 0, Math.PI*2);
     ctx.fill();
  });
};

const ProjectThumbnail: React.FC<ProjectThumbnailProps> = ({ project }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      drawThumbnail(canvasRef.current, project);
    }
  }, [project]);

  return <canvas ref={canvasRef} width={80} height={80} className="bg-white rounded border border-gray-200 flex-shrink-0" />;
};

interface ProjectsPageProps {
  projects: Project[];
  onLoad: (id: number) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, onLoad, onDelete, onClose }) => {
  const getProjectDescription = (p: Project) => {
    if (p.id === 0) return "Start with a clean slate.";
    switch (p.mode) {
      case 'translation':
        return `Translated by (${p.translation.dx > 0 ? '+' : ''}${p.translation.dx}, ${p.translation.dy > 0 ? '+' : ''}${p.translation.dy})`;
      case 'reflection':
        if (p.reflection.axis === 'x') return `Reflected on X-Axis`;
        if (p.reflection.axis === 'y') return `Reflected on Y-Axis`;
        if (p.reflection.axis === 'custom') return `Reflected on y=${p.reflection.m}x+${p.reflection.c}`;
        return 'No transformation';
      case 'rotation':
        const rotCenter = p.rotation.center ? `(${p.rotation.center.x}, ${p.rotation.center.y})` : 'Origin';
        return `${p.rotation.angle}° ${p.rotation.direction} around ${rotCenter}`;
      case 'enlargement':
        const enlCenter = p.enlargement.center ? `(${p.enlargement.center.x}, ${p.enlargement.center.y})` : 'Origin';
        return `Enlarged by factor ${p.enlargement.scale} around ${enlCenter}`;
      default:
        return 'No transformation';
    }
  };

  return (
    <div className="p-4 min-h-screen flex items-center justify-center bg-black/5 backdrop-blur-sm fixed inset-0 z-50">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <div>
                <h2 className="text-3xl font-bold text-pink-700">My Projects</h2>
                <p className="text-gray-500 mt-1">Select a project to continue your work.</p>
            </div>
            <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-full transition-all shadow-sm hover:shadow">
                Back
            </button>
        </div>
        
        <div className="space-y-4 overflow-y-auto p-2 custom-scrollbar flex-1">
          {[...projects].sort((a, b) => b.id - a.id).map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm hover:shadow-md transition-all hover:border-pink-100 group">
              <ProjectThumbnail project={p} />
              <div className="flex-grow text-center sm:text-left">
                <h3 className="font-bold text-lg text-gray-800 group-hover:text-pink-600 transition-colors">
                    {p.id === 0 ? 'Empty Project' : `${p.mode.charAt(0).toUpperCase() + p.mode.slice(1)} #${p.id}`}
                </h3>
                <p className="text-sm text-gray-600">{getProjectDescription(p)}</p>
                <p className="text-xs text-gray-400 mt-1">{p.date}</p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button onClick={() => onLoad(p.id)} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all text-sm shadow-blue-200 shadow-md w-24">
                    Load
                </button>
                {p.id !== 0 && (
                  <button onClick={() => onDelete(p.id)} className="px-4 py-2 bg-red-50 text-red-500 font-semibold rounded-lg hover:bg-red-100 transition-all text-sm border border-red-100 w-24">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No saved projects found.</p>
                <p className="text-gray-300">Create one from the main screen!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
