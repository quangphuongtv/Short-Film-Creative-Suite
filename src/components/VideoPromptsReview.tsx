import React, { useState } from 'react';
import { StoryboardShot, KeyElement } from '../types';
import { Video, Sparkles, Navigation, Play, Pause, ChevronRight, MessageSquare, Compass, Volume2, Download, Copy, Check } from 'lucide-react';

interface VideoPromptsReviewProps {
  shots: StoryboardShot[];
  keyElements: KeyElement[];
  onConfirm: (updatedShots: StoryboardShot[]) => void;
  onBack: () => void;
}

export default function VideoPromptsReview({ shots, keyElements, onConfirm, onBack }: VideoPromptsReviewProps) {
  const [localShots, setLocalShots] = useState<StoryboardShot[]>(shots);
  const [activeShotId, setActiveShotId] = useState<string>(shots[0]?.id || '');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simOffset, setSimOffset] = useState({ scale: 1, x: 0, y: 0 });
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  const handleCopyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 1500);
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeShot = localShots.find(s => s.id === activeShotId) || localShots[0];

  const handleUpdateVideoPrompt = (id: string, text: string) => {
    setLocalShots(localShots.map(s => {
      if (s.id === id) {
        return { ...s, videoPrompt: text };
      }
      return s;
    }));
  };

  // Simulate director camerawork physics using simple canvas state logic
  const handleTriggerSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      setSimOffset({ scale: 1, x: 0, y: 0 });
      return;
    }

    setIsSimulating(true);
    let count = 0;
    const interval = setInterval(() => {
      if (!isSimulating) {
        // If stopped during transition
        count++;
      }
      const movement = activeShot?.cinematography.movement || 'slow push-in';
      
      if (movement.includes('push-in')) {
        setSimOffset(prev => ({ ...prev, scale: 1 + (count * 0.01) }));
      } else if (movement.includes('drift')) {
        setSimOffset(prev => ({
          scale: 1.02,
          x: Math.sin(count * 0.4) * 4,
          y: Math.cos(count * 0.3) * 3
        }));
      } else if (movement.includes('pan right')) {
        setSimOffset(prev => ({ ...prev, x: count * 1.5 }));
      } else if (movement.includes('zoom out')) {
        setSimOffset(prev => ({ ...prev, scale: Math.max(0.85, 1 - (count * 0.007)) }));
      }

      count++;
      if (count > 60) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 50);
  };

  const activeLocation = keyElements.find(el => el.id === activeShot?.locationElementId);
  const activeLocationImage = activeLocation?.imageUrl;

  return (
    <div className="bg-[#0B0F19] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-lg font-extrabold text-[#F1F5F9] font-mono flex items-center gap-2 uppercase tracking-wide">
          <span className="inline-block w-2.5 h-6 bg-cyan-500 rounded-sm"></span>
          CHỈ THỊ ĐỘNG CÚ QUAY SHOT-BY-SHOT (VIDEO MOTION STACK)
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          BƯỚC 8: Biên soạn các câu lệnh hội tụ chuyển động của camera, hành động thực tế của chủ thể và âm tương ứng cho Veo AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Menu of Shots */}
        <div className="lg:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-2">
          <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">DANH SÁCH KHUNG QUAY HỢP LỆ</label>
          {localShots.map(s => {
            const isActive = s.id === activeShotId;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveShotId(s.id);
                  setSimOffset({ scale: 1, x: 0, y: 0 });
                  setIsSimulating(false);
                }}
                className={`w-full p-3 texts-left rounded-lg text-left border transition-all flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'bg-[#0F1722]/40 border-slate-800 hover:bg-[#1E293B]/40 text-slate-300 hover:text-[#F1F5F9]'
                }`}
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold font-mono">Cú máy {s.id} ({s.durationSeconds} giây)</h4>
                  <p className={`text-[10px] truncate max-w-[200px] ${isActive ? 'text-cyan-500/80 font-medium' : 'text-slate-500'}`}>
                    {s.storyBeat}
                  </p>
                </div>
                <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded ${
                  isActive ? 'border-cyan-500/60 text-cyan-400 bg-cyan-950/20 font-bold' : 'border-slate-800 text-slate-500'
                }`}>
                  {s.cinematography.scale.substring(0, 10).toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Col: Active Shot Motion Editor & Simulator */}
        {activeShot && (
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Camerawork Simulator block */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">MÔ PHỎNG CAMERA (DIRECTOR PREVIEW)</label>
                  <button
                    onClick={handleTriggerSimulation}
                    className="py-1 px-2.5 bg-[#131924] hover:bg-cyan-950/40 border border-slate-700 rounded font-mono text-[10px] font-bold text-slate-300 hover:text-cyan-400 flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Play className="w-3 h-3 text-cyan-405 text-cyan-400" /> Sim Camerawork
                  </button>
                </div>

                <div className="aspect-video bg-[#0E0F14] relative rounded-xl overflow-hidden shadow border border-slate-800 flex items-center justify-center">
                  <div
                    style={{
                      transform: `scale(${simOffset.scale}) translate(${simOffset.x}px, ${simOffset.y}px)`,
                      transition: isSimulating ? 'transform 0.05s linear' : 'transform 0.3s ease-out',
                    }}
                    className="w-full h-full relative"
                  >
                    {activeShot?.startFrameUrl ? (
                      <img
                        src={activeShot.startFrameUrl}
                        alt="startframe"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : activeLocationImage ? (
                      <img
                        src={activeLocationImage}
                        alt="location"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-indigo-950 flex flex-col items-center justify-center text-center p-4">
                        <Compass className="w-10 h-10 text-cyan-400 animate-pulse mb-1" />
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">{activeLocation?.name || 'Bản Thấm Điện Ảnh'}</span>
                        <p className="text-[9px] text-slate-550 text-slate-505 text-slate-500 max-w-xs leading-normal mt-1">{activeShot.startFramePrompt?.substring(0, 80)}...</p>
                      </div>
                    )}

                    {/* Simulating motion indicators overlay */}
                    {isSimulating && (
                      <div className="absolute inset-x-0 bottom-4 flex justify-center">
                        <span className="py-0.5 px-2 bg-red-650 bg-red-600 text-white rounded text-[9px] font-mono font-bold animate-ping">
                          REC CAMERA WORK
                        </span>
                      </div>
                    )}
                  </div>

                  {(activeShot?.startFrameUrl || activeLocationImage) && (
                    <div className="absolute top-2.5 right-2.5 z-20 flex gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleDownloadImage(activeShot?.startFrameUrl || activeLocationImage || '', `${activeShot.id}_cameraview.png`)}
                        className="p-1 px-2 bg-slate-900/95 hover:bg-slate-800 text-[10px] text-white hover:text-cyan-400 font-bold font-mono rounded border border-slate-705 border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98] shadow-md"
                        title="Tải hình ảnh cảnh quay về máy"
                      >
                        <Download className="w-3 h-3" />
                        Tải về
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(`video_prompt_btn_${activeShot.id}`, activeShot.videoPrompt || '')}
                        className="p-1 px-2 bg-slate-900/95 hover:bg-slate-800 text-[10px] text-white hover:text-cyan-400 font-bold font-mono rounded border border-slate-705 border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98] shadow-md"
                        title="Sao chép câu lệnh video motion stack"
                      >
                        {copiedStates[`video_prompt_btn_${activeShot.id}`] ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-405 text-emerald-400" />
                            Đã chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Sao chép
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Viewfinder Static boundaries box */}
                  <div className="absolute inset-4 border border-white/10 pointer-events-none rounded" />
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-205 text-slate-200 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none uppercase">
                    🎥 {activeShot.cinematography.movement}
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono text-cyan-400 bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                    {activeShot.cinematography.scale}
                  </div>
                </div>
              </div>

              {/* Stack Prompt Configuration parameters */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-[#F1F5F9] uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-cyan-455 text-cyan-400" />
                  HỆ PROMPT VIDEO MOTION STACK (VEO)
                </h3>

                {/* Camera instruction */}
                <div className="p-3 bg-[#111827] rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" /> Cú hích Camera
                  </div>
                  <p className="text-xs font-medium text-slate-300">
                    Sử dụng động thái <strong className="font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-900/50 px-1 rounded">{activeShot.cinematography.movement}</strong> phối hợp cỡ cảnh <strong className="font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-1 rounded">{activeShot.cinematography.scale}</strong> từ góc máy <strong className="font-mono text-slate-305 text-slate-350 bg-slate-900-30 px-1 rounded bg-slate-900 border border-slate-850 border-slate-800">{activeShot.cinematography.angle}</strong>.
                  </p>
                </div>

                {/* Subjects & dialogue details */}
                <div className="p-3 bg-[#0E1520]/45 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 uppercase">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Chủ thể & Hội thoại trong cảnh
                  </div>
                  <p className="text-xs text-slate-300"><strong className="text-slate-400">Diễn tả:</strong> {activeShot.storyBeat || 'Cơ mặt cử động tự nhiên.'}</p>
                  {activeShot.dialogue && (
                    <p className="text-xs italic text-cyan-400"><strong className="not-italic text-slate-400 font-bold">Thoại chính:</strong> "{activeShot.dialogue}"</p>
                  )}
                </div>
              </div>
            </div>

            {/* Prompt Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  CHỈ THỊ CÂU LỆNH ĐỘNG CAMERA & PHÂN CẢNH CHUYỂN HOÁ (VEO STACK PROMPT)
                </label>
                {activeShot.videoPrompt && (
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(`text_prompt_btn_${activeShot.id}`, activeShot.videoPrompt || '')}
                    className="text-[9px] font-mono hover:text-cyan-400 text-slate-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-slate-800/40 hover:bg-slate-800 border border-slate-705 border-slate-700 cursor-pointer"
                    title="Sao chép prompt"
                  >
                    {copiedStates[`text_prompt_btn_${activeShot.id}`] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        Đã chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Sao chép
                      </>
                    )}
                  </button>
                )}
              </div>
              <textarea
                value={activeShot.videoPrompt || ''}
                onChange={(e) => handleUpdateVideoPrompt(activeShot.id, e.target.value)}
                className="w-full h-24 p-3 font-mono text-xs text-[#F1F5F9] border border-slate-800 rounded-lg bg-[#111827] focus:outline-none focus:border-cyan-500"
                placeholder="Mô tả cụ thể động lực di chuyển vật lý của máy quay và hành động diễn ra trong 5 giây..."
              />
              <p className="text-[10px] text-cyan-500/85 leading-normal italic">
                * Nguyên tắc viết lệnh Veo: Mô tả chuyển động từ Start-Frame hất đi &rarr; Hành động nối dòng &Lôi sfx & Thoại &rarr; Cấm chèn tháp ảnh tĩnh hoặc watermark.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nav footer */}
      <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-300 hover:bg-[#1E293B]/80 hover:text-white transition-all cursor-pointer"
        >
          &larr; QUAY LẠI BƯỚC 7
        </button>

        <button
          onClick={() => onConfirm(localShots)}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          <span>TIẾP THEO: HOÀN THIỆN ÂM THANH & TRẠM HOÀ ÂM</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
