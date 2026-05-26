import React, { useState } from 'react';
import { KeyElement, GlobalBrief } from '../types';
import { ChevronRight, FileImage, Sparkles, HelpCircle, AlertCircle, Copy, Check } from 'lucide-react';

interface MediaGeneratorPromptsProps {
  globalBrief: GlobalBrief;
  elements: KeyElement[];
  onConfirm: (updatedElements: KeyElement[]) => void;
  onBack: () => void;
}

export default function MediaGeneratorPrompts({ globalBrief, elements, onConfirm, onBack }: MediaGeneratorPromptsProps) {
  const [localElements, setLocalElements] = useState<KeyElement[]>(elements);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  const handleCopyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 1500);
  };

  const handleUpdatePrompt = (id: string, promptText: string) => {
    setLocalElements(localElements.map(el => {
      if (el.id === id) {
        return { ...el, imagePrompt: promptText };
      }
      return el;
    }));
  };

  const handleAutoRephrase = (id: string) => {
    const el = localElements.find(e => e.id === id);
    if (!el) return;
    
    // Auto design high visual fidelity cinematic prompt parameters following step-5 structured format:
    // subject identity -> wardrobe and props -> environment/background -> shot scale and composition -> light quality and color grade -> texture and detail -> mood-relevant micro-expressions
    const formattedPrompt = `${el.name}, a photorealistic key element sheet. ` +
      (el.type === 'character' 
        ? `character-sheet layout: left: highly detailed eye-level head-and-shoulders portrait | right: crisp full-body standing pose. Subject details: ${el.appearanceDetails || el.description}. Set against an empty minimalist dark studio background, raw 35mm photograph, authentic skin pores, volumetric natural face-lighting with deep cinematic highlights.`
        : el.type === 'location'
        ? `cinematic masterpiece background plate of ${el.name}, empty setting, ultra-wide angle view. Architectural details, space layout: ${el.appearanceDetails || el.description}. Specific ambient atmospheric lighting, smoke haze, rich warm amber and teal color grade, extremely sharp 8k textures.`
        : `ultra-sharp technical macro photograph of ${el.name}. Detailed close-up angle, materials showing subtle vintage wear and beautiful highlights: ${el.appearanceDetails || el.description}. Placed on clean dark workbench, moody top spotlight ray, professional product cinematography, high dynamic range.`);

    handleUpdatePrompt(id, formattedPrompt);
  };

  return (
    <div className="bg-[#0B0F19] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-lg font-extrabold text-[#F1F5F9] font-mono flex items-center gap-2 uppercase tracking-wide">
          <span className="inline-block w-2.5 h-6 bg-cyan-500 rounded-sm"></span>
          BIÊN SOẠN BẢN TẢ CHỈ THỊ HÌNH ẢNH (ELEMENT IMAGE PROMPTS)
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          BƯỚC 5: Tinh chỉnh câu lệnh tạo lập chân dung nhân vật, bối cảnh, đạo cụ. Thiết lập khung chỉ thị ống kính điện ảnh thuần túy.
        </p>
      </div>

      <div className="p-4 bg-[#0F172A] border border-cyan-900/60 rounded-lg text-xs text-cyan-300 mb-6 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wide text-cyan-400">QUY CHUẨN SOẠN LỆNH ĐẠO DIỄN (DIRECTOR BRIEF STANDARD)</p>
          <p className="leading-relaxed">
            Công thức viết prompt chuẩn của bộ phim: <strong>Mặt thể hiện chân dung / vật thể &rarr; Trang phục & Đạo cụ vật lí &rarr; Không gian môi trường &rarr; Cú máy và góc chụp &rarr; Màu sắc & Chất lượng ánh sáng &rarr; Độ nứt, vân bề mặt &rarr; Tư thế & Biểu cảm micro-emotion</strong>. Không mô tả suy nghĩ tâm lý hay động cơ vô hình ngoài khung ống kính.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {localElements.map(el => (
          <div
            key={el.id}
            className="p-5 border border-slate-800 hover:border-slate-700 rounded-xl bg-[#0F1722]/55 transition-all grid grid-cols-1 md:grid-cols-12 gap-5"
          >
            {/* Element info column */}
            <div className="md:col-span-4 space-y-2">
              <div className="flex items-center space-x-1.5 border-b border-[#1E293B] pb-1.5">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  el.type === 'character' ? 'bg-cyan-400' : el.type === 'location' ? 'bg-emerald-400' : 'bg-indigo-400'
                }`} />
                <h3 className="text-sm font-bold text-[#F1F5F9]">{el.name}</h3>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{el.description}</p>
              <div className="p-2 bg-[#0B0F19] rounded border border-slate-800 text-[10px] font-mono text-slate-500">
                ID: {el.id} | LOẠI: {el.type.toUpperCase()}
              </div>
              
              <button
                onClick={() => handleAutoRephrase(el.id)}
                className="w-full mt-2 py-1.5 px-3 bg-[#131924] hover:bg-[#1E293B] border border-slate-700 text-cyan-400 text-[11px] font-mono font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" /> Tự động dàn dựng prompt chuẩn 5S
              </button>
            </div>

            {/* Prompt editor column */}
            <div className="md:col-span-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    ĐƯƠNG LỆNH HÌNH ẢNH THAM KHẢO PIXEL TRONG PHÒNG LAB
                  </label>
                  {el.imagePrompt && (
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(`prompt_${el.id}`, el.imagePrompt || '')}
                      className="text-[9px] font-mono hover:text-cyan-400 text-slate-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-slate-800/40 hover:bg-slate-800 border border-slate-705 border-slate-700 cursor-pointer"
                      title="Sao chép prompt"
                    >
                      {copiedStates[`prompt_${el.id}`] ? (
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
                  value={el.imagePrompt || ''}
                  onChange={(e) => handleUpdatePrompt(el.id, e.target.value)}
                  className="w-full h-28 p-3 font-mono text-xs bg-[#111827] border border-slate-800 rounded-lg text-slate-350 text-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Mô tả cụ thể tư thế, bối cảnh chụp..."
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic text-cyan-500/80">
                * Chỉ mô tả những yếu tố vật lý thiết bi ghi nhận, tránh nhập từ ngữ ẩn dụ nghệ thuật trừu tượng.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Stepper buttons */}
      <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-300 hover:bg-[#1E293B]/80 hover:text-white transition-all cursor-pointer"
        >
          &larr; QUAY LẠI BƯỚC 4
        </button>

        <button
          onClick={() => onConfirm(localElements)}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          <span>TIẾP THEO: XUẤT HÌNH THAM CHIẾU & ĐỒNG THUẬN DIỆN MẠO</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
