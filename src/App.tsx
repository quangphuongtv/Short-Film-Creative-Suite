import React, { useState, useEffect } from 'react';
import ProjectProgress from './components/ProjectProgress';
import ScriptInput from './components/ScriptInput';
import SceneBreakdown from './components/SceneBreakdown';
import KeyElements from './components/KeyElements';
import StoryboardDesigner from './components/StoryboardDesigner';
import MediaGeneratorPrompts from './components/MediaGeneratorPrompts';
import ElementImagesReview from './components/ElementImagesReview';
import StartFrameImageReview from './components/StartFrameImageReview';
import VideoPromptsReview from './components/VideoPromptsReview';
import AudioComposer from './components/AudioComposer';

import { ProjectState, GlobalBrief, SceneBreakdownItem, KeyElement, StoryboardShot } from './types';
import { handleResponse } from './utils';
import { Film, Trash2, Github, HelpCircle, Save, FolderOpen, Video, AlertCircle, Lock, X } from 'lucide-react';

const STORAGE_KEY = 'short_film_director_suite_state';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [highestStepReached, setHighestStepReached] = useState<number>(1);
  const [blockedStepInfo, setBlockedStepInfo] = useState<{ targetStep: number; missingPrereqs: { step: number; label: string; description: string }[] } | null>(null);

  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  const [globalBrief, setGlobalBrief] = useState<GlobalBrief>({
    title: '',
    genre: '',
    aspectRatio: '16:9',
    visualStyle: '3D Pixar',
    language: 'English',
    scriptText: ''
  });

  const [scenes, setScenes] = useState<SceneBreakdownItem[]>([]);
  const [keyElements, setKeyElements] = useState<KeyElement[]>([]);
  const [storyboard, setStoryboard] = useState<StoryboardShot[]>([]);

  // Load from local storage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.globalBrief) setGlobalBrief(parsed.globalBrief);
        if (parsed.scenes) setScenes(parsed.scenes);
        if (parsed.keyElements) setKeyElements(parsed.keyElements);
        if (parsed.storyboard) setStoryboard(parsed.storyboard);
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
          setHighestStepReached(parsed.highestStepReached || parsed.currentStep);
        }
        if (parsed.isUsingFallback) {
          setIsUsingFallback(parsed.isUsingFallback);
        }
      }
    } catch (e) {
      console.warn('Could not read project state from localStorage:', e);
    }
  }, []);



  // Save to local storage automatically
  const saveStateToStorage = (stepUpdate?: number, highestUpdate?: number, fallbackUpdate?: boolean) => {
    const nextStep = stepUpdate ?? currentStep;
    const nextHighest = highestUpdate ?? highestStepReached;
    const nextFallback = fallbackUpdate !== undefined ? fallbackUpdate : isUsingFallback;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentStep: nextStep,
          highestStepReached: nextHighest,
          globalBrief,
          scenes,
          keyElements,
          storyboard,
          isUsingFallback: nextFallback
        })
      );
    } catch (e) {
      console.warn('Could not save project state to localStorage:', e);
    }
  };

  const checkStepPrerequisitesStatus = (targetStep: number): { allowed: boolean; missingPrereqs: { step: number; label: string; description: string }[] } => {
    const missing: { step: number; label: string; description: string }[] = [];

    const isStep1Done = globalBrief.title?.trim() !== '' && globalBrief.scriptText?.trim() !== '';
    const isStep2Done = scenes.length > 0;
    const isStep3Done = keyElements.length > 0;
    const isStep4Done = storyboard.length > 0;
    const isStep5Done = keyElements.length > 0 && keyElements.some(el => typeof el.imagePrompt === 'string' && el.imagePrompt.trim().length > 0);
    const isStep6Done = keyElements.length > 0 && keyElements.some(el => typeof el.imageUrl === 'string' && el.imageUrl.trim().length > 0);
    const isStep7Done = storyboard.length > 0 && storyboard.some(shot => (typeof shot.startFramePrompt === 'string' && shot.startFramePrompt.trim().length > 0) || (typeof shot.startFrameUrl === 'string' && shot.startFrameUrl.trim().length > 0));

    const stepDetails: { [key: number]: { label: string; description: string } } = {
      1: { label: 'Phase 01: Global Brief', description: 'Nạp kịch bản phim và thông tin tổng quan' },
      2: { label: 'Phase 02: Scene Breakdown', description: 'Phân rã kịch bản thành các cảnh ≤ 5 giây' },
      3: { label: 'Phase 03: Key Elements', description: 'Xác minh danh sách nhân vật, bối cảnh và đạo cụ' },
      4: { label: 'Phase 04: Storyboard', description: 'Dàn dựng bố cục phân cảnh và hội thoại' },
      5: { label: 'Phase 05: Image Prompts', description: 'Biên soạn câu lệnh mô tả hình ảnh cho nhân vật, bối cảnh' },
      6: { label: 'Phase 06: Element Images', description: 'Kích hoạt / tạo hình ảnh tham chiếu nhân vật/bối cảnh' },
      7: { label: 'Phase 07: Start-Frame Image', description: 'Thiết lập mô tả hoặc sinh ảnh khung hình khởi đầu (Start-Frame)' },
      8: { label: 'Phase 08: Video Prompts', description: 'Biên tập câu lệnh chuyển động (Motion Stack) cho luồng video' },
    };

    const dependencies: { [key: number]: number[] } = {
      2: [1],
      3: [2],
      4: [3],
      5: [4],
      6: [5],
      7: [4, 5, 6],
      8: [4, 5, 7],
      9: [5, 6, 7]
    };

    const reqs = dependencies[targetStep] || [];
    for (const req of reqs) {
      let isCompleted = false;
      if (req === 1) isCompleted = isStep1Done;
      else if (req === 2) isCompleted = isStep2Done;
      else if (req === 3) isCompleted = isStep3Done;
      else if (req === 4) isCompleted = isStep4Done;
      else if (req === 5) isCompleted = isStep5Done;
      else if (req === 6) isCompleted = isStep6Done;
      else if (req === 7) isCompleted = isStep7Done;

      if (!isCompleted) {
        missing.push({
          step: req,
          label: stepDetails[req]?.label || `Phase 0${req}`,
          description: stepDetails[req]?.description || 'Chưa hoàn tất nội dung'
        });
      }
    }

    return {
      allowed: missing.length === 0,
      missingPrereqs: missing
    };
  };

  const isStepSelectable = (stepNum: number): boolean => {
    return true;
  };

  const handleStepChange = (targetStep: number) => {
    setCurrentStep(targetStep);
    const nextHighest = Math.max(highestStepReached, targetStep);
    setHighestStepReached(nextHighest);
    saveStateToStorage(targetStep, nextHighest);
  };

  const handleAdvanceStep = (nextStep: number, fallbackUpdate?: boolean) => {
    setCurrentStep(nextStep);
    const updatedHighest = Math.max(highestStepReached, nextStep);
    setHighestStepReached(updatedHighest);
    saveStateToStorage(nextStep, updatedHighest, fallbackUpdate);
  };

  const handleClearProject = () => {
    if (confirm('Bạn có chắc chắn muốn huỷ các bước đang làm, xoá trống phần nội dung trong các mục đã phát sinh và quay trở về bước đầu tiên (Phase 01 Global Brief)?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGlobalBrief({
        title: '',
        genre: '',
        aspectRatio: '16:9',
        visualStyle: '3D Pixar',
        language: 'English',
        scriptText: ''
      });
      setScenes([]);
      setKeyElements([]);
      setStoryboard([]);
      setIsUsingFallback(false);
      setCurrentStep(1);
      setHighestStepReached(1);
    }
  };

  // Rendering step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ScriptInput
            onScriptParsed={({ globalBrief: parsedBrief, scenes: parsedScenes, isFallback }) => {
              setGlobalBrief(parsedBrief);
              setScenes(parsedScenes);
              setIsUsingFallback(!!isFallback);
              // Clear subsequent arrays to ensure consistency with new script
              setKeyElements([]);
              setStoryboard([]);
              handleAdvanceStep(2, !!isFallback);
            }}
          />
        );
      case 2:
        return (
          <SceneBreakdown
            initialScenes={scenes}
            onConfirm={(confirmedScenes) => {
              setScenes(confirmedScenes);
              handleAdvanceStep(3);
            }}
            onBack={() => handleStepChange(1)}
          />
        );
      case 3:
        return (
          <KeyElements
            globalBrief={globalBrief}
            scenes={scenes}
            initialElements={keyElements}
            onConfirm={(approvedElements) => {
              setKeyElements(approvedElements);
              handleAdvanceStep(4);
            }}
            onBack={() => handleStepChange(2)}
          />
        );
      case 4:
        return (
          <StoryboardDesigner
            globalBrief={globalBrief}
            scenes={scenes}
            keyElements={keyElements}
            initialShots={storyboard}
            onConfirm={(approvedStoryboard) => {
              setStoryboard(approvedStoryboard);
              handleAdvanceStep(5);
            }}
            onBack={() => handleStepChange(3)}
          />
        );
      case 5:
        return (
          <MediaGeneratorPrompts
            globalBrief={globalBrief}
            elements={keyElements}
            onConfirm={(updatedElements) => {
              setKeyElements(updatedElements);
              handleAdvanceStep(6);
            }}
            onBack={() => handleStepChange(4)}
          />
        );
      case 6:
        return (
          <ElementImagesReview
            globalBrief={globalBrief}
            elements={keyElements}
            onConfirm={(updatedElements) => {
              setKeyElements(updatedElements);
              handleAdvanceStep(7);
            }}
            onBack={() => handleStepChange(5)}
          />
        );
      case 7:
        return (
          <StartFrameImageReview
            globalBrief={globalBrief}
            shots={storyboard}
            keyElements={keyElements}
            onConfirm={(updatedStoryboard) => {
              setStoryboard(updatedStoryboard);
              handleAdvanceStep(8);
            }}
            onBack={() => handleStepChange(6)}
          />
        );
      case 8:
        return (
          <VideoPromptsReview
            shots={storyboard}
            keyElements={keyElements}
            onConfirm={(updatedStoryboard) => {
              setStoryboard(updatedStoryboard);
              handleAdvanceStep(9);
            }}
            onBack={() => handleStepChange(7)}
          />
        );
      case 9:
        return (
          <AudioComposer
            globalBrief={globalBrief}
            shots={storyboard}
            keyElements={keyElements}
            onBack={() => handleStepChange(8)}
            onRestart={handleClearProject}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#F1F5F9] font-sans selection:bg-cyan-950 selection:text-cyan-300 flex flex-col">
      {/* Top Navigation & Status Branding */}
      <header className="border-b border-[#1E293B] bg-[#0B0F19] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-cyan-600 to-indigo-600 p-2 rounded-lg text-white">
            <Film className="w-5 h-5 text-cyan-200 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold uppercase tracking-wider text-[#F1F5F9] font-mono">
              Short Film Creative Suite
            </h1>
            <p className="text-[10px] text-cyan-400 font-mono font-bold leading-none mt-0.5">
              SCRIPT-TO-STORYBOARD PRE-PRODUCTION STUDIO
            </p>
          </div>
        </div>

        {/* Global actions and project metadata */}
        <div className="flex items-center space-x-3 font-mono">
          {globalBrief.title ? (
            <span className="hidden md:inline-block text-[11px] bg-[#111827] border border-cyan-800/60 text-cyan-400 py-1 px-3 rounded font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              🎬 ĐANG BIÊN SOẠN: {globalBrief.title.toUpperCase()}
            </span>
          ) : (
            <span className="hidden md:inline-block text-[11px] bg-[#111827] border border-dashed border-slate-800 text-slate-500 py-1 px-3 rounded">
              CHỜ NẠP KỊCH BẢN...
            </span>
          )}

          <button
            onClick={() => saveStateToStorage()}
            className="p-1 px-3 bg-[#161D30] hover:bg-[#202E4E] border border-slate-700 text-[10px] text-slate-200 font-bold rounded flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
            title="Lưu tiến trình hiện tại"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            Lưu nháp
          </button>

          <button
            onClick={handleClearProject}
            className="p-1 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-900/80 hover:border-red-600 text-[10px] sm:text-xs text-red-300 font-bold rounded flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            title="Khởi tạo kịch bản mới, đưa app về trạng thái ban đầu"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            Khởi tạo kịch bản mới
          </button>
        </div>
      </header>

      {/* Progressive wizard step pipeline */}
      <ProjectProgress
        currentStep={currentStep}
        highestStepReached={highestStepReached}
        onStepChange={handleStepChange}
        isStepSelectable={isStepSelectable}
      />

      {/* Warning/Fallback notification banners */}
      {isUsingFallback && (
        <div className="mx-6 mt-6 p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl text-xs text-amber-300 font-mono flex items-start gap-3 shadow-lg animate-fade-in">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold uppercase tracking-wider text-amber-400">
              <span>⚠ CHẾ ĐỘ NGOẠI TUYẾN PHỤC HỒI ĐANG HOẠT ĐỘNG (OFFLINE ENGINE RUNNING)</span>
            </p>
            <p className="leading-relaxed text-slate-300">
              API mặc định của dự án đã chạm hạn mức chi tiêu hàng tháng trên Google AI Studio. 
              Bộ tách khung hình 5s tự động, bồi đắp nhân vật, bối cảnh, đạo cụ của chúng tôi đang chạy trên <strong>Động cơ Mô phỏng Điện ảnh Ngoại tuyến (Offline Suite Engine)</strong> nhằm đảm bảo trải nghiệm kịch bản không bị ngắt quãng.
            </p>
          </div>
        </div>
      )}

      {/* Main Workspace Frame container */}
      <main className="w-full px-4 sm:px-6 py-8 flex flex-col flex-1">
        {renderStepContent()}
      </main>

      {/* Micro layout details matching professional typography and منفی space guides */}
      <footer className="py-8 bg-transparent text-center text-[11px] font-mono text-slate-500 mt-auto">
        <div className="w-full border-t border-[#1E293B] pt-6 px-6">
          <p className="tracking-widest">
            PRE-PRODUCTION STUDIO &copy; 2026 ● POWERED BY GEMINI 3.5 FLASH SERIES
          </p>
          <p className="mt-1 flex justify-center items-center gap-1.5 text-slate-600">
            <span className="text-cyan-500 font-bold">STABLE CONTINUITY</span>
            <span>|</span>
            <span className="text-cyan-500 font-bold font-mono">CAPPED 5-SEC CEILING</span>
            <span>|</span>
            <span className="text-cyan-500 font-bold">AUDIO MULTI-LAYERS</span>
          </p>
        </div>
      </footer>



      {/* Prerequisite Block Warning Modal dialog */}
      {blockedStepInfo && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center p-4 z-[10000] transition-all animate-fade-in animate-duration-200">
          <div className="bg-[#0B0F19] border border-red-900/60 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setBlockedStepInfo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 flex items-start gap-3">
              <div className="p-2 bg-red-950/50 rounded-lg border border-red-800/60 text-red-400 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-wider uppercase font-mono">
                  PHASE ĐANG BỊ KHOÁ (PREREQUISITES UNMET)
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
                  Bạn đang cố gắng truy cập bước tiếp theo nhưng một số dữ liệu kịch bản cốt lõi ở các bước trước chưa được sinh hoặc cấu hình đầy đủ.
                </p>
              </div>
            </div>

            <div className="space-y-3 my-4">
              <p className="text-xs font-bold text-red-400 font-mono uppercase tracking-wide">
                Các bước bắt buộc chưa hoàn thành:
              </p>
              
              <div className="divide-y divide-slate-800 bg-[#0F1722]/60 rounded-lg border border-slate-800 overflow-hidden">
                {blockedStepInfo.missingPrereqs.map((prereq) => (
                  <div key={prereq.step} className="p-3 text-xs font-mono space-y-1">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <span className="inline-block w-1.5 h-3 bg-cyan-500 rounded-sm"></span>
                      {prereq.label}
                    </div>
                    <p className="text-slate-400 pl-3.5 leading-relaxed">
                      {prereq.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-lg text-xs text-amber-300 font-mono leading-relaxed mb-5">
              💡 <strong>Lời khuyên:</strong> Hãy bấm nút Tiến hành/Xác nhận ở góc dưới cùng của các bước bị thiếu nêu trên để hệ thống ghi nhận và lưu dữ liệu trước khi di chuyển tới các khâu thiết lập kế tiếp.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setBlockedStepInfo(null)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-900 to-rose-900 border border-red-700 hover:from-red-800 hover:to-rose-800 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                Tôi Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
