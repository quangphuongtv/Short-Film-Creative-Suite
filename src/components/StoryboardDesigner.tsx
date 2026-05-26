import React, { useState, useEffect } from 'react';
import { StoryboardShot, KeyElement, GlobalBrief, SceneBreakdownItem } from '../types';
import { handleResponse } from '../utils';
import { Sparkles, Trash2, Plus, Film, Volume2, Camera, ChevronRight, HelpCircle, ArrowLeft } from 'lucide-react';

interface StoryboardDesignerProps {
  globalBrief: GlobalBrief;
  scenes: SceneBreakdownItem[];
  keyElements: KeyElement[];
  initialShots: StoryboardShot[];
  onConfirm: (shots: StoryboardShot[]) => void;
  onBack: () => void;
}

export default function StoryboardDesigner({ globalBrief, scenes, keyElements, initialShots, onConfirm, onBack }: StoryboardDesignerProps) {
  const [shots, setShots] = useState<StoryboardShot[]>(() => {
    const ids = new Set<string>();
    return initialShots.map((shot, idx) => {
      let uniqueId = shot.id || `Shot_${String(idx + 1).padStart(2, '0')}`;
      let counter = 1;
      while (ids.has(uniqueId)) {
        uniqueId = `${shot.id || 'Shot'}_${counter}`;
        counter++;
      }
      ids.add(uniqueId);
      return { ...shot, id: uniqueId };
    });
  });
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locations = keyElements.filter(e => e.type === 'location');
  const characters = keyElements.filter(e => e.type === 'character');

  // Trigger storyboard drafting of shots if initially empty
  useEffect(() => {
    if (shots.length === 0) {
      handleDraftStoryboard();
    }
  }, []);

  const handleDraftStoryboard = async () => {
    setIsDrafting(true);
    setError(null);
    try {
      const customKey = localStorage.getItem('custom_gemini_api_key') || '';
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': customKey
        },
        body: JSON.stringify({ brief: globalBrief, scenes, keyElements })
      });

      const data = await handleResponse<{ shots: StoryboardShot[] }>(response);

      setShots(data.shots || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Hệ thống AI bận rộn. Đang thiết lập kịch bản Storyboard dự phòng...');
      
      // Setup elegant default storyboard matching the parsed scenes if the API call fails
      const backupShots: StoryboardShot[] = scenes.map((sc, index) => {
        const matchingLoc = locations[0]?.id || 'Element_Location_Default';
        const matchingChars = characters.length > 0 ? [characters[0].id] : [];
        return {
          id: `Shot_${String(index + 1).padStart(2, '0')}`,
          sceneId: sc.id,
          locationElementId: matchingLoc,
          characterIds: matchingChars,
          durationSeconds: sc.durationSeconds,
          storyBeat: sc.description,
          dialogue: '',
          cinematography: {
            scale: 'medium close-up',
            angle: 'eye-level',
            movement: 'slow push-in'
          },
          audioLayers: {
            bgm: 'Ambient tension pad',
            narration: '',
            sfx: 'Distant environmental hum'
          },
          startFramePrompt: `A photorealistic cinematic wide shot, setting place inside ${matchingLoc}. 35mm photograph texture, soft natural lighting, emotional shadows.`,
          videoPrompt: `Camera moves in slowly. Subject performs slight microexpression representing subtle suspense.`
        };
      });
      setShots(backupShots);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleAddShot = () => {
    const existingIds = shots.map(s => {
      const match = s.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxNumber = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const nextNum = maxNumber + 1;
    const matchingLoc = locations[0]?.id || 'Element_Location_Default';
    const newS: StoryboardShot = {
      id: `Shot_${String(nextNum).padStart(2, '0')}`,
      sceneId: scenes[0]?.id || 'Scene_1',
      locationElementId: matchingLoc,
      characterIds: characters.length > 0 ? [characters[0].id] : [],
      durationSeconds: 5,
      storyBeat: 'Nhân vật cử động nhẹ bộc lộ chiều sâu cảm xúc.',
      cinematography: {
        scale: 'medium-close',
        angle: 'eye-level',
        movement: 'handheld-drift'
      },
      audioLayers: {
        bgm: 'Thước phim hoài niệm',
        narration: '',
        sfx: 'Tiếng thở nhẹ'
      },
      startFramePrompt: 'Mô tả hình ảnh khởi đầu...',
      videoPrompt: 'Mô tả chuyển động máy quay...'
    };
    setShots([...shots, newS]);
  };

  const handleUpdateShot = (id: string, fields: Partial<StoryboardShot>) => {
    setShots(shots.map(s => {
      if (s.id === id) {
        return { ...s, ...fields };
      }
      return s;
    }));
  };

  const handleUpdateCinematography = (id: string, fields: Partial<StoryboardShot['cinematography']>) => {
    const s = shots.find(sh => sh.id === id);
    if (!s) return;
    handleUpdateShot(id, {
      cinematography: { ...s.cinematography, ...fields }
    });
  };

  const handleUpdateAudio = (id: string, fields: Partial<StoryboardShot['audioLayers']>) => {
    const s = shots.find(sh => sh.id === id);
    if (!s) return;
    handleUpdateShot(id, {
      audioLayers: { ...s.audioLayers, ...fields }
    });
  };

  const toggleCharacterPresence = (shotId: string, charId: string) => {
    const s = shots.find(sh => sh.id === shotId);
    if (!s) return;
    const current = s.characterIds || [];
    const updated = current.includes(charId) 
      ? current.filter(id => id !== charId) 
      : [...current, charId];
    handleUpdateShot(shotId, { characterIds: updated });
  };

  const handleDeleteShot = (id: string) => {
    setShots(shots.filter(s => s.id !== id));
  };

  return (
    <div className="bg-[#0B0F19] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6">
      <div className="border-b border-slate-800 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#F1F5F9] font-mono flex items-center gap-2 uppercase tracking-wide">
            <span className="inline-block w-2.5 h-6 bg-cyan-500 rounded-sm"></span>
            XÂY DỰNG TRỤC PHÂN CẢNH HÌNH ẢNH (STORYBOARD DIRECTOR SHEETS)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            BƯỚC 4: Sắp xếp mạch quay điện ảnh, gán nhân vật vào bối cảnh, thiết lập chuyển động camera và âm tầng chi tiết.
          </p>
        </div>

        <button
          disabled={isDrafting}
          onClick={handleDraftStoryboard}
          className="py-1.5 px-3 bg-[#131924] hover:bg-[#1E293B] border border-slate-700 text-slate-300 text-xs font-mono font-bold rounded flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Phác thảo lại Storyboard
        </button>
      </div>

      {isDrafting && (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-t-cyan-550 border-t-cyan-500 border-indigo-500 animate-spin" />
            <Film className="absolute inset-0 m-auto w-4 h-4 text-cyan-550 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-center">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">AI Đang Thiết Kế Trực Kịch Bản</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
              Áp dụng tỷ lệ {globalBrief.aspectRatio} và màu sắc {globalBrief.visualStyle}, lập danh mục cú máy toàn, trung, cận, nhịp chuyển động máy quay và lớp âm thanh đồng nhất.
            </p>
          </div>
        </div>
      )}

      {!isDrafting && (
        <>
          <div className="space-y-6">
            {shots.map((shot, shotIdx) => (
              <div
                key={shot.id}
                className="p-5 border border-slate-800 hover:border-slate-700 rounded-xl bg-[#0F1722]/55 shadow-sm space-y-4 transition-all"
              >
                {/* Header of Shot */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 border-slate-800 pb-3 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="bg-slate-900 border border-slate-700 text-cyan-400 text-xs font-mono font-bold px-2.5 py-1 rounded">
                      CÚ MÁY {shot.id}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50 font-bold">
                      {shot.durationSeconds}S [CAPPED LIMIT]
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">MAPPING PHÂN CẢNH:</span>
                    <select
                      value={shot.sceneId}
                      onChange={(e) => handleUpdateShot(shot.id, { sceneId: e.target.value })}
                      className="text-[11px] font-mono bg-[#111827] text-white border border-slate-700 rounded p-1 focus:outline-none"
                    >
                      {scenes.map((s, sIdx) => (
                        <option key={s.id || `scene_opt_${sIdx}`} value={s.id}>Cảnh {s.sequenceOrder} ({s.durationSeconds}s)</option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDeleteShot(shot.id)}
                      className="p-1 px-2 text-slate-550 text-slate-500 hover:text-red-400 rounded hover:bg-red-950/20 transition-colors cursor-pointer"
                      title="Xóa cú máy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body Details Split in grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Visual scene and blockers choice */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-mono font-bold text-cyan-400 border-b border-slate-800 pb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span> 📍 QUY CHIẾU LÀM PHIM
                    </h4>

                    {/* Location selector */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Bối cảnh ghi hình
                      </label>
                      <select
                        value={shot.locationElementId}
                        onChange={(e) => handleUpdateShot(shot.id, { locationElementId: e.target.value })}
                        className="w-full text-xs font-sans bg-[#111827] text-[#F1F5F9] border border-slate-750 border-slate-700 rounded p-1.5 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">-- Chọn Bối Cảnh --</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name} ({loc.id})</option>
                        ))}
                      </select>
                    </div>

                    {/* Character checklists */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Nhân vật tham gia trong cú máy
                      </label>
                      <div className="space-y-1.5 bg-[#111827] p-2 rounded border border-slate-800 max-h-24 overflow-y-auto">
                        {characters.map(char => {
                          const hasChar = (shot.characterIds || []).includes(char.id);
                          return (
                            <label key={char.id} className="flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer hover:text-white">
                              <input
                                type="checkbox"
                                checked={hasChar}
                                onChange={() => toggleCharacterPresence(shot.id, char.id)}
                                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                              />
                              <span>{char.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Cinematography settings */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-mono font-bold text-[#F1F5F9] border-b border-slate-800 pb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> 🎥 GÓC MÁY & CHUYỂN ĐỘNG
                    </h4>

                    {/* Scale */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Cỡ ảnh (Scale)</label>
                        <select
                          value={shot.cinematography.scale}
                          onChange={(e) => handleUpdateCinematography(shot.id, { scale: e.target.value })}
                          className="w-full text-xs bg-[#111827] text-slate-300 border border-slate-700 rounded p-1.5 focus:outline-none font-sans"
                        >
                          <option value="extreme close-up">Cận cảnh đặc tả (ECU)</option>
                          <option value="close-up">Cận cảnh (CU)</option>
                          <option value="medium close-up">Trung cận cảnh (MCU)</option>
                          <option value="medium">Trung cảnh (MS)</option>
                          <option value="medium-wide">Trung toàn cảnh (MWS)</option>
                          <option value="wide">Toàn cảnh (WS)</option>
                          <option value="extreme-wide">Đại toàn cảnh (EWS)</option>
                        </select>
                      </div>

                      {/* Angle */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Góc máy (Angle)</label>
                        <select
                          value={shot.cinematography.angle}
                          onChange={(e) => handleUpdateCinematography(shot.id, { angle: e.target.value })}
                          className="w-full text-xs bg-[#111827] text-slate-300 border border-slate-700 rounded p-1.5 focus:outline-none font-sans"
                        >
                          <option value="eye-level">Ngang tầm mắt (Eye-level)</option>
                          <option value="low-angle">Góc hất từ dưới lên (Low-angle)</option>
                          <option value="high-angle">Góc dốc từ trên xuống (High-angle)</option>
                          <option value="tilted Dutch-angle">Góc nghiêng căng thẳng (Dutch tilt)</option>
                          <option value="bird-eye">Góc mắt chim bao quát (Bird's eye)</option>
                        </select>
                      </div>
                    </div>

                    {/* Camera shift/motion style */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Động thái máy quay</label>
                      <select
                        value={shot.cinematography.movement}
                        onChange={(e) => handleUpdateCinematography(shot.id, { movement: e.target.value })}
                        className="w-full text-xs bg-[#111827] text-slate-300 border border-slate-700 rounded p-1.5 focus:outline-none font-sans font-medium"
                      >
                        <option value="static">Khoá máy tĩnh (Static Lock-off)</option>
                        <option value="slow push-in">Đẩy máy chậm sâu vào (Slow Push-in)</option>
                        <option value="handheld drift">Rung lắc cầm tay tự nhiên (Handheld Drift)</option>
                        <option value="slow pan right">Quét camera chậm sang phải (Camera Pan)</option>
                        <option value="crane zoom out">Cẩu trục lùi rộng dần (Crane Zoom-out)</option>
                      </select>
                    </div>

                    {/* Story beat description & Dialogue */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">
                        Hành động chính & Diễn tả (Story Beat)
                      </label>
                      <input
                        type="text"
                        value={shot.storyBeat}
                        onChange={(e) => handleUpdateShot(shot.id, { storyBeat: e.target.value })}
                        className="w-full text-xs text-[#F1F5F9] border-b border-slate-800 focus:border-cyan-500 py-1 focus:outline-none font-semibold bg-transparent"
                        placeholder="Mô tả hành động của nhân vật..."
                      />
                    </div>
                  </div>

                  {/* Audio design blocks */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-mono font-bold text-indigo-400 border-b border-slate-800 pb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-550 bg-indigo-550 bg-indigo-505 bg-indigo-400 rounded-full"></span> 🔈 THIẾT KẾ THẢM ÂM THANH
                    </h4>

                    {/* Background track & SFX */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Nhạc nền (BGM)</label>
                        <input
                          type="text"
                          value={shot.audioLayers.bgm || ''}
                          onChange={(e) => handleUpdateAudio(shot.id, { bgm: e.target.value })}
                          className="w-full text-xs bg-[#111827] text-slate-300 border border-slate-700 rounded p-1.5 focus:outline-none focus:border-cyan-500"
                          placeholder="e.g. Synth tăm tối dồn dập..."
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Hiệu ứng (SFX)</label>
                        <input
                          type="text"
                          value={shot.audioLayers.sfx || ''}
                          onChange={(e) => handleUpdateAudio(shot.id, { sfx: e.target.value })}
                          className="w-full text-xs bg-[#111827] text-slate-300 border border-slate-700 rounded p-1.5 focus:outline-none focus:border-cyan-500"
                          placeholder="e.g. Tiếng mưa rơi, sấm vang..."
                        />
                      </div>
                    </div>

                    {/* Verbatim Dialogue line and VO Voiceover Narration text */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Lời thoại diễn viên (Dialogue)</label>
                      <input
                        type="text"
                        value={shot.dialogue || ''}
                        onChange={(e) => handleUpdateShot(shot.id, { dialogue: e.target.value })}
                        className="w-full text-xs text-[#F1F5F9] italic bg-[#111827] border border-slate-800 rounded p-1.5 focus:outline-none"
                        placeholder="Thu thoại trực tiếp của nhân vật..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">
                        GIỌNG ĐỌC THUYẾT MINH (VOICE VO)
                      </label>
                      <textarea
                        value={shot.audioLayers.narration || ''}
                        onChange={(e) => handleUpdateAudio(shot.id, { narration: e.target.value })}
                        className="w-full text-xs text-cyan-300 bg-cyan-950/20 border border-cyan-900/60 rounded p-1.5 focus:outline-none h-12 resize-none"
                        placeholder="Đưa nội dung (text) lời dẫn chuyện/dẫn thoại (nếu có thể hiện trong kịch bản thô ban đầu) vào ô này..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddShot}
              className="w-full py-4 border-2 border-dashed border-slate-800 hover:border-cyan-500 hover:bg-[#1E293B]/20 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-cyan-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Bổ sung cú máy điện ảnh cho kịch bản
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-950/40 border border-red-800 text-red-105 text-red-400 font-mono text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Stepper controls */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-300 hover:bg-[#1E293B]/80 hover:text-white transition-all cursor-pointer"
            >
              &larr; QUAY LẠI BƯỚC 3
            </button>

            <button
              onClick={() => onConfirm(shots)}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <span>ƯU TIÊN: BIÊN SOẠN PROMPT HÌNH ẢNH THAM CHIẾU</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
