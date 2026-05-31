import React, { useState } from 'react';
import { SceneBreakdownItem } from '../types';
import { Plus, Trash2, ShieldAlert, CheckCircle2, ChevronRight, HelpCircle, Activity } from 'lucide-react';

interface SceneBreakdownProps {
  initialScenes: SceneBreakdownItem[];
  onConfirm: (scenes: SceneBreakdownItem[]) => void;
  onBack: () => void;
}

export default function SceneBreakdown({ initialScenes, onConfirm, onBack }: SceneBreakdownProps) {
  const [scenes, setScenes] = useState<SceneBreakdownItem[]>(() => {
    const baseScenes = initialScenes.length > 0 ? initialScenes : [
      { id: 'Scene_1', sequenceOrder: 1, description: 'Phân cảnh khởi đầu giới thiệu bối cảnh', durationSeconds: 5 }
    ];
    return baseScenes.map((s, idx) => ({
      ...s,
      id: s.id || `Scene_${s.sequenceOrder || idx + 1}_${Math.random().toString(36).substring(2, 7)}`
    }));
  });
  const [errorLine, setErrorLine] = useState<string | null>(null);

  // Check if any scene violates the <= 5-second ceiling rule
  const overLimitScenes = scenes.filter(s => s.durationSeconds > 5);
  const isViolatingRule = overLimitScenes.length > 0;

  // Add a new scene block
  const handleAddScene = () => {
    const nextOrder = scenes.length + 1;
    const newScene: SceneBreakdownItem = {
      id: `Scene_Temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sequenceOrder: nextOrder,
      description: 'Mô tả hành động của phân cảnh mới (≤ 5 giây)...',
      durationSeconds: 5,
      transitionLogic: 'Cắt cảnh nhanh'
    };
    setScenes([...scenes, newScene]);
    setErrorLine(null);
  };

  // Delete scene block
  const handleDeleteScene = (index: number) => {
    if (scenes.length <= 1) {
      setErrorLine('Dự án cần có ít nhất một phân cảnh hoàn chỉnh.');
      return;
    }
    const updated = scenes.filter((_, idx) => idx !== index).map((scene, idx) => ({
      ...scene,
      sequenceOrder: idx + 1
    }));
    setScenes(updated);
    setErrorLine(null);
  };

  // Update scene parameters
  const handleUpdate = (index: number, fields: Partial<SceneBreakdownItem>) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], ...fields };
    setScenes(updated);
    setErrorLine(null);
  };

  // Auto split long scenes helper
  const handleAutoSplit = () => {
    const result: SceneBreakdownItem[] = [];
    let currentOrder = 1;

    for (const scene of scenes) {
      if (scene.durationSeconds > 5) {
        // Calculate number of splits needed
        const splitsNeeded = Math.ceil(scene.durationSeconds / 5);
        const splitDuration = Math.ceil(scene.durationSeconds / splitsNeeded);
        
        for (let i = 0; i < splitsNeeded; i++) {
          result.push({
            id: `Scene_Split_${Date.now()}_${currentOrder}_${Math.random().toString(36).substring(2, 7)}`,
            sequenceOrder: currentOrder,
            description: `${scene.description} (Phần ${i + 1}/${splitsNeeded} - Liên tục hành động)`,
            durationSeconds: splitDuration,
            transitionLogic: i === 0 ? scene.transitionLogic : 'Cắt nối tiếp liên tục (Continuity match)'
          });
          currentOrder++;
        }
      } else {
        result.push({
          ...scene,
          sequenceOrder: currentOrder
        });
        currentOrder++;
      }
    }
    setScenes(result);
    setErrorLine(null);
  };

  const handleNext = () => {
    if (isViolatingRule) {
      setErrorLine('Vui lòng chia nhỏ các phân cảnh lớn hơn 5 giây trước khi tiếp tục.');
      return;
    }
    onConfirm(scenes);
  };

  return (
    <div className="bg-[#0B0F19] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6">
      <div className="border-b border-slate-800 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#F1F5F9] flex items-center gap-2 font-mono uppercase tracking-wide">
            <span className="inline-block w-2.5 h-6 bg-cyan-500 rounded-sm"></span>
            ĐỒNG THUẬN PHÂN CẢNH SƠ BỘ (SCENE BREAKDOWN LIST)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            BƯỚC 2: Kiểm duyệt danh sách phân cảnh. Ràng buộc thời lượng ≤ 5s mỗi cảnh để tối ưu hóa hình ảnh.
          </p>
        </div>

        <div className="flex gap-2">
          {isViolatingRule && (
            <button
              onClick={handleAutoSplit}
              className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded font-mono text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(217,119,6,0.2)]"
            >
              <Activity className="w-3.5 h-3.5" />
              Tự Động Tách Cảnh Phân Đoạn &gt;5s
            </button>
          )}
          <button
            onClick={handleAddScene}
            className="py-1.5 px-3 bg-[#1E293B] hover:bg-slate-800 border border-slate-700 text-slate-200 rounded font-mono text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" /> Thêm Cảnh Mới
          </button>
        </div>
      </div>

      {isViolatingRule && (
        <div className="mb-6 p-4 bg-amber-950/30 border border-amber-800/60 rounded-lg text-xs font-mono text-amber-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">ẢNH HƯỞNG QUY TẮC PHIM NGẮN 5 GIÂY (VIOLATION DETECTED)</p>
            <p className="leading-relaxed">
              Các phân cảnh <strong>{overLimitScenes.map(o => `#${o.sequenceOrder}`).join(', ')}</strong> hiện đang vượt quá giới hạn 5 giây. 
              Nhấp vào nút <strong className="underline text-amber-400 hover:text-amber-300">"Tự Động Tách Cảnh"</strong> phía trên hoặc giảm thời gian thủ công để lưu trữ nhịp độ nhanh.
            </p>
          </div>
        </div>
      )}

      {/* Grid List of Scenes */}
      <div className="space-y-3.5">
        {scenes.map((scene, index) => {
          const isTooLong = scene.durationSeconds > 5;
          return (
            <div
              key={scene.id}
              className={`p-4 border rounded-xl transition-all relative group ${
                isTooLong
                  ? 'border-amber-500/70 bg-amber-950/15 shadow-[0_0_10px_rgba(217,119,6,0.1)]'
                  : 'border-slate-800 hover:border-slate-700 bg-[#0F1722]/55'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Visual Label */}
                <div className="md:col-span-1 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#111827] border border-slate-700 text-xs font-mono font-bold text-slate-200">
                    #{scene.sequenceOrder}
                  </span>
                </div>

                {/* Description */}
                <div className="md:col-span-6">
                  <input
                    type="text"
                    value={scene.description}
                    onChange={(e) => handleUpdate(index, { description: e.target.value })}
                    className="w-full text-xs font-sans font-semibold text-white bg-transparent border-b border-transparent focus:border-cyan-500 py-1 focus:outline-none focus:bg-slate-900/40 px-2 rounded"
                    placeholder="Mô tả hành động trực quan..."
                  />
                  {scene.transitionLogic && (
                    <div className="mt-1.5 flex items-center gap-1 px-2 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Kỹ thuật nối cảnh:</span>
                      <input
                        type="text"
                        value={scene.transitionLogic}
                        onChange={(e) => handleUpdate(index, { transitionLogic: e.target.value })}
                        style={{ width: `${Math.max(150, (scene.transitionLogic || "").length * 7)}px` }}
                        className="text-[10px] font-mono text-cyan-400 bg-transparent border-b border-transparent focus:border-cyan-400 focus:outline-none py-0.5 max-w-full"
                        placeholder="Nối cảnh..."
                      />
                    </div>
                  )}
                </div>

                {/* Duration control */}
                <div className="md:col-span-3 flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0">THỜI LƯỢNG:</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={scene.durationSeconds}
                    onChange={(e) => handleUpdate(index, { durationSeconds: parseInt(e.target.value) || 1 })}
                    className={`w-14 p-1 text-center font-mono font-bold text-xs rounded border focus:outline-none ${
                      isTooLong
                        ? 'border-red-500 bg-red-950/50 text-red-400 focus:ring-1 focus:ring-red-500'
                        : 'border-slate-700 bg-[#111827] text-white focus:ring-1 focus:ring-cyan-500'
                    }`}
                  />
                  <span className="text-xs font-mono text-slate-400">giây</span>
                </div>

                {/* Action Trash/Delete */}
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteScene(index)}
                    className="p-1.5 bg-transparent text-slate-500 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/50 rounded border border-transparent transition-all cursor-pointer"
                    title="Xóa phân cảnh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {errorLine && (
        <div className="mt-4 p-2.5 bg-red-950/40 border border-red-800 text-red-400 text-xs font-mono rounded">
          {errorLine}
        </div>
      )}

      {/* Navigation Buttons block */}
      <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer"
        >
          &larr; QUAY LẠI BƯỚC 1
        </button>

        <button
          onClick={handleNext}
          className={`px-5 py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer ${
            isViolatingRule
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-600 hover:to-indigo-700 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
          }`}
        >
          <span>TIẾP THEO: TRÍCH XUẤT NHÂN VẬT & BỐI CẢNH</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
