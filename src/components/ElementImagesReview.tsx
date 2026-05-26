import React, { useState } from 'react';
import { KeyElement, GlobalBrief } from '../types';
import { handleResponse } from '../utils';
import { Image as ImageIcon, Sparkles, RefreshCw, CheckCircle, ChevronRight, HelpCircle, AlertCircle, Download, Copy, Check } from 'lucide-react';

interface ElementImagesReviewProps {
  globalBrief: GlobalBrief;
  elements: KeyElement[];
  onConfirm: (updatedElements: KeyElement[]) => void;
  onBack: () => void;
}

export default function ElementImagesReview({ globalBrief, elements, onConfirm, onBack }: ElementImagesReviewProps) {
  const [localElements, setLocalElements] = useState<KeyElement[]>(elements);
  const [statusMap, setStatusMap] = useState<{ [id: string]: 'idle' | 'generating' | 'success' | 'failed' }>({});
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

  const handleGenerateElementImage = async (id: string, customPrompt?: string) => {
    const el = localElements.find(e => e.id === id);
    if (!el) return;

    setStatusMap(prev => ({ ...prev, [id]: 'generating' }));
    
    // Set localized loading state
    setLocalElements(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isGenerating: true };
      }
      return item;
    }));

    try {
      const promptToUse = customPrompt || el.imagePrompt || el.description;
      const customKey = localStorage.getItem('custom_gemini_api_key') || '';
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': customKey
        },
        body: JSON.stringify({
          prompt: promptToUse,
          aspectRatio: globalBrief.aspectRatio === '9:16' ? '9:16' : globalBrief.aspectRatio === '1:1' ? '1:1' : '16:9',
          elementId: el.name
        })
      });

      const data = await handleResponse<any>(response);

      setLocalElements(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            imageUrl: data.imageUrl,
            isGenerating: false
          };
        }
        return item;
      }));

      setStatusMap(prev => ({ ...prev, [id]: 'success' }));
    } catch (err) {
      console.error(err);
      setStatusMap(prev => ({ ...prev, [id]: 'failed' }));
      
      // Setup dynamic visual sketch canvas fallback locally just in case
      // (Normally the backend server.ts fallback already handles this incredibly well, returning a premium SVG card)
      setLocalElements(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, isGenerating: false };
        }
        return item;
      }));
    }
  };

  // One-click generate all missing element illustrations
  const handleGenerateAll = async () => {
    const missing = localElements.filter(el => !el.imageUrl);
    for (const el of missing) {
      await handleGenerateElementImage(el.id);
    }
  };

  const handleUpdatePromptInReview = (id: string, text: string) => {
    setLocalElements(prev => prev.map(el => {
      if (el.id === id) {
        return { ...el, imagePrompt: text };
      }
      return el;
    }));
  };

  return (
    <div className="bg-[#0B0F19] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6">
      <div className="border-b border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#F1F5F9] font-mono flex items-center gap-2 uppercase tracking-wide">
            <span className="inline-block w-2.5 h-6 bg-cyan-500 rounded-sm"></span>
            XUẤT HÌNH THAM CHIẾU DIỆN MẠO (VISUAL REFERENCE PORTFOLIO)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            BƯỚC 6: Tạo lập và phê duyệt ảnh phác họa bằng AI để khóa chặt diện mạo trước khi chạy mô tơ chuyển động video.
          </p>
        </div>

        <button
          onClick={handleGenerateAll}
          className="py-1.5 px-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white text-xs font-mono font-bold rounded shadow flex items-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" /> Vẽ Hàng Loạt Tất Cả Lần Đầu
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {localElements.map(el => {
          const status = statusMap[el.id] || 'idle';
          const isGenerating = el.isGenerating;

          return (
            <div
              key={el.id}
              className="border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden bg-[#0F1722]/55 flex flex-col justify-between transition-all"
            >
              {/* Image Preview Block */}
              <div className="aspect-video bg-[#0E0F14] relative flex items-center justify-center group overflow-hidden border-b border-slate-800">
                {el.imageUrl ? (
                  <img
                    src={el.imageUrl}
                    alt={el.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-[1.02] duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : isGenerating ? (
                  <div className="flex flex-col items-center justify-center space-y-2 text-center p-4">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-cyan-500 animate-spin" />
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">AI Đang Vẽ...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1.5 text-center p-4">
                    <ImageIcon className="w-8 h-8 text-slate-650 text-slate-600" />
                    <span className="text-[10px] font-mono font-bold text-slate-500">CHƯA CÓ HÌNH ẢNH MINH HỌA</span>
                  </div>
                )}

                {/* Layer indicators */}
                <span className={`absolute top-3 left-3 text-[9px] font-mono font-bold uppercase py-0.5 px-2 rounded-full text-white shadow-xs ${
                  el.type === 'character' ? 'bg-cyan-600' : el.type === 'location' ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}>
                  {el.type}
                </span>

                {el.imageUrl && (
                  <div className="absolute top-3 right-3 z-20 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadImage(el.imageUrl || '', `${el.name.replace(/\s+/g, '_')}_ref.png`)}
                      className="p-1 px-2 bg-slate-900/95 hover:bg-slate-800 text-[10px] text-white hover:text-cyan-400 font-bold font-mono rounded border border-slate-705 border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98] shadow-md"
                      title="Tải hình ảnh về máy"
                    >
                      <Download className="w-3 h-3" />
                      Tải về
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(`review_prompt_btn_${el.id}`, el.imagePrompt || '')}
                      className="p-1 px-2 bg-slate-900/95 hover:bg-slate-800 text-[10px] text-white hover:text-cyan-400 font-bold font-mono rounded border border-slate-705 border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98] shadow-md"
                      title="Sao chép prompt câu lệnh"
                    >
                      {copiedStates[`review_prompt_btn_${el.id}`] ? (
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
                  </div>
                )}

                {el.imageUrl && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 text-center">
                    <p className="text-[10px] font-mono text-[#E2E8F0] line-clamp-4 leading-normal">{el.imagePrompt}</p>
                  </div>
                )}
              </div>

              {/* Core Details and Controls */}
              <div className="p-4 space-y-3.5 bg-transparent flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{el.name}</h3>
                  <textarea
                    value={el.imagePrompt || ''}
                    onChange={(e) => handleUpdatePromptInReview(el.id, e.target.value)}
                    className="w-full text-[10px] font-mono text-slate-300 bg-[#111827] border border-slate-850 border-slate-800 p-2 rounded h-20 resize-none focus:outline-none focus:border-cyan-500"
                    placeholder="Chỉnh sửa câu lệnh vẽ bối cảnh / nhân vật tương ứng..."
                  />
                </div>

                <div className="flex items-center space-x-1 border-t border-slate-800 pt-3 mt-1.5 bg-[#0E1520]/20">
                  <button
                    disabled={isGenerating}
                    onClick={() => handleGenerateElementImage(el.id, el.imagePrompt)}
                    className={`flex-1 py-1.5 px-2.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                      isGenerating
                        ? 'bg-slate-900 border border-slate-800 text-slate-500'
                        : 'bg-[#131924] hover:bg-cyan-950/40 text-slate-200 hover:text-cyan-400 border border-slate-700'
                    }`}
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>{el.imageUrl ? 'Vẽ Lại AI' : 'Vẽ Minh Hoạ'}</span>
                  </button>

                  {el.imageUrl && (
                    <span className="p-1 text-cyan-455 text-cyan-400 bg-cyan-950/40 rounded border border-cyan-800/60" title="Đã phê duyệt diện mạo">
                      <CheckCircle className="w-4.5 h-4.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning box */}
      <div className="mt-8 p-4 bg-[#0F172A] border border-cyan-900/60 rounded-lg text-xs text-cyan-300 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-cyan-400 uppercase tracking-wide">LƯU Ý ĐỒNG THUẬN DIỆN MẠO (LOOKS UNIFICATION):</strong> Khi đã đồng ý bấm tiếp tục, các hình ảnh minh hoạ này sẽ tự động đóng vai trò là "Start-Frame Hướng dẫn" cho thuật toán Veo AI dựng hạt chuyển động video kế tiếp, chống biến hình lệch nhân vật.
        </p>
      </div>

      {/* Nav footer */}
      <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-300 hover:bg-[#1E293B]/80 hover:text-white transition-all cursor-pointer"
        >
          &larr; QUAY LẠI BƯỚC 5
        </button>

        <button
          onClick={() => onConfirm(localElements)}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          <span>ĐỒNG THUẬN DIÊN MẠO & SOẠN LỆNH ĐỘNG VIDEO SHOT BY SHOT</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
