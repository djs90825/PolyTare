import React, { useState } from 'react';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProModal({ isOpen, onClose }: ProModalProps): React.ReactElement | null {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    
    // REPLACE WITH YOUR UNIQUE ENDPOINT FROM FORMSPREE OR GETFORM
    const endpoint = 'https://formspree.io/f/YOUR_ENDPOINT_HERE';
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
        await fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        setStatus('success');
    } catch (err) {
        alert('Connection error. Please try again.');
        setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">✕</button>
        
        <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">PolyTare Pro</h2>
            <p className="text-slate-400 text-sm">Scale your 3D pipeline with professional automation. Launching soon for <span className="text-emerald-400 font-bold">£29.99/mo</span>.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[
                { title: 'Batch Processing', desc: 'Process entire directories of 3D assets in seconds.' },
                { title: 'CI/CD Integration', desc: 'GitHub Action to auto-optimise assets in your repo.' },
                { title: 'AI Texture Baking', desc: 'Auto-merge materials and bake unique UV maps.' },
                { title: 'Perceptual Diffing', desc: 'Visualise visual fidelity changes before applying.' },
                { title: 'Priority Support', desc: 'Direct technical access to our architectural team.' },
                { title: 'Advanced Formats', desc: 'Support for FBX, OBJ, and USDZ conversions.' }
            ].map((feature, idx) => (
                <div key={idx} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">{feature.title}</h4>
                    <p className="text-[10px] text-slate-400">{feature.desc}</p>
                </div>
            ))}
        </div>

        {status === 'success' ? (
          <div className="bg-emerald-950/30 text-emerald-400 font-bold text-center py-6 rounded-lg border border-emerald-500/30">
            Early access confirmed. We'll be in touch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" name="email" required placeholder="Enter your business email" className="w-full bg-slate-950 border border-slate-700 p-3 rounded-lg text-sm text-white focus:border-emerald-500 outline-none transition-all" />
            <button disabled={status === 'submitting'} className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-lg uppercase tracking-wider text-xs hover:bg-emerald-400 transition-all active:scale-[0.98]">
              {status === 'submitting' ? 'Registering...' : 'Get Early Access'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}