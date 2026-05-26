import { jsPDF } from 'jspdf';
import { StoryboardShot, GlobalBrief, KeyElement } from '../types';

let cachedFontBase64: string | null = null;

// Convert ArrayBuffer to Base64 safely
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Fetch Unicode Roboto font from CDN to support Vietnamese characters
async function fetchRobotoFont(): Promise<string | null> {
  if (cachedFontBase64) return cachedFontBase64;
  try {
    const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
    const response = await fetch(fontUrl);
    if (!response.ok) throw new Error('CDN status ' + response.status);
    const arrayBuffer = await response.arrayBuffer();
    cachedFontBase64 = arrayBufferToBase64(arrayBuffer);
    return cachedFontBase64;
  } catch (err) {
    console.warn('Unable to load Roboto font from CDN. Characters with Vietnamese marks will rely on default font fallback.', err);
    return null;
  }
}

// Convert image url to base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  try {
    // We add absolute crossOrigin for fetch in case
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Failed to load storyboard image for PDF compilation:', url, err);
    return null;
  }
}

// Sanitize Vietnamese text if we are falling back to Helvetica (to prevent raw gibberish characters)
function sanitizeText(str: string, useFallback: boolean): string {
  if (!str) return '';
  if (!useFallback) return str;
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export async function generateStoryboardPDF(
  globalBrief: GlobalBrief,
  shots: StoryboardShot[],
  keyElements: KeyElement[] = []
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Fetch Vietnamese Font support
  const fontBase64 = await fetchRobotoFont();
  let useFallbackFont = !fontBase64;

  if (fontBase64) {
    try {
      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');
    } catch (e) {
      console.warn('Failed to register Roboto font in jsPDF VFS, falling back to Helvetica.', e);
      useFallbackFont = true;
    }
  }

  if (useFallbackFont) {
    doc.setFont('Helvetica');
  }

  // Preset measurements
  const lm = 15; // Left margin
  const tm = 15; // Top margin
  const pw = 180; // Printable width (210 - 2*15)
  
  // Header Style Helpers
  const primaryDark = [15, 23, 42]; // #0F172A Slate 900
  const secondaryGray = [71, 85, 105]; // #475569 Slate 600
  const cyanAccent = [6, 182, 212]; // #06B6D4 Cyan 500

  // 2. Load all imagery in parallel to feed into the PDF cells
  const imageMap: { [url: string]: string } = {};
  try {
    const urlsToLoad = shots
      .map(s => s.startFrameUrl)
      .filter((u): u is string => typeof u === 'string' && u.length > 0);
    
    // De-duplicate
    const uniqueUrls = Array.from(new Set(urlsToLoad));
    const results = await Promise.all(
      uniqueUrls.map(async (url) => {
        const b64 = await loadImageAsBase64(url);
        return { url, b64 };
      })
    );

    results.forEach(res => {
      if (res.b64) {
        imageMap[res.url] = res.b64;
      }
    });
  } catch (imgErr) {
    console.warn('Error loading storyboard images:', imgErr);
  }

  // 3. Document Title Page / Header section
  const drawPageHeaderAndBrief = () => {
    // Banner colored background box (Slate 900)
    doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.roundedRect(lm, tm, pw, 32, 2, 2, 'F');

    // Title accent bar (Cyan 500)
    doc.setFillColor(cyanAccent[0], cyanAccent[1], cyanAccent[2]);
    doc.rect(lm + 5, tm + 5, 2, 22, 'F');

    // Project Name and Subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    const titleText = sanitizeText(globalBrief.title ? globalBrief.title.toUpperCase() : 'KỊCH BẢN PHẦN CẢNH CHƯA CÓ TIÊU ĐỀ', useFallbackFont);
    doc.text(titleText, lm + 11, tm + 12);

    doc.setTextColor(165, 180, 252); // indigo-300
    doc.setFontSize(7.5);
    doc.text('GÓI TIỀN SẢN XUẤT ĐIỆN ẢNH CHUYÊN NGHIỆP  |  STORYBOARD PRE-PRODUCTION PACKAGE', lm + 11, tm + 18);

    doc.setTextColor(203, 213, 225); // slate-300
    doc.setFontSize(7.5);
    doc.text(`ĐỘNG CƠ CÔNG CỤ: DIRECTOR SUITE V1.0  |  NGÔN NGỮ: ${globalBrief.language || 'Tiếng Việt'}`, lm + 11, tm + 24);

    // Global Brief meta card (Slate 500 border, transparent background)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(lm, tm + 38, pw, 26, 1.5, 1.5, 'D');

    // Info header line
    doc.setFillColor(248, 250, 252); // grey background
    doc.rect(lm + 1, tm + 39, pw - 2, 7, 'F');

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(7.5);
    
    const genreStr = sanitizeText(`THỂ LOẠI: ${globalBrief.genre || 'N/A'}`, useFallbackFont);
    const ratioStr = sanitizeText(`TỶ LỆ KHUNG: ${globalBrief.aspectRatio || '16:9'}`, useFallbackFont);
    const styleStr = sanitizeText(`TRỰC QUAN STYLE: ${globalBrief.visualStyle || 'N/A'}`, useFallbackFont);
    
    doc.text(`${genreStr}   |   ${ratioStr}   |   ${styleStr}`, lm + 5, tm + 44);

    // Synopsis / Description text
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    const rawSynopsis = globalBrief.scriptText || 'Kịch bản phân cảnh sáng tự động.';
    const synopsisStr = sanitizeText(`Tóm tắt cốt truyện: ${rawSynopsis}`, useFallbackFont);
    const wrapSynopsis = doc.splitTextToSize(synopsisStr, pw - 10);
    const slicedSynopsis = wrapSynopsis.slice(0, 2);
    for (let i = 0; i < slicedSynopsis.length; i++) {
      doc.text(slicedSynopsis[i], lm + 5, tm + 51 + (i * 3.5));
    }
  };

  // Helper mapping IDs to Human Names
  const getLocationName = (locId: string) => {
    const found = keyElements.find(e => e.id === locId && e.type === 'location');
    return found ? found.name : locId;
  };

  const getCharacterNames = (charIds: string[]) => {
    if (!charIds || charIds.length === 0) return 'None';
    return charIds.map(id => {
      const found = keyElements.find(e => e.id === id && e.type === 'character');
      return found ? found.name : id;
    }).join(', ');
  };

  // 4. Render Storyboard Shots
  let currentY = tm + 70; // Start position for shots on Page 1
  let currentPage = 1;

  // Let's print each shot
  for (let idx = 0; idx < shots.length; idx++) {
    const shot = shots[idx];
    const shotBoxHeight = 73; // standard outer container box height

    // Check if we need to advance to a new page
    // Page 1 can fit 2 shots (70mm starting, left space 297 - 15 - 70 = 212mm. Fits two 73mm boxes = 146mm nicely)
    // Page 2+ starts at Y = 20, can fit up to 3 shots (20 + 3*73 + 2*5 = 249mm. Fits nicely)
    const pageLimit = 282; // Max Y-coordinate before push to next page
    if (currentY + shotBoxHeight > pageLimit) {
      doc.addPage();
      currentPage++;
      doc.setPage(currentPage);
      
      // Page N Header
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      const pageHeaderTitle = sanitizeText(`${globalBrief.title ? globalBrief.title.toUpperCase() : 'STORYBOARD'} - KỊCH BẢN CHI TIẾT`, useFallbackFont);
      doc.text(pageHeaderTitle, lm, 12);
      doc.text(`TRANG ${currentPage}`, lm + pw - 15, 12);
      
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.25);
      doc.line(lm, 14, lm + pw, 14);

      currentY = 18; // reset current Y coordinate
    }

    if (currentPage === 1 && idx === 0) {
      // Draw first page header & brief
      drawPageHeaderAndBrief();
    }

    // A. Draw Outer Border Container for this Shot Panel
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(lm, currentY, pw, shotBoxHeight, 2, 2, 'FD');

    // B. Left Image Reference Container
    const imgX = lm + 4;
    const imgY = currentY + 4;
    const imgW = 60;
    const imgH = 43; // elegant aspect ratio matching movie scene

    // B1. Draw image border / base
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.2);
    doc.rect(imgX, imgY, imgW, imgH);

    // B2. If startFrameUrl imagery data is present, draw it
    const hasImage = shot.startFrameUrl && imageMap[shot.startFrameUrl];
    if (hasImage && shot.startFrameUrl) {
      try {
        const base64Data = imageMap[shot.startFrameUrl];
        // Determine image extension format
        let imgFormat = 'JPEG';
        if (base64Data.includes('image/png')) {
          imgFormat = 'PNG';
        } else if (base64Data.includes('image/webp')) {
          imgFormat = 'WEBP';
        }
        doc.addImage(base64Data, imgFormat, imgX, imgY, imgW, imgH, undefined, 'FAST');
      } catch (imgErr) {
        console.warn('Error inserting image to PDF document:', imgErr);
        // Fallback placeholder grey box
        doc.setFillColor(241, 245, 249);
        doc.rect(imgX + 0.1, imgY + 0.1, imgW - 0.2, imgH - 0.2, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.text(sanitizeText('(Reference Frame)', useFallbackFont), imgX + imgW / 2, imgY + imgH / 2, { align: 'center' });
      }
    } else {
      // Drawing elegant abstract frame placeholder
      doc.setFillColor(248, 250, 252); // slate 50
      doc.rect(imgX + 0.1, imgY + 0.1, imgW - 0.2, imgH - 0.2, 'F');

      // Camera focal lines decoration
      doc.setDrawColor(226, 232, 240);
      doc.line(imgX, imgY, imgX + 5, imgY + 5);
      doc.line(imgX + imgW, imgY, imgX + imgW - 5, imgY + 5);
      doc.line(imgX, imgY + imgH, imgX + 5, imgY + imgH - 5);
      doc.line(imgX + imgW, imgY + imgH, imgX + imgW - 5, imgY + imgH - 5);

      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFontSize(7.5);
      doc.text(sanitizeText('(Khung Cảnh Trực Quan)', useFallbackFont), imgX + imgW / 2, imgY + imgH / 2 - 2, { align: 'center' });
      doc.setFontSize(6.5);
      doc.text(sanitizeText('[Chưa Thiết Lập Hình Ảnh]', useFallbackFont), imgX + imgW / 2, imgY + imgH / 2 + 3, { align: 'center' });
    }

    // B3. Shot Visual Prompt below the image
    const promptY = imgY + imgH + 3.5;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('', 'bold');
    doc.text(sanitizeText('CHI CHÚ CẢNH TRỰC QUAN (IMAGE PROMPT):', useFallbackFont), imgX, promptY);
    
    doc.setFont('', 'normal');
    doc.setTextColor(148, 163, 184);
    const pmtText = shot.startFramePrompt || 'No prompt set.';
    const pmtSanitized = sanitizeText(pmtText, useFallbackFont);
    const wrapPrompt = doc.splitTextToSize(pmtSanitized, imgW);
    // Draw max 3 lines of visual prompt to avoid overlaying coordinates
    const slicedPrompt = wrapPrompt.slice(0, 3);
    for (let i = 0; i < slicedPrompt.length; i++) {
      doc.text(slicedPrompt[i], imgX, promptY + 3 + (i * 2.8));
    }

    // C. Right Information Column
    const textX = imgX + imgW + 6;
    const textW = pw - imgW - 14; // remaining printable width inside cell

    // C1. Header for Shot Name, duration
    doc.setFontSize(9.5);
    doc.setFont('', 'bold');
    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    const shotLabel = sanitizeText(`PHÂN CẢNH #${idx + 1} (${shot.durationSeconds || 5} GIÂY)`, useFallbackFont);
    doc.text(shotLabel, textX, currentY + 8);

    // C2. Cinematographic Settings Badges/Line
    doc.setFontSize(7.5);
    const scaleLabel = sanitizeText(`Cỡ cảnh: ${shot.cinematography?.scale || 'X-Wide'}`, useFallbackFont);
    const angleLabel = sanitizeText(`Góc máy: ${shot.cinematography?.angle || 'Eye-level'}`, useFallbackFont);
    const movementLabel = sanitizeText(`Di chuyển: ${shot.cinematography?.movement || 'Static'}`, useFallbackFont);
    doc.setTextColor(cyanAccent[0], cyanAccent[1], cyanAccent[2]);
    doc.text(`${scaleLabel}  |  ${angleLabel}  |  ${movementLabel}`, textX, currentY + 12.5);

    // Border line separator inside right column
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.25);
    doc.line(textX, currentY + 14.5, textX + textW, currentY + 14.5);

    // C3. Scene Settings (Location & Characters in shot)
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7.5);
    
    // Format Location
    const locId = shot.locationElementId || 'None';
    const locName = getLocationName(locId);
    doc.setFont('', 'bold');
    doc.text(sanitizeText('Bối cảnh: ', useFallbackFont), textX, currentY + 18.5);
    doc.setFont('', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(sanitizeText(locName, useFallbackFont), textX + 13, currentY + 18.5);

    // Format Characters
    doc.setTextColor(71, 85, 105);
    doc.setFont('', 'bold');
    doc.text(sanitizeText('Nhân vật: ', useFallbackFont), textX, currentY + 22.5);
    doc.setFont('', 'normal');
    doc.setTextColor(15, 23, 42);
    const charNames = getCharacterNames(shot.characterIds || []);
    doc.text(sanitizeText(charNames, useFallbackFont), textX + 13, currentY + 22.5);

    // C4. Story Beat / Physical Action Description
    doc.setTextColor(71, 85, 105);
    doc.setFont('', 'bold');
    doc.text(sanitizeText('Hành động chủ: ', useFallbackFont), textX, currentY + 28);
    
    doc.setFont('', 'normal');
    doc.setTextColor(51, 65, 85);
    const beatText = shot.storyBeat || 'Cảnh hành động không lời thoại.';
    const beatSanitized = sanitizeText(beatText, useFallbackFont);
    const wrapBeat = doc.splitTextToSize(beatSanitized, textW - 2);
    const slicedBeat = wrapBeat.slice(0, 3); // Max 3 lines of storybeat
    for (let i = 0; i < slicedBeat.length; i++) {
      doc.text(slicedBeat[i], textX, currentY + 31.8 + (i * 3.3));
    }

    // C5. Dialogue (If present)
    const dialogueStartY = currentY + 44;
    if (shot.dialogue && shot.dialogue.trim().length > 0) {
      doc.setTextColor(99, 102, 241); // Indigo color for dialogue
      doc.setFont('', 'bold');
      doc.text(sanitizeText('Lời thoại thoại thuyết minh: ', useFallbackFont), textX, dialogueStartY);
      
      doc.setFont('', 'normal');
      doc.setTextColor(79, 70, 229);
      const dialSanitized = sanitizeText(`"${shot.dialogue}"`, useFallbackFont);
      const wrapDial = doc.splitTextToSize(dialSanitized, textW - 4);
      const slicedDial = wrapDial.slice(0, 2); // Max 2 lines of dialogue
      for (let i = 0; i < slicedDial.length; i++) {
        doc.text(slicedDial[i], textX + 2, dialogueStartY + 3.8 + (i * 3.3));
      }
    } else {
      doc.setTextColor(148, 163, 184);
      doc.setFont('', 'italic');
      doc.text(sanitizeText('[Cảnh tĩnh / Không lời thoại thoại]', useFallbackFont), textX, dialogueStartY + 1);
    }

    // C6. Audio Tracks references at bottom of Right Column
    const audioStartY = currentY + 57;
    doc.setDrawColor(241, 245, 249);
    doc.line(textX, audioStartY - 1.5, textX + textW, audioStartY - 1.5);

    doc.setFont('', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7);
    doc.text(sanitizeText('HOẠ CA ÂM THANH (AUDIO SYNTH LAYERS):', useFallbackFont), textX, audioStartY + 1);
    
    doc.setFont('', 'normal');
    doc.setTextColor(100, 116, 139);
    const bgmDesc = shot.audioLayers?.bgm || 'Màu Cyberpunk dồn dập';
    const sfxDesc = shot.audioLayers?.sfx || 'Tiếng gió vòm động cơ';
    doc.text(sanitizeText(`• Nhạc nền (BGM): ${bgmDesc}`, useFallbackFont), textX + 1, audioStartY + 5);
    doc.text(sanitizeText(`• Tiếng động (SFX): ${sfxDesc}`, useFallbackFont), textX + 1, audioStartY + 8.8);

    // Progress current Y to draw the next storyboard panel
    currentY += shotBoxHeight + 5; // adding 5mm spacing between boxes
  }

  // 5. Download triggering
  const filename = `${globalBrief.title ? globalBrief.title.replace(/\s+/g, '_') : 'Kick_ban_storyboard'}_storyboard.pdf`;
  doc.save(filename);
}
