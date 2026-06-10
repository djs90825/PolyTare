import React from 'react';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProModal({ isOpen, onClose }: ProModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
        <h2 className="text-2xl font-black text-white mb-2">PolyTare Pro</h2>
        <p className="text-slate-400 text-sm mb-6">Elevate your 3D pipeline with professional-grade automation. Launching soon at £20/month.</p>
        
        <ul className="space-y-3 mb-8 text-sm text-slate-300">
          <li className="flex items-center gap-2">✓ <span>Batch folder processing (CLI & UI)</span></li>
          <li className="flex items-center gap-2">✓ <span>Automated CI/CD GitHub Action</span></li>
          <li className="flex items-center gap-2">✓ <span>AI-Driven Texture Atlas Baking</span></li>
          <li className="flex items-center gap-2">✓ <span>Perceptual Quality Diffing Tool</span></li>
        </ul>

        <div className="bg-slate-800 p-4 rounded border border-slate-700 text-center">
            <p className="text-xs text-slate-400 mb-2">Want early access?</p>
            <input type="email" placeholder="Enter your email" className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-sm mb-2" />
            <button className="w-full bg-emerald-500 text-slate-950 font-bold py-2 rounded">Notify Me</button>
        </div>
      </div>
    </div>
  );
}