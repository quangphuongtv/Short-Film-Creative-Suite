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
import JSZip from 'jszip';

// @ts-ignore
import logoUrl from '../assets/Logo-PToonGo.png';

import { ProjectState, GlobalBrief, SceneBreakdownItem, KeyElement, StoryboardShot } from './types';
import { handleResponse } from './utils';
import { Film, Trash2, Github, HelpCircle, Save, FolderOpen, Video, AlertCircle, Lock, X, Key, CheckCircle2, Loader2, Eye, EyeOff, Copy, Download, Laptop, Terminal, ArrowDownToLine } from 'lucide-react';

const STORAGE_KEY = 'short_film_director_suite_state';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [highestStepReached, setHighestStepReached] = useState<number>(1);
  const [blockedStepInfo, setBlockedStepInfo] = useState<{ targetStep: number; missingPrereqs: { step: number; label: string; description: string }[] } | null>(null);

  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'empty' | 'verifying' | 'valid' | 'invalid'>('empty');
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  // Close key modal on hitting escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsApiKeyModalOpen(false);
        setIsCloneModalOpen(false);
      }
    };
    if (isApiKeyModalOpen || isCloneModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isApiKeyModalOpen]);

  // Load Gemini API Key status on launch
  useEffect(() => {
    const savedKey = localStorage.getItem('custom_gemini_api_key') || '';
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeyStatus('valid');
    } else {
      setApiKeyStatus('empty');
    }
  }, []);

  const handleSaveApiKey = (keyToSave: string) => {
    const trimmedKey = keyToSave.trim();
    if (!trimmedKey) {
      localStorage.removeItem('custom_gemini_api_key');
      setApiKey('');
      setApiKeyStatus('empty');
    } else {
      localStorage.setItem('custom_gemini_api_key', trimmedKey);
      setApiKey(trimmedKey);
      setApiKeyStatus('valid');
    }
    setIsApiKeyModalOpen(false);
  };

  const handleDownloadLocalJson = () => {
    try {
      const payload = {
        savedAt: new Date().toISOString(),
        currentStep,
        highestStepReached,
        globalBrief,
        scenes,
        keyElements,
        storyboard
      };
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const titleNormalized = (globalBrief?.title || "du_an")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .toLowerCase();
      a.download = `${titleNormalized}_local_state.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Downloader failed: ", err);
    }
  };

  const openApiKeyModal = () => {
    const savedKey = localStorage.getItem('custom_gemini_api_key') || '';
    setApiKey(savedKey);
    setIsApiKeyModalOpen(true);
  };

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
        if (parsed.keyElements) {
          const hydratedElements = parsed.keyElements.map((el: any) => {
            if (el.imageRef && !el.imageUrl) {
              return { ...el, imageUrl: el.imageRef };
            }
            return el;
          });
          setKeyElements(hydratedElements);
        }
        if (parsed.storyboard) {
          const hydratedStoryboard = parsed.storyboard.map((shot: any) => {
            if (shot.imageRef && !shot.startFrameUrl) {
              return { ...shot, startFrameUrl: shot.imageRef };
            }
            return shot;
          });
          setStoryboard(hydratedStoryboard);
        }
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
  };

  const handleLoadSavedProject = (savedData: any) => {
    if (!savedData) return;
    if (savedData.globalBrief) setGlobalBrief(savedData.globalBrief);
    if (savedData.scenes) setScenes(savedData.scenes);
    
    let loadedElements = savedData.keyElements || [];
    loadedElements = loadedElements.map((el: any) => {
      // Hydrate imageRef to imageUrl for runtime compat
      if (el.imageRef && !el.imageUrl) {
        return { ...el, imageUrl: el.imageRef };
      }
      return el;
    });
    setKeyElements(loadedElements);
    
    let loadedStoryboard = savedData.storyboard || [];
    loadedStoryboard = loadedStoryboard.map((shot: any) => {
      // Hydrate imageRef to startFrameUrl for runtime compat
      if (shot.imageRef && !shot.startFrameUrl) {
        return { ...shot, startFrameUrl: shot.imageRef };
      }
      return shot;
    });
    setStoryboard(loadedStoryboard);
    
    const targetStep = savedData.currentStep || 1;
    const highestStep = savedData.highestStepReached || targetStep;
    setCurrentStep(targetStep);
    setHighestStepReached(highestStep);
    
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentStep: targetStep,
          highestStepReached: highestStep,
          globalBrief: savedData.globalBrief,
          scenes: savedData.scenes,
          keyElements: loadedElements,
          storyboard: loadedStoryboard,
          isUsingFallback: false
        })
      );
    } catch (e) {
      console.warn('Could not save loaded state to localStorage:', e);
    }
  };
  
  // Convert Data URIs (Base64 PNG or Raw SVG code) into binary Blob data safely (resilient and asynchronous)
  const dataURLtoBlob = async (dataurl: string): Promise<Blob> => {
    try {
      const res = await fetch(dataurl);
      return await res.blob();
    } catch (fetchErr) {
      console.warn('Native fetch conversion of data URL failed, trying fallback manual parses:', fetchErr);
      const parts = dataurl.split(',');
      if (parts.length < 2) {
        return new Blob([], { type: 'image/png' });
      }
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const isBase64 = parts[0].indexOf('base64') >= 0;
      
      let payload = parts[1];
      try {
        payload = decodeURIComponent(payload);
      } catch (e) {
        // Safe ignore
      }

      if (isBase64) {
        // Clean any possible illegal characters and spaces from base64 string
        payload = payload.trim().replace(/\s/g, '').replace(/[^A-Za-z0-9+/=]/g, "");
        while (payload.length % 4 !== 0) {
          payload += '=';
        }
        try {
          const bstr = atob(payload);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new Blob([u8arr], { type: mime });
        } catch (bstrErr) {
          console.error('All decode attempts failed:', bstrErr);
          return new Blob([], { type: mime });
        }
      } else {
        return new Blob([payload], { type: mime });
      }
    }
  };

  // Rendering step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ScriptInput
            globalBrief={globalBrief}
            onScriptParsed={({ globalBrief: parsedBrief, scenes: parsedScenes, isFallback }) => {
              setGlobalBrief(parsedBrief);
              setScenes(parsedScenes);
              setIsUsingFallback(!!isFallback);
              // Clear subsequent arrays to ensure consistency with new script
              setKeyElements([]);
              setStoryboard([]);
              handleAdvanceStep(2, !!isFallback);
            }}
            onLoadSavedProject={handleLoadSavedProject}
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
      <header className="border-b border-[#1E293B] bg-[#0B0F19]/30 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-3">
          <img 
            src={logoUrl} 
            alt="PToonGo Logo" 
            className="h-[62px] w-auto object-contain pr-[30px] animate-blue-glow"
          />
          <div className="bg-gradient-to-tr from-cyan-600 to-indigo-600 p-2 rounded-lg text-white">
            <Film className="w-5 h-5 text-cyan-200 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold uppercase tracking-wider animate-gradient-text font-mono">
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

          {/* Saved layout integrity */}
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className={`p-1 px-3 rounded text-[10px] sm:text-xs font-bold font-mono flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer ${
              apiKey
                ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-100 border border-emerald-800/80 hover:border-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-none'
                : 'bg-red-600 hover:bg-red-700 text-white border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.55)] animate-pulse'
            }`}
            title="Cấu hình Gemini API Key cá nhân"
          >
            {apiKey ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Key className="w-3.5 h-3.5 text-red-100" />
            )}
            <span>{apiKey ? 'API Key: Đã lưu' : 'Nhập API Key'}</span>
          </button>

          {/* Clone App (Local Version) Button */}
          <button
            onClick={() => setIsCloneModalOpen(true)}
            className="p-1 px-3 bg-[#111827] hover:bg-[#1E1B4B] text-indigo-300 hover:text-indigo-200 border border-indigo-900/60 hover:border-indigo-500/80 text-[10px] sm:text-xs font-bold font-mono rounded flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] shadow-[0_4px_12px_rgba(79,70,229,0.05)]"
            title="Tải toàn bộ mã nguồn ứng dụng hỗ trợ chạy độc lập ngoại tuyến (Clone Local Version)"
          >
            <Laptop className="w-3.5 h-3.5 text-indigo-400" />
            <span>Clone App (Local)</span>
          </button>

          {/* Download Immediate State Backup JSON Button */}
          <button
            onClick={handleDownloadLocalJson}
            className="p-1 px-3 bg-[#1d140e] hover:bg-[#2c1a0e] text-orange-400 hover:text-orange-300 border border-orange-900/60 hover:border-orange-500 rounded text-[10px] sm:text-xs font-bold font-mono flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shadow-[0_4px_12px_rgba(249,115,22,0.1)]"
            title="Tải xuống ngay lập tức tập tin khôi phục .json đầy đủ tiến trình"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Lưu Khôi Phục (.json)</span>
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
          <p className="text-xs sm:text-sm font-extrabold uppercase animate-gradient-text tracking-wider mb-2">
            Copyright by NGUYEN QUANG PHUONG ®
          </p>
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





      {/* New API Key Input Modal */}
      {isApiKeyModalOpen && (
        <div 
          onClick={() => setIsApiKeyModalOpen(false)}
          className="fixed inset-0 bg-[#020617]/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] transition-all cursor-default animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0B0F19] border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative cursor-default"
          >
            {/* Absolute close button in top right */}
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 p-1.5 rounded-lg transition-all cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4 pr-6">
              <h3 className="text-base font-extrabold text-white tracking-wider flex items-center gap-2 uppercase font-mono">
                <span className="inline-block w-2.5 h-5 bg-cyan-500 rounded-sm"></span>
                CẤU HÌNH API KEY CÁ NHÂN
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono leading-relaxed">
                Nhập Gemini API Key cá nhân của bạn để sử dụng phục vụ nhu cầu xử lý kịch bản, âm thanh và hình ảnh của riêng bạn.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase font-mono mb-1.5 flex justify-between items-center">
                  <span>Gemini API Key</span>
                  {apiKey && (
                    <span className="text-[10px] text-slate-500 font-normal">
                      {apiKey.length} ký tự
                    </span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="Nhập API Key tại đây..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveApiKey(apiKey);
                      }
                    }}
                    className="w-full pl-3 pr-10 py-2.5 bg-[#111827] border border-slate-700 rounded-lg text-sm text-[#F1F5F9] font-mono focus:outline-none focus:border-cyan-500 placeholder-slate-600 transition-all focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 text-slate-400 hover:text-slate-200 p-1 focus:outline-none rounded transition-colors cursor-pointer"
                    title={showKey ? "Ẩn Key" : "Hiển thị Key"}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-4 py-2 bg-[#1E293B] hover:bg-[#334155] rounded-lg text-xs text-slate-300 font-medium transition-all cursor-pointer"
                >
                  Đóng
                </button>
                
                {localStorage.getItem('custom_gemini_api_key') && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('custom_gemini_api_key');
                      setApiKey('');
                      setApiKeyStatus('empty');
                      setIsApiKeyModalOpen(false);
                    }}
                    className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded-lg text-xs text-rose-300 font-medium transition-all cursor-pointer"
                  >
                    Xoá Key
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveApiKey(apiKey)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Lưu cấu hình
                </button>
              </div>

              <div className="text-[10px] text-slate-500 font-mono text-center pt-3 border-t border-slate-800/85 leading-relaxed">
                Key được lưu trữ an toàn trong LocalStorage của trình duyệt và không được chia sẻ với bất kỳ bên thứ ba nào.
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Clone App (Local Version) Modal */}
      {isCloneModalOpen && (
        <div 
          onClick={() => setIsCloneModalOpen(false)}
          className="fixed inset-0 bg-[#020617]/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] transition-all cursor-default animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0B0F19] border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative cursor-default font-sans text-slate-200"
          >
            {/* Absolute close button in top right */}
            <button
              type="button"
              onClick={() => setIsCloneModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 p-1.5 rounded-lg transition-all cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4 pr-6">
              <h3 className="text-base font-extrabold text-indigo-400 tracking-wider flex items-center gap-2 uppercase font-mono">
                <Laptop className="w-5 h-5 text-indigo-400 shrink-0" />
                CLONE APP & CHẠY LOCAL VERSION
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono leading-relaxed">
                Hướng dẫn chi tiết để tải mã nguồn ứng dụng và chạy độc lập, lưu trữ dữ liệu kịch bản không giới hạn ngay chính trên máy tính cục bộ của bạn.
              </p>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Step 1: Download code */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5 mb-1">
                  <span className="flex items-center justify-center w-4 h-4 bg-indigo-600 rounded-full text-[10px] text-white">1</span>
                  Tải Mã Nguồn ZIP từ AI Studio / GitHub
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans mb-2">
                  Bạn có thể xuất toàn bộ mã nguồn của dự án này thành file ZIP hoặc đồng bộ lên kho lưu trữ GitHub bằng cách sử dụng thanh menu cài đặt của Google AI Studio:
                </p>
                <div className="text-[10px] font-mono bg-black/40 p-2 rounded border border-slate-800 text-slate-300 leading-relaxed">
                  Settings Menu (Góc trên cùng bên phải) ⚙ ➔ Chọn <span className="text-indigo-400 font-bold">"Export to ZIP"</span> hoặc <span className="text-cyan-400 font-bold">"Export to GitHub"</span>
                </div>
              </div>

              {/* Step 2: Download State config */}
              <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5 mb-1">
                  <span className="flex items-center justify-center w-4 h-4 bg-indigo-600 rounded-full text-[10px] text-white">2</span>
                  Xuất Tiến Trình Kịch Bản Hiện Tại (.json)
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans mb-3">
                  Tải xuống file dữ liệu <span className="font-mono text-cyan-400 font-bold">.json</span> lưu giữ toàn bộ tiến trình hiện có (Global Brief, các phân cảnh, nhân vật/bối cảnh, hình ảnh storyboard và cấu trúc âm nhạc) để khôi phục nhanh chóng sau này:
                </p>
                <button
                  type="button"
                  onClick={handleDownloadLocalJson}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-xs text-white font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(79,70,229,0.2)]"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Tải Dữ Liệu Cấu Thiết Bị (.json Backup)
                </button>
              </div>

              {/* Step 3: Local commands */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5 mb-1.5">
                  <span className="flex items-center justify-center w-4 h-4 bg-indigo-600 rounded-full text-[10px] text-white">3</span>
                  Các Lệnh Khởi Chạy Cục Bộ (Terminal)
                </h4>
                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block"># A. Cài đặt các thư viện liên quan:</span>
                    <pre className="p-1 px-2 mt-1 bg-black/40 rounded border border-slate-800 font-mono text-cyan-400 select-all cursor-pointer">npm install</pre>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block"># B. Cấu hình khóa API trong tập tin .env:</span>
                    <pre className="p-1 px-2 mt-1 bg-black/40 rounded border border-slate-800 font-mono text-amber-400 select-all cursor-pointer">GEMINI_API_KEY=AIzaSy...</pre>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block"># C. Khởi chạy máy chủ phát triển cục bộ:</span>
                    <pre className="p-1 px-2 mt-1 bg-black/40 rounded border border-slate-800 font-mono text-emerald-400 select-all cursor-pointer">npm run dev</pre>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(false)}
                  className="px-4 py-2 bg-[#1E293B] hover:bg-[#334155] rounded-lg text-xs text-slate-300 font-medium transition-all cursor-pointer font-mono"
                >
                  Đóng Hướng Dẫn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


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
