import React from 'react';
import { Check, ClipboardList, Film, Users, Layout, FileImage, Image as ImageIcon, Camera, Video, Volume2, Lock } from 'lucide-react';

interface ProjectProgressProps {
  currentStep: number;
  highestStepReached: number;
  onStepChange: (step: number) => void;
  isStepSelectable?: (step: number) => boolean;
}

export default function ProjectProgress({ currentStep, highestStepReached, onStepChange, isStepSelectable }: ProjectProgressProps) {
  const steps = [
    { number: 1, label: 'Global Brief', icon: ClipboardList, desc: 'Script Input' },
    { number: 2, label: 'Scene Breakdown', icon: Film, desc: '≤ 5s Splits' },
    { number: 3, label: 'Key Elements', icon: Users, desc: 'Characters & bối cảnh' },
    { number: 4, label: 'Storyboard', icon: Layout, desc: 'Shot Layout & Audio' },
    { number: 5, label: 'Image Prompts', icon: FileImage, desc: 'Director Briefs' },
    { number: 6, label: 'Element Images', icon: ImageIcon, desc: 'Visual References' },
    { number: 7, label: 'Start-Frame Image', icon: Camera, desc: 'Keyframe Setup' },
    { number: 8, label: 'Video Prompts', icon: Video, desc: 'Motion Stack' },
    { number: 9, label: 'Audio Station', icon: Volume2, desc: 'TTS & SFX Mix' }
  ];

  return (
    <div className="w-full bg-[#0B0F19] border-b border-[#1E293B] px-6 py-4">
      <div className="w-full">
        {/* Mobile progress indicator */}
        <div className="flex md:hidden items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white text-xs font-mono font-bold">
              {currentStep}
            </span>
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Step {currentStep} of 9</p>
              <h2 className="text-sm font-semibold text-white">{steps[currentStep - 1].label}</h2>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/60 px-3 py-1 rounded">
            {steps[currentStep - 1].desc}
          </span>
        </div>

        {/* Desktop progress indicator */}
        <div className="hidden md:grid grid-cols-9 gap-2 relative">
          {steps.map((s, index) => {
            const isCompleted = s.number < currentStep;
            const isActive = s.number === currentStep;
            const isSelectable = true;
            const Icon = s.icon;

            return (
              <button
                key={s.number}
                onClick={() => onStepChange(s.number)}
                className={`group flex flex-col items-start p-3 rounded-lg border text-left transition-all relative cursor-pointer ${
                  isActive
                    ? 'bg-[#111827] border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/80'
                    : 'bg-[#0F1722]/50 border-slate-800 hover:bg-[#1E293B]/70 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                    isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    PHASE 0{s.number}
                  </span>
                  {isCompleted ? (
                    <Check className="w-4.5 h-4.5 text-emerald-400" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                  )}
                </div>
                <h3 className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-300'}`}>
                  {s.label}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono leading-none mt-0.5 truncate w-full">
                  {s.desc}
                </p>
                {/* Visual Connector Line between steps */}
                {index < 8 && (
                  <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-[1px] ${
                    s.number < highestStepReached ? 'bg-slate-700' : 'bg-transparent'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
