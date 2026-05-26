import React, { useState } from 'react';
import { DEFAULT_SCRIPTS, DefaultScript } from '../defaultData';
import { ProjectState, GlobalBrief } from '../types';
import { handleResponse } from '../utils';
import { Sparkles, ArrowRight, Video, Languages, HelpCircle } from 'lucide-react';

interface ScriptInputProps {
  onScriptParsed: (parsedData: { globalBrief: GlobalBrief; scenes: any[]; isFallback?: boolean }) => void;
}

export default function ScriptInput({ onScriptParsed }: ScriptInputProps) {
  const [scriptText, setScriptText] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [visualStyle, setVisualStyle] = useState('3D Pixar');
  const [language, setLanguage] = useState('English');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectPreset = (preset: DefaultScript) => {
    setScriptText(preset.scriptText);
    setError(null);
  };

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
          title: data.title || 'Phim Ngắn Chưa Đặt Tên',
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
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-lg font-extrabold text-white tracking-wide uppercase font-mono flex items-center gap-2">
          <span className="inline-block w-2.5 h-6 bg-cyan-500 rounded-sm"></span>
          HỒ SƠ KHỞI TẠO DỰ ÁN (GLOBAL BRIEF)
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          BƯỚC 1: Cung cấp kịch bản hoặc dàn ý câu chuyện để AI phân tách phân cảnh.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Script input */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nội dung kịch bản phim nhắn / Dàn ý hội thoại
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
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Hoặc trải nghiệm nhanh với các Kịch bản mẫu bên dưới:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_SCRIPTS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  className="p-3 text-left border border-slate-800 bg-[#0F1722]/50 rounded-lg hover:bg-[#1E293B]/60 hover:border-cyan-800 transition-all cursor-pointer group"
                >
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {preset.title}
                  </h4>
                  <p className="text-[10px] text-cyan-400/80 font-mono mt-1">{preset.genre}</p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{preset.brief}</p>
                </button>
              ))}
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
