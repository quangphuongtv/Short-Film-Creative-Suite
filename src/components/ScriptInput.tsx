import React, { useState } from 'react';
import { DEFAULT_SCRIPTS, DefaultScript } from '../defaultData';
import { ProjectState, GlobalBrief } from '../types';
import { handleResponse } from '../utils';
import { SAVED_PROJECT_DATA } from '../data';
import { Sparkles, ArrowRight, Video, Languages, HelpCircle, Save, Upload } from 'lucide-react';

interface ScriptInputProps {
  onScriptParsed: (parsedData: { globalBrief: GlobalBrief; scenes: any[]; isFallback?: boolean }) => void;
  onLoadSavedProject?: (savedData: any) => void;
}

export default function ScriptInput({ onScriptParsed, onLoadSavedProject }: ScriptInputProps) {
  const [projectTitle, setProjectTitle] = useState(() => {
    if (SAVED_PROJECT_DATA && typeof SAVED_PROJECT_DATA === 'object' && (SAVED_PROJECT_DATA as any).globalBrief?.title) {
      return (SAVED_PROJECT_DATA as any).globalBrief.title;
    }
    return '';
  });
  const [scriptText, setScriptText] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [visualStyle, setVisualStyle] = useState('3D Pixar');
  const [language, setLanguage] = useState('English');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedStoryboards, setSavedStoryboards] = useState<{ fileName: string; project: any }[]>([]);

  React.useEffect(() => {
    let active = true;
    const fetchSavedStoryboards = async (retries = 3, delay = 1000) => {
      try {
        const res = await fetch('/api/saved-storyboards');
        const data = await handleResponse<{ storyboards: any[] }>(res);
        if (active && data && Array.isArray(data.storyboards)) {
          setSavedStoryboards(data.storyboards);
        }
      } catch (err: any) {
        if (retries > 0) {
          console.warn(`Saved storyboards fetch failed, retrying in ${delay}ms... (Retries left: ${retries - 1})`, err);
          setTimeout(() => {
            if (active) fetchSavedStoryboards(retries - 1, delay * 2);
          }, delay);
        } else {
          console.error("Error loading saved storyboards from src/storyboards/", err);
        }
      }
    };

    fetchSavedStoryboards();
    return () => {
      active = false;
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const startIndex = content.indexOf('{');
        const endIndex = content.lastIndexOf('}');
        if (startIndex === -1 || endIndex === -1) {
          throw new Error("Không tìm thấy dữ liệu kịch bản hợp lệ trong file .ts. Vui lòng chọn đúng file .ts đã xuất.");
        }
        const rawObjStr = content.substring(startIndex, endIndex + 1);
        const data = new Function(`return (${rawObjStr})`)();
        
        if (data && typeof data === 'object' && data.globalBrief) {
          if (onLoadSavedProject) {
            onLoadSavedProject(data);
          }
          setError(null);
        } else {
          throw new Error("Cấu trúc file không đúng định dạng SAVED_PROJECT_DATA.");
        }
      } catch (err: any) {
        console.error(err);
        setError(`Lỗi mở file kịch bản: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const selectPreset = (preset: DefaultScript & { isSavedProject?: boolean; projectData?: any }) => {
    if (preset.isSavedProject && preset.projectData) {
      if (onLoadSavedProject) {
        onLoadSavedProject(preset.projectData);
      }
      return;
    }
    setScriptText(preset.scriptText);
    if (preset.title) {
      setProjectTitle(preset.title);
    }
    setError(null);
  };

  const allScripts: any[] = [];

  // 1. Fallback static SAVED_PROJECT_DATA first if it exists, designating it as the absolute primary restore card
  const hasSavedData = SAVED_PROJECT_DATA && typeof SAVED_PROJECT_DATA === 'object' && (SAVED_PROJECT_DATA as any).globalBrief?.title;
  if (hasSavedData) {
    const mainTitle = (SAVED_PROJECT_DATA as any).globalBrief.title;
    allScripts.push({
      id: "saved_project",
      title: `(Bản lưu hệ thống 💾) ${mainTitle}`,
      genre: (SAVED_PROJECT_DATA as any).globalBrief.genre || '3D Animation',
      brief: "Một cú nhấp chuột khôi phục trọn vẹn toàn bộ tiến trình, kịch bản, bối cảnh, thực thể và storyboard cũ từ data.ts.",
      scriptText: (SAVED_PROJECT_DATA as any).globalBrief.scriptText || '',
      isSavedProject: true,
      projectData: SAVED_PROJECT_DATA
    });
  }

  // 2. Add all system storyboards from the dynamically loaded array, avoiding duplication of the primary restore card
  savedStoryboards.forEach((item, index) => {
    if (hasSavedData && item.project?.globalBrief?.title === (SAVED_PROJECT_DATA as any).globalBrief.title) {
      return; // Skip duplicate showing since we already added it at the absolute top
    }
    allScripts.push({
      id: `system_saved_${item.fileName}_${index}`,
      title: `(Bản lưu hệ thống 💾) ${item.project.globalBrief?.title || item.fileName.replace('.ts', '')}`,
      genre: item.project.globalBrief?.genre || '3D Animation',
      brief: `Một cú nhấp chuột khôi phục trọn vẹn toàn bộ tiến trình, kịch bản, bối cảnh, thực thể và storyboard cũ từ /src/storyboards/${item.fileName}.`,
      scriptText: item.project.globalBrief?.scriptText || '',
      isSavedProject: true,
      projectData: item.project
    });
  });

  // 3. Add default preset templates
  allScripts.push(...DEFAULT_SCRIPTS);

  const handleParse = async () => {
    if (!scriptText.trim()) {
      setError('Vui lòng nhập kịch bản hoặc chọn một kịch bản mẫu từ danh sách bên dưới.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const customKey = localStorage.getItem('custom_gemini_api_key') || '';
      const response = await fetch('/api/parse-script', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': customKey
        },
        body: JSON.stringify({
          scriptText,
          settings: {
            aspectRatio,
            visualStyle,
            language
          }
        })
      });

      const data = await handleResponse<any>(response);

      onScriptParsed({
        globalBrief: {
          title: projectTitle.trim() || data.title || 'Phim Ngắn Chưa Đặt Tên',
          genre: data.genre || 'Drama',
          aspectRatio: data.aspectRatio || aspectRatio,
          visualStyle: data.visualStyle || visualStyle,
          language: data.language || language,
          scriptText
        },
        scenes: (data.scenes || []).map((s: any, idx: number) => ({
          ...s,
          id: s.id || `Scene_${s.sequenceOrder || idx + 1}`
        })),
        isFallback: !!data.isFallback
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra sự cố khi phân tích kịch bản của bạn.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="bg-[#0B0F19] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6">
      <div className="border-b border-slate-800 pb-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-wide uppercase font-mono flex items-center gap-2">
            <span className="inline-block w-2.5 h-6 bg-cyan-500 rounded-sm"></span>
            HỒ SƠ KHỞI TẠO DỰ ÁN (GLOBAL BRIEF)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            BƯỚC 1: Cung cấp kịch bản hoặc dàn ý câu chuyện để AI phân tách phân cảnh.
          </p>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 py-2 px-4 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-100 border border-emerald-800/80 hover:border-emerald-700 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Upload className="w-4 h-4" />
            <span>Tải Kịch bản (.ts)</span>
            <input
              type="file"
              accept=".ts,.js,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Script input */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Tên dự án (Project Name)
            </label>
            <input
              type="text"
              className="w-full p-2.5 bg-[#111827] border border-slate-700 rounded-lg font-sans text-sm text-[#F1F5F9] placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="Nhập tên dự án hoặc tên phim của bạn (Ví dụ: Chuyến tàu cuối cùng)..."
              value={projectTitle}
              onChange={(e) => {
                setProjectTitle(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nội dung kịch bản phim ngắn / Dàn ý hội thoại
            </label>
            <textarea
              className="w-full h-80 p-4 bg-[#111827] border border-slate-705 border-slate-700 rounded-lg font-sans text-sm text-[#F1F5F9] placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none transition-all"
              placeholder="Nhập kịch bản phim của bạn ở đây... Có thể nhập bằng tiếng Việt hoặc tiếng Anh. AI sẽ hỗ trợ phân rã phân cảnh tối ưu 5s cực nét."
              value={scriptText}
              onChange={(e) => {
                setScriptText(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          {/* Preset templates */}
          <div>
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
              Hoặc trải nghiệm nhanh với các Kịch bản mẫu bên dưới:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allScripts.map((preset) => {
                const isSaved = (preset as any).isSavedProject;
                return (
                   <button
                    type="button"
                    key={preset.id}
                    onClick={() => selectPreset(preset)}
                    className={`p-4 text-left border rounded-lg transition-all cursor-pointer group relative overflow-hidden ${
                      isSaved
                        ? 'border-emerald-500/80 bg-emerald-950/20 bg-[repeating-linear-gradient(45deg,rgba(16,185,129,0.06),rgba(16,185,129,0.06)_3px,transparent_3px,transparent_9px)] hover:bg-emerald-950/30 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'border-slate-800 bg-[#0F1722]/50 hover:bg-[#1E293B]/60 hover:border-cyan-800'
                    }`}
                  >
                    <h4 className={`text-xs font-bold transition-colors ${
                      isSaved ? 'text-emerald-300 group-hover:text-emerald-100 font-mono tracking-wide' : 'text-slate-200 group-hover:text-cyan-400'
                    }`}>
                      {preset.title}
                    </h4>
                    <p className={`text-[10px] font-mono mt-1 ${isSaved ? 'text-emerald-400 font-bold uppercase tracking-wider' : 'text-cyan-400/80'}`}>
                      {preset.genre}
                    </p>
                    <p className={`text-[11px] mt-1.5 line-clamp-2 ${isSaved ? 'text-emerald-200/80' : 'text-slate-400'}`}>
                      {preset.brief}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right col: Settings parameters */}
        <div className="p-4 bg-[#0F1722] border border-slate-800 rounded-lg space-y-4 h-fit relative">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-700/60 pb-2">
            THÔNG SỐ QUAY & ĐIỆN ẢNH (DIRECTOR SETTINGS)
          </h3>

          {/* Aspect ratio selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
              TỶ LỆ KHUNG HÌNH (ASPECT RATIO)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {['16:9', '9:16', '1:1'].map((ratio) => (
                <button
                  type="button"
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 text-xs font-mono font-bold rounded border transition-all cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                      : 'bg-[#111827] border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {ratio} {ratio === '16:9' ? '🎬' : ratio === '9:16' ? '📱' : '⏹️'}
                </button>
              ))}
            </div>
          </div>

          {/* Visual style selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
              PHONG CÁCH MỸ THUẬT (VISUAL STYLE)
            </label>
            <select
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value)}
              className="w-full p-2 text-xs bg-[#111827] border border-slate-700 text-slate-200 rounded font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="3D Pixar">3D Pixar (Hoạt hình 3D phong cách Pixar)</option>
              <option value="3D Animation">3D Animation (Phim hoạt hình 3D hiện đại)</option>
              <option value="Realistic">Realistic (Tả thực chi tiết phóng đại)</option>
              <option value="Cinematic">Cinematic (Điện ảnh hoành tráng)</option>
              <option value="Cyberpunk">Cyberpunk (Tương lai viễn tưởng u tối)</option>
              <option value="Neo-Noir Noir">Neo-Noir (Ánh sáng tương phản cực cao)</option>
              <option value="Warm Indie Film">Warm Indie Film (Ấm áp, mộc mạc hoài cổ)</option>
              <option value="Anime Ghibli Style">Anime Ghibli Style (Mịn màng, hoạt họa nghệ thuật)</option>
              <option value="Sketch Storyboard Pencil">Sketch Storyboard (Nét vẽ chì điện ảnh)</option>
            </select>
          </div>

          {/* Language selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 font-bold font-mono">
              NGÔN NGỮ ĐẦU RA (OUTPUT LANGUAGE)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {['English', 'Tiếng Việt'].map((lang) => (
                <button
                  type="button"
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`py-2 text-xs font-mono font-bold rounded border transition-all cursor-pointer ${
                    language === lang
                      ? 'bg-cyan-600 border-cyan-500 text-white'
                      : 'bg-[#111827] border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Enforce 5-second indicator box */}
          <div className="p-3 bg-cyan-950/40 border border-cyan-800/55 rounded text-[11px] text-cyan-300 space-y-1">
            <p className="font-bold flex items-center gap-1">
              ⚠️ QUY TẮC PHÂN CẢNH 5S (5-SEC CEILING)
            </p>
            <p className="leading-normal">
              Hệ thống sẽ tự động tách kịch bản của bạn thành các hành động liên tục không quá 5 giây mỗi cảnh, giữ nhịp độ điện ảnh dồn dập nhất.
            </p>
          </div>

          {/* Action trigger button */}
          <button
            type="button"
            disabled={isParsing}
            onClick={handleParse}
            className={`w-full py-3 px-4 rounded-lg font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              isParsing
                ? 'bg-slate-800 text-slate-500 cursor-wait'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-600 hover:to-indigo-700 active:scale-[0.99] shadow-[0_0_15px_rgba(6,182,212,0.2)]'
            }`}
          >
            {isParsing ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-t-transparent border-slate-500" />
                <span>Đang phân tách kịch bản...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Khởi Chạy & Phân Tách AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs font-mono text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
