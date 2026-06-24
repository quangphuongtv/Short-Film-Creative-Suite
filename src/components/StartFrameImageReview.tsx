import React, { useState } from 'react';
import { StoryboardShot, KeyElement, GlobalBrief } from '../types';
import { handleResponse } from '../utils';
import { Camera, Sparkles, RefreshCw, CheckCircle, ChevronRight, AlertCircle, Download, Copy, Check, Image as ImageIcon, Upload } from 'lucide-react';
import JSZip from 'jszip';

interface StartFrameImageReviewProps {
  globalBrief: GlobalBrief;
  shots: StoryboardShot[];
  keyElements: KeyElement[];
  onConfirm: (updatedShots: StoryboardShot[]) => void;
  onBack: () => void;
}

export default function StartFrameImageReview({ globalBrief, shots, keyElements, onConfirm, onBack }: StartFrameImageReviewProps) {
  const [localShots, setLocalShots] = useState<StoryboardShot[]>(shots);
  const [statusMap, setStatusMap] = useState<{ [id: string]: 'idle' | 'generating' | 'success' | 'failed' }>({});
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  const handleUploadLocalImage = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLocalShots(prev => prev.map(shot => {
        if (shot.id === id) {
          return { ...shot, startFrameUrl: base64 };
        }
        return shot;
      }));
    };
    reader.readAsDataURL(file);
  };

  // Reference images of step 6 mapped to each shot ID
  const [attachedRefs, setAttachedRefs] = useState<{ [shotId: string]: string[] }>(() => {
    const initial: { [shotId: string]: string[] } = {};
    shots.forEach(shot => {
      const related = keyElements.filter(el => 
        (shot.characterIds?.includes(el.id) || el.id === shot.locationElementId) && 
        el.imageUrl
      );
      initial[shot.id] = related.map(el => el.id);
    });
    return initial;
  });

  const [showAllRefsMap, setShowAllRefsMap] = useState<{ [shotId: string]: boolean }>({});

  const handleAddReference = (shotId: string, elementId: string) => {
    const isAlreadyAttached = attachedRefs[shotId]?.includes(elementId);
    if (!isAlreadyAttached) {
      setAttachedRefs(prev => ({
        ...prev,
        [shotId]: [...(prev[shotId] || []), elementId]
      }));
    }

    // Also add text mention [Ref: elementId] to the prompt
    setLocalShots(prev => prev.map(shot => {
      if (shot.id === shotId) {
        const refTag = `[Ref: ${elementId}]`;
        if (!shot.startFramePrompt?.includes(refTag)) {
          const currentPrompt = shot.startFramePrompt || '';
          const updatedPrompt = currentPrompt ? `${currentPrompt.trim()} ${refTag}` : refTag;
          return { ...shot, startFramePrompt: updatedPrompt };
        }
      }
      return shot;
    }));
  };

  const handleRemoveReference = (shotId: string, elementId: string) => {
    setAttachedRefs(prev => ({
      ...prev,
      [shotId]: (prev[shotId] || []).filter(id => id !== elementId)
    }));

    // Optionally clean up the prompt tag
    setLocalShots(prev => prev.map(shot => {
      if (shot.id === shotId) {
        const refTag = `[Ref: ${elementId}]`;
        if (shot.startFramePrompt?.includes(refTag)) {
          const updatedPrompt = shot.startFramePrompt.replace(refTag, '').replace(/\s+/g, ' ').trim();
          return { ...shot, startFramePrompt: updatedPrompt };
        }
      }
      return shot;
    }));
  };

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

  const handleGenerateStartFrame = async (id: string, customPrompt?: string) => {
    const shot = localShots.find(s => s.id === id);
    if (!shot) return;

    setStatusMap(prev => ({ ...prev, [id]: 'generating' }));
    
    // Set localized loading state
    setLocalShots(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isGeneratingStartFrame: true };
      }
      return item;
    }));

    try {
      const promptToUse = customPrompt || shot.startFramePrompt || '';
      const customKey = localStorage.getItem('custom_gemini_api_key') || '';
      
      const refIds = attachedRefs[id] || [];
      const referenceImageUrls = refIds
        .map(refId => keyElements.find(el => el.id === refId)?.imageUrl)
        .filter((url): url is string => typeof url === 'string' && url.length > 0);

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': customKey
        },
        body: JSON.stringify({
          prompt: promptToUse,
          aspectRatio: globalBrief.aspectRatio === '9:16' ? '9:16' : globalBrief.aspectRatio === '1:1' ? '1:1' : '16:9',
          elementId: `${shot.id}_StartFrame`,
          referenceImageUrls
        })
      });

      const data = await handleResponse<any>(response);

      setLocalShots(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            startFrameUrl: data.imageUrl,
            isGeneratingStartFrame: false
          };
        }
        return item;
      }));

      setStatusMap(prev => ({ ...prev, [id]: 'success' }));
    } catch (err) {
      console.error(err);
      setStatusMap(prev => ({ ...prev, [id]: 'failed' }));
      
      setLocalShots(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, isGeneratingStartFrame: false };
        }
        return item;
      }));
    }
  };

  const [isZipping, setIsZipping] = useState(false);

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

  const handleDownloadAllZip = async () => {
    const generatedShots = localShots.filter(shot => shot.startFrameUrl);
    if (generatedShots.length === 0 || isZipping) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const shotsFolder = zip.folder("storyboard_shots");
      
      if (shotsFolder) {
        for (const shot of localShots) {
          if (shot.startFrameUrl && shot.startFrameUrl.startsWith("data:")) {
            const url = shot.startFrameUrl;
            const isSvg = url.startsWith("data:image/svg+xml");
            const ext = isSvg ? "svg" : "png";
            
            try {
              const blob = await dataURLtoBlob(url);
              shotsFolder.file(`shot_${shot.id}.${ext}`, blob);
            } catch (shotZipErr) {
              console.warn(`Could not add scene shot frame ${shot.id} to zip:`, shotZipErr);
            }
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      const titleNormalized = (globalBrief.title || "storyboard")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .toLowerCase();
      
      const zipFilename = `storyboard_${titleNormalized || 'shot_by_shot'}_images.zip`;
      const zipUrl = URL.createObjectURL(zipBlob);
      const zipLink = document.createElement("a");
      zipLink.href = zipUrl;
      zipLink.download = zipFilename;
      document.body.appendChild(zipLink);
      zipLink.click();
      document.body.removeChild(zipLink);
      URL.revokeObjectURL(zipUrl);
    } catch (zipErr) {
      console.error("Could not bundle or download storyboard shots ZIP package:", zipErr);
    } finally {
      setIsZipping(false);
    }
  };

  const handleGenerateAll = async () => {
    const missing = localShots.filter(shot => !shot.startFrameUrl);
    for (const shot of missing) {
      await handleGenerateStartFrame(shot.id);
    }
  };

  const handleUpdatePromptInReview = (id: string, text: string) => {
    setLocalShots(prev => prev.map(shot => {
      if (shot.id === id) {
        return { ...shot, startFramePrompt: text };
      }
      return shot;
    }));
  };

  // Structured prompt generator enforcing the user's specific guidelines
  const handleAutoRephraseStartFrame = (id: string) => {
    const shot = localShots.find(s => s.id === id);
    if (!shot) return;

    // 1. Identify characters and design poses/expressions (No psychological/internal terms)
    const shotCharacters = keyElements.filter(el => shot.characterIds?.includes(el.id));
    let charactersBlock = '';
    if (shotCharacters.length > 0) {
      charactersBlock = shotCharacters.map(char => {
        const eyeColor = char.appearanceDetails?.match(/(mắt|eye)\s+\w+/i)?.[0] || 'focused eyes';
        const hairStyle = char.appearanceDetails?.match(/(tóc|hair)\s+[\w\s\u00C0-\u1EF9]+/i)?.[0] || 'neat hair';
        return `${char.name} is in the frame, posing with a physical posture matching: "${shot.storyBeat || 'standing quietly'}". Facial layout locks exact appearance with ${eyeColor}, styled ${hairStyle}, showing zero micro-drifting.`;
      }).join(' and ');
    } else {
      charactersBlock = 'No visible character is present in the frame, focusing entirely on setting.';
    }

    // 2. Identify costume / props details based on element sheets
    let costumeBlock = '';
    if (shotCharacters.length > 0) {
      costumeBlock = shotCharacters.map(char => {
        const wardrobe = char.appearanceDetails?.includes('mặc') || char.appearanceDetails?.includes('wardrobe')
          ? char.appearanceDetails
          : 'appropriate narrative film wardrobe matching design elements';
        return `${char.name} is wearing: "${wardrobe}"`;
      }).join(', and ');
    } else {
      costumeBlock = 'Empty of wardrobe, pristine cinematic bối cảnh focus.';
    }

    // 3. Identify and fetch active background location
    const locationObj = keyElements.find(el => el.id === shot.locationElementId);
    const backgroundBlock = locationObj 
      ? `Setting environment of ${locationObj.name}: ${locationObj.appearanceDetails || 'atmospheric cinematic space'}. Background elements showing clear structural depth, no double silhouettes, no off-lens distractions.`
      : 'Setting environment of cinematic film backdrop with volumetric deep space details.';

    // 4. Camerawork, aspect ratios, scale and composition
    const compositionBlock = `Composition scale is a clear cinematic ${shot.cinematography.scale || 'medium shot'}, captured from an elegant ${shot.cinematography.angle || 'eye-level'} angle. Carefully framed widescreen arrangement following ${globalBrief.aspectRatio || '16:9'} rule of thirds precision, with an extremely sharp cinematic focal plane.`;

    // 5. Lighting conditions and color grading
    const lightingBlock = `High fidelity cinematic volumetric lights illuminate the frame. Balanced soft color grading matching ${globalBrief.visualStyle || '3D Pixar'} style palette, professional movie-grade key lighting casting smooth emotional shadows.`;

    // 6. Fine grain, camera details and texture
    const textureBlock = `Raw 35mm motion photograph grain, highly detailed skin pores, exquisite textures on textiles and backdrops, pristine 8k camera lens resolution. Absolutely no text, no captions, no watermark, no digital noise, no floating elements.`;

    // Combine seamlessly into a single fluid paragraph with no unneeded markers or headers
    const fullFluentPrompt = `${charactersBlock} ${costumeBlock}. ${backgroundBlock} ${compositionBlock} ${lightingBlock} ${textureBlock}`;

    handleUpdatePromptInReview(id, fullFluentPrompt.trim().replace(/\s+/g, ' '));
  };

  const hasAnyGeneratedImage = localShots.some(shot => shot.startFrameUrl);

  return (
    <div className="bg-[#0B0F19] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6 hover:shadow-cyan-950/20 transition-all duration-300">
      <div className="border-b border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#F1F5F9] font-mono flex items-center gap-2 uppercase tracking-wide">
            <span className="inline-block w-2.5 h-6 bg-cyan-500 rounded-sm"></span>
            ẢNH FRAME KHỞI ĐẦU CHẮC CHẮN (START-FRAME KEYFRAME INDEX)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            BƯỚC 7: Hoàn thiện prompt ảnh tĩnh khởi đầu, đồng thuẫn diện mạo mắt, tóc và trang phục để bắt khóa chặt chuyển động.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateAll}
            className="py-1.5 px-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white text-xs font-mono font-bold rounded shadow flex items-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" /> Vẽ Hàng Loạt Tất Cả Cận Cảnh
          </button>

          <button
            onClick={handleDownloadAllZip}
            disabled={!hasAnyGeneratedImage || isZipping}
            className={`py-1.5 px-3 border text-xs font-mono font-bold rounded shadow flex items-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all ${
              !hasAnyGeneratedImage || isZipping
                ? 'border-slate-800 text-slate-500 bg-slate-900 pointer-events-none opacity-50'
                : 'border-emerald-600 hover:border-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            }`}
          >
            {isZipping ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border border-t-transparent border-emerald-400 animate-spin" />
                Đang nén ZIP...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" /> Tải về Tất cả (.zip)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 bg-[#0F172A] border border-cyan-900/60 rounded-lg text-xs text-cyan-300 mb-6 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wide text-cyan-400">QUY TRÌNH BAO QUÁT KHUNG KHỞI ĐẦU (START-FRAME COMPOSE MANDATES)</p>
          <ul className="list-disc pl-4 space-y-1 leading-relaxed">
            <li>Mọi chi tiết xuất hiện phải xác định rõ: vị trí nhân vật, tư thế, bối cảnh, và cách sắp xếp ánh sáng.</li>
            <li><strong>Khóa Nhận Diện:</strong> Tuyệt đối bắt chặt màu mắt, màu tóc và trang phục theo đúng element bối cảnh ban đầu, triệt tiêu drifting.</li>
            <li>Tuyệt đối cấm viết từ tâm lý hoặc mong muốn trừu tượng ngoài khung hình. Hãy mô tả chi tiết hình dáng, vị trí hữu hình.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {localShots.map(shot => {
          const status = statusMap[shot.id] || 'idle';
          const isGenerating = shot.isGeneratingStartFrame;

          return (
            <div
              key={shot.id}
              className="border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden bg-[#0F1722]/55 flex flex-col justify-between transition-all"
            >
              {/* Image Preview Block */}
              <div className="aspect-video bg-[#0E0F14] relative flex items-center justify-center group overflow-hidden border-b border-slate-800">
                {shot.startFrameUrl ? (
                  <img
                    src={shot.startFrameUrl}
                    alt={shot.id}
                    className="w-full h-full object-cover transition-transform group-hover:scale-[1.02] duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : isGenerating ? (
                  <div className="flex flex-col items-center justify-center space-y-2 text-center p-4">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-cyan-500 animate-spin" />
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">AI Đang Vẽ Frame Đầu...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1.5 text-center p-4">
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                    <span className="text-[10px] font-mono font-bold text-slate-500">CHƯA CÓ FRAME KHỞI ĐẰU</span>
                  </div>
                )}

                {/* Shot identity label */}
                <span className="absolute top-3 left-3 text-[9px] font-mono font-bold uppercase py-0.5 px-2 rounded bg-cyan-600 text-white shadow">
                  CÚ MÁY {shot.id}
                </span>

                {shot.startFrameUrl && (
                  <div className="absolute top-3 right-3 z-20 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadImage(shot.startFrameUrl || '', `${shot.id}_startframe.png`)}
                      className="p-1 px-2 bg-slate-900/95 hover:bg-slate-800 text-[10px] text-white hover:text-cyan-400 font-bold font-mono rounded border border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98] shadow"
                      title="Tải hình ảnh về máy"
                    >
                      <Download className="w-3 h-3" />
                      Tải về
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(`start_prompt_btn_${shot.id}`, shot.startFramePrompt || '')}
                      className="p-1 px-2 bg-slate-900/95 hover:bg-slate-800 text-[10px] text-white hover:text-cyan-400 font-bold font-mono rounded border border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98] shadow"
                      title="Sao chép prompt"
                    >
                      {copiedStates[`start_prompt_btn_${shot.id}`] ? (
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

                {shot.startFrameUrl && (
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 scrollbar-thin overflow-y-auto">
                    <p className="text-[10px] font-mono text-[#E2E8F0] leading-normal">{shot.startFramePrompt}</p>
                  </div>
                )}
              </div>

              {/* Core Details and Controls */}
              <div className="p-4 space-y-3 bg-transparent flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Cảnh quay diễn tả:</h3>
                    <button
                      onClick={() => handleAutoRephraseStartFrame(shot.id)}
                      className="text-[10px] font-mono text-cyan-400 bg-slate-900 border border-slate-800 hover:bg-[#1E293B] px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-0.5"
                      title="Tự sinh prompt từ elements của shot"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> Dàn Dựng Prompt 5S
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 bg-slate-900/30 p-1.5 rounded border border-slate-850 line-clamp-2">
                    {shot.storyBeat}
                  </p>
                  <textarea
                    value={shot.startFramePrompt || ''}
                    onChange={(e) => handleUpdatePromptInReview(shot.id, e.target.value)}
                    className="w-full text-[10px] font-mono text-slate-300 bg-[#111827] border border-slate-800 p-2 rounded h-21 resize-none focus:outline-none focus:border-cyan-500"
                    placeholder="Mô tả cụ thể bối cảnh, tư thế nhân vật, góc máy và ánh sáng..."
                  />
                </div>

                {/* Reference Images List (Phase 06) */}
                <div className="space-y-2 border-t border-slate-800/60 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                      Tham chiếu Bước 6 (Phase 06):
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAllRefsMap(prev => ({ ...prev, [shot.id]: !prev[shot.id] }))}
                      className="text-[8.5px] font-mono text-[#A5B4FC] bg-[#312E81]/30 border border-[#4338CA]/60 hover:bg-[#1E1B4B] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      {showAllRefsMap[shot.id] ? 'Ẩn đạo cụ / Toàn bộ' : 'Hiện Toàn bộ'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                    {keyElements
                      .filter(el => {
                        if (showAllRefsMap[shot.id]) return true;
                        return shot.characterIds?.includes(el.id) || el.id === shot.locationElementId;
                      })
                      .map(el => {
                        const isAttached = attachedRefs[shot.id]?.includes(el.id);
                        const hasImg = !!el.imageUrl;

                        return (
                          <div 
                            key={el.id}
                            className={`flex items-center justify-between p-1.5 rounded border text-[10px] font-mono transition-all ${
                              isAttached 
                                ? 'bg-cyan-950/20 border-cyan-800/60 text-cyan-200' 
                                : 'bg-[#111827]/40 border-slate-800/80 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate min-w-0 flex-1 mr-2">
                              {hasImg ? (
                                <img 
                                  src={el.imageUrl} 
                                  alt={el.name} 
                                  className="w-6 h-6 rounded object-cover border border-slate-700 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center border border-slate-700 font-extrabold text-[8px] text-slate-500 shrink-0">
                                  N/A
                                </div>
                              )}
                              <div className="truncate text-left">
                                <p className="font-bold text-slate-300 truncate text-[9.5px] leading-tight">{el.name}</p>
                                <p className="text-[8px] text-slate-500 truncate leading-none">{el.id}</p>
                              </div>
                            </div>

                            {hasImg ? (
                              isAttached ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReference(shot.id, el.id)}
                                  className="px-1.5 py-0.5 bg-rose-950/55 hover:bg-rose-900/60 border border-rose-900/50 hover:border-rose-700 text-[8.5px] font-bold text-rose-400 hover:text-white rounded transition-colors cursor-pointer shrink-0"
                                >
                                  Gỡ bớt
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddReference(shot.id, el.id)}
                                  className="px-1.5 py-0.5 bg-cyan-950/50 hover:bg-cyan-600/30 border border-cyan-800 hover:border-cyan-500 text-[8.5px] font-bold text-cyan-400 hover:text-white rounded transition-colors cursor-pointer shrink-0"
                                >
                                  Dùng ảnh
                                </button>
                              )
                            ) : (
                              <span className="text-[8px] text-amber-500 italic shrink-0" title="Chưa tạo ảnh ở Bước 6">
                                Chưa vẽ b6
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-3 mt-1 bg-[#0E1520]/20">
                  <div className="flex items-center space-x-1.5">
                    <button
                      disabled={isGenerating}
                      onClick={() => handleGenerateStartFrame(shot.id, shot.startFramePrompt)}
                      className={`flex-1 py-1.5 px-2.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                        isGenerating
                          ? 'bg-slate-900 border border-slate-800 text-slate-500'
                          : 'bg-[#131924] hover:bg-cyan-950/40 text-slate-200 hover:text-cyan-400 border border-slate-700'
                      }`}
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Camera className="w-3 h-3" />
                      )}
                      <span>{shot.startFrameUrl ? 'Vẽ Lại AI' : 'Vẽ Frame Đầu'}</span>
                    </button>

                    <label className="flex-1 py-1.5 px-2 bg-[#131924] hover:bg-emerald-950/40 text-slate-200 hover:text-emerald-400 border border-slate-700 hover:border-emerald-700 rounded font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1 transition-all cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>Chọn ảnh local</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadLocalImage(shot.id, e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {shot.startFrameUrl && (
                    <span className="py-1 px-3 text-[10.5px] text-center font-mono font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-800/60 rounded flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Đã Khóa Frame Đầu
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav footer */}
      <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-300 hover:bg-[#1E293B]/80 hover:text-white transition-all cursor-pointer"
        >
          &larr; QUAY LẠI BƯỚC 6
        </button>

        <button
          onClick={() => onConfirm(localShots)}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          <span>TIẾP TỤC: DÀN SOẠN PROMPT ĐỘNG CAMERA (SHOT-BY-SHOT)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
