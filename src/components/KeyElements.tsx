import React, { useState, useEffect } from 'react';
import { KeyElement, GlobalBrief, SceneBreakdownItem, ElementType } from '../types';
import { handleResponse } from '../utils';
import { Sparkles, Trash2, Plus, Users, MapPin, Box, ChevronRight, HelpCircle, ArrowLeft, Copy, Check } from 'lucide-react';

interface KeyElementsProps {
  globalBrief: GlobalBrief;
  scenes: SceneBreakdownItem[];
  initialElements: KeyElement[];
  onConfirm: (elements: KeyElement[]) => void;
  onBack: () => void;
}

export default function KeyElements({ globalBrief, scenes, initialElements, onConfirm, onBack }: KeyElementsProps) {
  const [elements, setElements] = useState<KeyElement[]>(initialElements);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState<ElementType>('character');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 1500);
  };

  // Auto trigger extraction if empty
  useEffect(() => {
    if (elements.length === 0) {
      handleAutoExtract();
    }
  }, []);

  const handleAutoExtract = async () => {
    setIsExtracting(true);
    setError(null);
    try {
      const customKey = localStorage.getItem('custom_gemini_api_key') || '';
      const response = await fetch('/api/generate-elements', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': customKey
        },
        body: JSON.stringify({ brief: globalBrief, scenes })
      });

      const data = await handleResponse<{ elements: KeyElement[] }>(response);

      setElements(data.elements || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra sự cố khi trích xuất tài nguyên hình ảnh.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddElement = () => {
    const idPrefix = activeTab === 'character' ? 'Element_Character_' : activeTab === 'location' ? 'Element_Location_' : 'Element_Prop_';
    const tempId = `${idPrefix}${Date.now()}`;
    
    const defaultDetails = activeTab === 'character' 
      ? 'Khoảng 25-30 tuổi, vóc dáng cân đối, phong cách điện ảnh cuốn hút'
      : activeTab === 'location' 
      ? 'Mô tả không gian: Ánh sáng mờ ấm, trần cao, các chi tiết cổ nội thất...'
      : 'Mô tả đạo cụ: chế tác tinh xảo, chất liệu kim loại mạ vàng cổ kính...';

    const newEl: KeyElement = {
      id: tempId,
      type: activeTab,
      name: activeTab === 'character' ? 'Nhân Vật Mới' : activeTab === 'location' ? 'Bối Cảnh Mới' : 'Đạo Cụ Mới',
      description: 'Mô tả ngắn gọn vai trò...',
      appearanceDetails: defaultDetails,
      looks: activeTab === 'character' ? ['Look A: Thường phục kiểu trẻ trung', 'Look B: Thiết kế phục trang dạ tiệc'] : undefined,
      imagePrompt: activeTab === 'character'
        ? `character-sheet layout: left: head-and-shoulders portrait | right: full-body standing pose (front view, back view, and side view). Subject is a character described as: ${defaultDetails}. Lens sees only physical visual features without psychology. Eye color, hair style, physical traits and costume are locked stable.\n\nPrompt of Look A: character-sheet layout: left: head-and-shoulders portrait of the character with ${defaultDetails} wearing (Look A: Thường phục kiểu trẻ trung) | right: full-body standing pose (front view, back view, and side view) with ${defaultDetails} wearing (Look A: Thường phục kiểu trẻ trung).\n\nPrompt of Look B: character-sheet layout: left: head-and-shoulders portrait of the character with ${defaultDetails} wearing (Look B: Thiết kế phục trang dạ tiệc) | right: full-body standing pose (front view, back view, and side view) with ${defaultDetails} wearing (Look B: Thiết kế phục trang dạ tiệc).`
        : activeTab === 'location'
        ? `Cinematic wide-angle architectural view: empty of people, atmosphere with ${defaultDetails}, dramatic volumetric light, 8k photographic masterwork, no text.`
        : `Detailed high-fidelity macro reference photo: ${defaultDetails} isolated on neutral studio surface, sharp focus study, detailed texture, clean professional lighting.`
    };
    setElements([...elements, newEl]);
  };

  const handleUpdateElement = (id: string, fields: Partial<KeyElement>) => {
    const updated = elements.map(el => {
      if (el.id === id) {
        return { ...el, ...fields };
      }
      return el;
    });
    setElements(updated);
  };

  const handleDeleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
  };

  const handleRegeneratePrompt = (id: string) => {
    setElements(prev => prev.map(el => {
      if (el.id === id && el.type === 'character') {
        const details = el.appearanceDetails || 'appropriate narrative film details';
        const looksList = el.looks && el.looks.length > 0 ? el.looks : ['Look A: Thường phục kiểu trẻ trung'];
        
        const mainPrompt = `character-sheet layout: left: head-and-shoulders portrait | right: full-body standing pose (front view, back view, and side view). Subject is a character described as: ${details}. Lens sees only physical visual features without psychology. Eye color, hair style, physical traits and costume are locked stable, cinematic volumetric lighting, plain clean backdrop.`;
        
        const looksPrompts = looksList.map(look => {
          const lookLabel = look.split(':')[0] || 'Look';
          return `Prompt of ${lookLabel}: character-sheet layout: left: head-and-shoulders portrait | right: full-body standing pose (front view, back view, and side view). Subject is a character with ${details} wearing (${look}). Eye color, hair style, physical traits and costume are locked stable, casting soft emotional cinematic shadows, highly detailed raw 35mm motion photo features.`;
        }).join('\n\n');

        return {
          ...el,
          imagePrompt: `${mainPrompt}\n\n${looksPrompts}`
        };
      }
      return el;
    }));
  };

  const handleAddLook = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const currentLooks = el.looks || [];
    const nextLookNum = currentLooks.length + 1;
    handleUpdateElement(id, {
      looks: [...currentLooks, `Look ${String.fromCharCode(65 + currentLooks.length)}: [Nhập phong cách phục trang]`]
    });
  };

  const handleUpdateLook = (id: string, lookIndex: number, text: string) => {
    const el = elements.find(e => e.id === id);
    if (!el || !el.looks) return;
    const updatedLooks = [...el.looks];
    updatedLooks[lookIndex] = text;
    handleUpdateElement(id, { looks: updatedLooks });
  };

  const handleDeleteLook = (id: string, lookIndex: number) => {
    const el = elements.find(e => e.id === id);
    if (!el || !el.looks) return;
    const updatedLooks = el.looks.filter((_, idx) => idx !== lookIndex);
    handleUpdateElement(id, { looks: updatedLooks });
  };

  const filteredElements = elements.filter(el => el.type === activeTab);

  return (
    <div className="bg-[#0B0F19] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6">
      <div className="border-b border-slate-800 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#F1F5F9] font-mono flex items-center gap-2 uppercase tracking-wide">
            <span className="inline-block w-2.5 h-6 bg-cyan-500 rounded-sm"></span>
            BIÊN SẠN THÀNH PHẦN CHỦ CHỐT (KEY VISUAL ELEMENTS)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            BƯỚC 3: Kiến tạo từ điển hình ảnh đồng nhất. Thiết lập mô tả chi tiết nhân vật, bối cảnh và đạo cụ then chốt trước khi dàn dựng storyboard.
          </p>
        </div>

        <button
          disabled={isExtracting}
          onClick={handleAutoExtract}
          className="py-1.5 px-3 bg-[#131924] hover:bg-[#1E293B] border border-slate-700 text-slate-300 text-xs font-mono font-bold rounded flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Trích Xuất Lại Từ Kịch Bản
        </button>
      </div>

      {/* Guidelines Banner block for Key Elements & Prompt Structure */}
      <div className="mb-6 bg-slate-900/40 rounded-xl border border-slate-800 p-4.5 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-cyan-400 animate-bounce" />
          QUY CHUẨN THIẾT KẾ THÀNH PHẦN & VIẾT PROMPT CHUYÊN NGHIỆP
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-slate-300 font-mono text-[11px] leading-relaxed">
          {/* Key element designs */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-200 border-l-2 border-emerald-500 pl-2">1. Quy Hoạch Thành Phần (Key Element Design)</h4>
            <ul className="list-disc pl-4.5 space-y-1.5 text-slate-400">
              <li>
                <strong className="text-slate-350 text-cyan-400">Nhân vật (Character)</strong>: Mô tả vật lý chuẩn xác: tầm tuổi, chiều cao/vóc dáng, tông màu da, kiểu & màu tóc, trang phục từng phân cảnh nếu có thay đổi. Nếu có nhiều trang phục, hãy gắn nhãn rõ ràng (ví dụ: <code className="text-cyan-300">Look A: ...</code>; <code className="text-cyan-300">Look B: ...</code>).
              </li>
              <li>
                <strong className="text-slate-350 text-emerald-400">Bối cảnh (Location)</strong>: Chi tiết về cách sắp xếp không gian, kiến trúc địa lý, điều kiện ánh sáng (nguồn sáng, góc chiếu), màu sắc chủ đạo và sắc thái cảm xúc không gian phải truyền tải.
              </li>
              <li>
                <strong className="text-slate-350 text-indigo-400">Đạo cụ (Prop)</strong>: Định rõ chất liệu chế tác, độ mòn cũ/vết xước, trạng thái phát sáng, kích thước của những vật phẩm mang tính nút thắt cốt truyện.
              </li>
            </ul>
          </div>

          {/* Prompt Writing structures */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-200 border-l-2 border-cyan-500 pl-2">2. Cấu Trúc Câu Lệnh Visual (Prompt Writing)</h4>
            <ul className="list-disc pl-4.5 space-y-1.5 text-slate-400">
              <li>
                <strong className="text-cyan-400">Góc nhìn Đạo diễn</strong>: Viết như một bản tóm tắt gửi cho tổ quay phim/trang phục. Chỉ mô tả những gì ống kính thực sự ghi lại (mô tả trực quan). Tuyệt đối tránh tâm lý nhân vật, động cơ phi hình ảnh hoặc yếu tố ngoài khung hình.
              </li>
              <li>
                <strong className="text-cyan-400">Cấu trúc đoạn mượt mà</strong>: Viết thành một đoạn văn trơn tru duy nhất, không ghi tiêu đề/đầu mục con: <code className="text-slate-400">nhận dạng thực thể → phục trang & đạo cụ kèm theo → bối cảnh nền → cự ly góc máy & bố cục → ánh sáng & phân cấp màu → chi tiết bề mặt/vân phủ → dáng điệu/biểu cảm nhỏ tạo hồn</code>.
              </li>
              <li>
                <strong className="text-cyan-400">Character Sheet hai bảng</strong>: Thiết lập rõ cấu hình phôi nhân vật: <code className="text-yellow-400">"character-sheet layout: left: head-and-shoulders portrait | right: full-body standing pose (front view, back view, and side view)"</code> và khoá cố định các dấu hiệu diện mạo (màu mắt, kiểu tóc, chi tiết phục trang) để đảm bảo đồng nhất tuyệt đối qua các shot phim.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {isExtracting && (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-cyan-500 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-cyan-400 animate-bounce" />
          </div>
          <div className="text-center">
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">AI Đang Tổng Hợp Thành Phần</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
              Trích xuất nhân vật chi tiết (đặc điểm diện mạo, phục trang), khảo sát các bối cảnh bối cảnh và đạo cụ then chốt trong kịch bản.
            </p>
          </div>
        </div>
      )}

      {!isExtracting && (
        <>
          {/* Tabs Selector blocks */}
          <div className="flex border-b border-slate-800 mb-5">
            {[
              { type: 'character' as ElementType, label: 'Nhân Vật', icon: Users, color: 'text-cyan-400' },
              { type: 'location' as ElementType, label: 'Địa Điểm / Bối Cảnh', icon: MapPin, color: 'text-emerald-400' },
              { type: 'prop' as ElementType, label: 'Đạo Cụ Then Chốt', icon: Box, color: 'text-indigo-400' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  className={`flex items-center space-x-1.5 py-3 px-5 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.color}`} />
                  <span>{tab.label} ({elements.filter(e => e.type === tab.type).length})</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* New component trigger inside lists */}
            <button
              onClick={handleAddElement}
              className="p-6 border-2 border-dashed border-slate-800 hover:border-cyan-500 bg-[#0F1722]/30 hover:bg-[#1E293B]/20 rounded-xl flex flex-col items-center justify-center text-center group cursor-pointer transition-all aspect-video"
            >
              <div className="w-10 h-10 rounded-full bg-[#111827] group-hover:bg-[#1E293B] border border-slate-800 flex items-center justify-center mb-2.5 transition-all">
                <Plus className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-all" />
              </div>
              <h4 className="text-xs font-bold text-slate-300 group-hover:text-cyan-300 uppercase tracking-wider font-mono">
                Thêm {activeTab === 'character' ? 'Nhân Vật' : activeTab === 'location' ? 'Bối Cảnh' : 'Đạo Cụ'}
              </h4>
              <p className="text-[10px] text-slate-550 text-slate-500 mt-1">Ghi chép thủ công quy cách sáng tạo của bạn</p>
            </button>

            {filteredElements.map(el => (
              <div
                key={el.id}
                className="p-5 border border-slate-800 hover:border-slate-700 rounded-xl bg-[#0F1722]/55 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 mb-3">
                    <span className="text-[10px] text-cyan-400 font-mono leading-none font-bold uppercase">
                      ID: {el.id}
                    </span>
                    <button
                      onClick={() => handleDeleteElement(el.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-950/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Name field */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-0.5">Tên thành phần</label>
                      <input
                        type="text"
                        value={el.name}
                        onChange={(e) => handleUpdateElement(el.id, { name: e.target.value })}
                        className="w-full text-sm font-bold text-[#F1F5F9] border-b border-slate-800 focus:border-cyan-500 pb-0.5 focus:outline-none bg-transparent"
                      />
                    </div>

                    {/* Brief description */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-0.5">Mô tả cốt lõi / Vai trò</label>
                      <textarea
                        value={el.description}
                        onChange={(e) => handleUpdateElement(el.id, { description: e.target.value })}
                        className="w-full text-xs text-slate-300 bg-[#111827] border border-slate-800 rounded p-1.5 focus:border-cyan-500 h-12 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Highly descriptive appearance specifics */}
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        {el.type === 'character' ? 'Chi tiết ngoại hình (Ai chụp)' : el.type === 'location' ? 'Hình thái không gian & Ánh sáng' : 'Đặc tính cấu trúc đạo cụ'}
                      </label>
                      <textarea
                        value={el.appearanceDetails || ''}
                        onChange={(e) => handleUpdateElement(el.id, { appearanceDetails: e.target.value })}
                        className="w-full text-xs text-[#F1F5F9] bg-[#111827] border border-slate-800 rounded p-2 focus:border-cyan-500 h-20 focus:outline-none"
                        placeholder="Hãy ghi chi tiết về trang phục, kiểu tóc, tuổi tác, ánh sáng..."
                      />
                    </div>

                    {/* Character Looks configuration if type is character */}
                    {el.type === 'character' && (
                      <div className="space-y-1.5 bg-[#111827] p-2.5 rounded border border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">DANH SÁCH DIỆN MẠO (LOOKS)</label>
                          <button
                            onClick={() => handleAddLook(el.id)}
                            className="text-[9px] font-mono bg-[#1E293B] hover:bg-slate-800 border border-slate-700 text-slate-200 px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer"
                          >
                            + Thêm phục trang
                          </button>
                        </div>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto">
                          {el.looks?.map((look, lookIdx) => (
                            <div key={lookIdx} className="flex items-center gap-1.5 bg-[#1F2937]/40 p-1 rounded border border-slate-800">
                              <input
                                type="text"
                                value={look}
                                onChange={(e) => handleUpdateLook(el.id, lookIdx, e.target.value)}
                                className="w-full text-[11px] text-slate-300 bg-transparent focus:outline-none"
                              />
                              <button
                                onClick={() => handleDeleteLook(el.id, lookIdx)}
                                className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Directive Image Prompts formulation for next phases */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-0.5">Prompt tham chiếu AI (Director's Visual Prompt)</label>
                    <div className="flex gap-1.5">
                      {el.type === 'character' && (
                        <button
                          type="button"
                          onClick={() => handleRegeneratePrompt(el.id)}
                          className="text-[9px] font-mono hover:text-cyan-400 text-slate-200 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-slate-800/40 hover:bg-slate-850 border border-slate-700 cursor-pointer"
                          title="Đồng bộ lại chi tiết ngoại hình, kiểu tóc và trang phục mới nhất vào sườn prompt"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                          Đồng bộ Prompt
                        </button>
                      )}
                      {el.imagePrompt && (
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(`prompt_${el.id}`, el.imagePrompt || '')}
                          className="text-[9px] font-mono hover:text-cyan-400 text-slate-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-slate-800/40 hover:bg-slate-800 border border-slate-700 cursor-pointer"
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
                  </div>
                  <textarea
                    value={el.imagePrompt || ''}
                    onChange={(e) => handleUpdateElement(el.id, { imagePrompt: e.target.value })}
                    className="w-full text-[10px] text-cyan-300 font-mono bg-cyan-950/30 border border-cyan-900/60 focus:border-cyan-500 hover:border-cyan-800/80 rounded p-2 h-16 focus:outline-none"
                    placeholder="Mô tả nhiếp ảnh điện ảnh mẫu..."
                  />
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-950/40 border border-red-800 text-red-400 font-mono text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-300 hover:bg-[#1E293B]/80 transition-all cursor-pointer"
            >
              &larr; QUAY LẠI BƯỚC 2
            </button>

            <button
              onClick={() => onConfirm(elements)}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <span>XÁC NHẬN & VẼ KỊCH BẢN PHÁT THẢO STORYBOARD</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
