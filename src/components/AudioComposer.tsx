import React, { useState } from 'react';
import { StoryboardShot, AudioPlaybackItem, GlobalBrief, KeyElement } from '../types';
import { handleResponse } from '../utils';
import { Volume2, Play, Square, Sparkles, HelpCircle, Download, FileText, CheckCircle, Music, Radio, Volume1, Loader2 } from 'lucide-react';

interface AudioComposerProps {
  globalBrief: GlobalBrief;
  shots: StoryboardShot[];
  keyElements?: KeyElement[];
  onBack: () => void;
  onRestart: () => void;
}

const voiceDetails: { [key: string]: { name: string, gender: string, style: string, fullLabel: string, desc: string } } = {
  Charon: { name: 'Charon', gender: 'Nam', style: 'Bí ẩn, thì thầm hồi hộp', fullLabel: 'Charon (Nam, Bí ẩn, thì thầm hồi hộp)', desc: 'Bí ẩn, thì thầm hồi hộp' },
  Aoede: { name: 'Aoede', gender: 'Nữ', style: 'Truyền cảm, ngọt ngào, ấm áp', fullLabel: 'Aoede (Nữ, Truyền cảm, ngọt ngào, ấm áp)', desc: 'Truyền cảm, ngọt ngào, ấm áp' },
  Fenrir: { name: 'Fenrir', gender: 'Nam', style: 'Trầm hùng, dũng mãnh, quyền lực', fullLabel: 'Fenrir (Nam, Trầm hùng, dũng mãnh, quyền lực)', desc: 'Trầm hùng, dũng mãnh, quyền lực' },
  Kore: { name: 'Kore', gender: 'Nữ', style: 'Sâu lắng, trầm ấm điện ảnh', fullLabel: 'Kore (Nữ, Sâu lắng, trầm ấm điện ảnh)', desc: 'Sâu lắng, trầm ấm điện ảnh' },
  Puck: { name: 'Puck', gender: 'Nam', style: 'Tươi sáng, năng nổ nhịp nhanh', fullLabel: 'Puck (Nam, Tươi sáng, năng nổ nhịp nhanh)', desc: 'Tươi sáng, năng nổ nhịp nhanh' },
  Hestia: { name: 'Hestia', gender: 'Nữ', style: 'Nhẹ nhàng, mộc mạc thư thái', fullLabel: 'Hestia (Nữ, Nhẹ nhàng, mộc mạc thư thái)', desc: 'Nhẹ nhàng, mộc mạc thư thái' },
  Daphne: { name: 'Daphne', gender: 'Nữ', style: 'Lôi cuốn, kịch tính, lôi kéo', fullLabel: 'Daphne (Nữ, Lôi cuốn, kịch tính, lôi kéo)', desc: 'Lôi cuốn, kịch tính, lôi kéo' },
  Thalia: { name: 'Thalia', gender: 'Nữ', style: 'Vui tươi, trong trẻo, hoạt hình Ghibli', fullLabel: 'Thalia (Nữ, Vui tươi, trong trẻo, hoạt hình Ghibli)', desc: 'Vui tươi, trong trẻo, hoạt hình Ghibli' },
  Calypso: { name: 'Calypso', gender: 'Nữ', style: 'Mê hoặc, trầm buồn rầu rĩ', fullLabel: 'Calypso (Nữ, Mê hoặc, trầm buồn rầu rĩ)', desc: 'Mê hoặc, trầm buồn rầu rĩ' },
  Selene: { name: 'Selene', gender: 'Nữ', style: 'Tinh khôi, chậm rãi thanh tao', fullLabel: 'Selene (Nữ, Tinh khôi, chậm rãi thanh tao)', desc: 'Tinh khôi, chậm rãi thanh tao' },
  Artemis: { name: 'Artemis', gender: 'Nữ', style: 'Mạnh mẽ, sắc sảo hành động', fullLabel: 'Artemis (Nữ, Mạnh mẽ, sắc sảo hành động)', desc: 'Mạnh mẽ, sắc sảo hành động' },
  Athena: { name: 'Athena', gender: 'Nữ', style: 'Trang trọng, thông thái hùng hồn', fullLabel: 'Athena (Nữ, Trang trọng, thông thái hùng hồn)', desc: 'Trang trọng, thông thái hùng hồn' },
  Hera: { name: 'Hera', gender: 'Nữ', style: 'Quý phái, uy nghiêm hoàng gia', fullLabel: 'Hera (Nữ, Quý phái, uy nghiêm hoàng gia)', desc: 'Quý phái, uy nghiêm hoàng gia' },
  Pandora: { name: 'Pandora', gender: 'Nữ', style: 'Tò mò, ngập ngừng hồi hộp', fullLabel: 'Pandora (Nữ, Tò mò, ngập ngừng hồi hộp)', desc: 'Tò mò, ngập ngừng hồi hộp' },
  Penelope: { name: 'Penelope', gender: 'Nữ', style: 'Kiên định, ấm áp và chân thành', fullLabel: 'Penelope (Nữ, Kiên định, ấm áp và chân thành)', desc: 'Kiên định, ấm áp và chân thành' },
  Chloe: { name: 'Chloe', gender: 'Nữ', style: 'Dễ thương, trẻ con ngộ nghĩnh', fullLabel: 'Chloe (Nữ, Dễ thương, trẻ con ngộ nghĩnh)', desc: 'Dễ thương, trẻ con ngộ nghĩnh' },
  Iris: { name: 'Iris', gender: 'Nữ', style: 'Nhanh nhẹn, rực rỡ vui tươi', fullLabel: 'Iris (Nữ, Nhanh nhẹn, rực rỡ vui tươi)', desc: 'Nhanh nhẹn, rực rỡ vui tươi' },
  Cassandra: { name: 'Cassandra', gender: 'Nữ', style: 'U sầu, u ám cảnh báo nguy hiểm', fullLabel: 'Cassandra (Nữ, U sầu, u ám cảnh báo nguy hiểm)', desc: 'U sầu, u ám cảnh báo nguy hiểm' },
  Aeacus: { name: 'Aeacus', gender: 'Nam', style: 'Chững chạc, từ tốn giảng giải', fullLabel: 'Aeacus (Nam, Chững chạc, từ tốn giảng giải)', desc: 'Chững chạc, từ tốn giảng giải' },
  Castor: { name: 'Castor', gender: 'Nam', style: 'Ấm áp, dạt dào cảm xúc tình cảm', fullLabel: 'Castor (Nam, Ấm áp, dạt dào cảm xúc tình cảm)', desc: 'Ấm áp, dạt dào cảm xúc tình cảm' },
  Hermes: { name: 'Hermes', gender: 'Nam', style: 'Lém lỉnh, nhanh nhảu hóm hỉnh', fullLabel: 'Hermes (Nam, Lém lỉnh, nhanh nhảu hóm hỉnh)', desc: 'Lém lỉnh, nhanh nhảu hóm hỉnh' },
  Peleus: { name: 'Peleus', gender: 'Nam', style: 'Già cỗi, phong sương dạn dày', fullLabel: 'Peleus (Nam, Già cỗi, phong sương dạn dày)', desc: 'Già cỗi, phong sương dạn dày' },
  Morpheus: { name: 'Morpheus', gender: 'Nam', style: 'Mơ màng, trầm ấm dịu dàng', fullLabel: 'Morpheus (Nam, Mơ màng, trầm ấm dịu dàng)', desc: 'Mơ màng, trầm ấm dịu dàng' },
  Orion: { name: 'Orion', gender: 'Nam', style: 'Hùng dũng, phiêu lưu hào khí', fullLabel: 'Orion (Nam, Hùng dũng, phiêu lưu hào khí)', desc: 'Hùng dũng, phiêu lưu hào khí' },
  Jason: { name: 'Jason', gender: 'Nam', style: 'Trẻ trung, trung thực quả cảm', fullLabel: 'Jason (Nam, Trẻ trung, trung thực quả cảm)', desc: 'Trẻ trung, trung thực quả cảm' },
  Hector: { name: 'Hector', gender: 'Nam', style: 'Can trường, kiên nghị đầy hy sinh', fullLabel: 'Hector (Nam, Can trường, kiên nghị đầy hy sinh)', desc: 'Can trường, kiên nghị đầy hy sinh' },
  Prometheus: { name: 'Prometheus', gender: 'Nam', style: 'Nhân hậu, thông thái trải đời', fullLabel: 'Prometheus (Nam, Nhân hậu, thông thái trải đời)', desc: 'Nhân hậu, thông thái trải đời' },
  Achilles: { name: 'Achilles', gender: 'Nam', style: 'Ngạo nghễ, đanh thép xung trận', fullLabel: 'Achilles (Nam, Ngạo nghễ, đanh thép xung trận)', desc: 'Ngạo nghễ, đanh thép xung trận' },
  Zeus: { name: 'Zeus', gender: 'Nam', style: 'Uy quyền thống trị, kịch tính dồn dập', fullLabel: 'Zeus (Nam, Uy quyền thống trị, kịch tính dồn dập)', desc: 'Uy quyền thống trị, kịch tính dồn dập' },
  Ares: { name: 'Ares', gender: 'Nam', style: 'Gầm thét, hung bạo dữ dội', fullLabel: 'Ares (Nam, Gầm thét, hung bạo dữ dội)', desc: 'Gầm thét, hung bạo dữ dội' }
};

const backgroundTracks = [
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk Drone (Nghiêm Trọng)',
    mood: 'Tương lai, kịch tính, dồn dập',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    synthType: 'cyberpunk'
  },
  {
    id: 'heartbeat',
    name: 'Suspenseful Heartbeat Thud (Căng Thẳng)',
    mood: 'Hồi hộp, lo âu, nhịp tim lo sợ',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    synthType: 'heartbeat'
  },
  {
    id: 'melancholic',
    name: 'Warm Nostalgic Sine Pad (Hoài Niệm)',
    mood: 'Dịu êm, lắng đọng, trầm tư u sầu',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    synthType: 'melancholic'
  },
  {
    id: 'epic',
    name: 'Dramatic Orchestral Theme (Hoành Tráng)',
    mood: 'Sử thi, hoành tráng, bao la thúc giục',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    synthType: 'epic'
  }
];

export default function AudioComposer({ globalBrief, shots, keyElements = [], onBack, onRestart }: AudioComposerProps) {
  const [voiceActor, setVoiceActor] = useState('Charon'); // Charon by default
  const [isPlayingSynthBgm, setIsPlayingSynthBgm] = useState(false);
  const [activeSynthTone, setActiveSynthTone] = useState<string | null>(null);
  const [bgmVolume, setBgmVolume] = useState(30);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);

  const [selectedTrackId, setSelectedTrackId] = useState('cyberpunk');
  const [isPlayingBgmTrack, setIsPlayingBgmTrack] = useState(false);
  const [activeAudioObj, setActiveAudioObj] = useState<HTMLAudioElement | null>(null);

  const playBrowserSpeechFallback = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voiceInfo = voiceDetails[voiceActor] || voiceDetails['Charon'];
      const isFemale = voiceInfo.gender === 'Nữ';
      const styleText = voiceInfo.style;
      
      // Select best fits for synthesis
      if (isFemale) {
        utterance.pitch = 1.15;
        if (styleText.includes('trầm') || styleText.includes('u sầu')) {
          utterance.pitch = 0.95;
        } else if (styleText.includes('trẻ con') || styleText.includes('vui tươi') || styleText.includes('dễ thương')) {
          utterance.pitch = 1.35;
        }
      } else {
        utterance.pitch = 0.85;
        if (styleText.includes('trầm') || styleText.includes('Mơ màng') || styleText.includes('Già')) {
          utterance.pitch = 0.7;
        } else if (styleText.includes('Lém lỉnh') || styleText.includes('Tươi sáng')) {
          utterance.pitch = 1.1;
        }
      }

      if (styleText.includes('nhanh')) {
        utterance.rate = 1.2;
      } else if (styleText.includes('từ tốn') || styleText.includes('chậm rãi') || styleText.includes('thì thầm')) {
        utterance.rate = 0.8;
      } else {
        utterance.rate = 1.0;
      }

      window.speechSynthesis.speak(utterance);
    } catch (speechErr) {
      console.error('Web Speech API synthesis failed.', speechErr);
    }
  };

  const handlePreviewVoiceActor = async () => {
    setIsPreviewingVoice(true);
    const details = voiceDetails[voiceActor] || voiceDetails['Charon'];
    const parts = details.style.split(',');
    const phongCach = parts[0]?.trim() || '';
    const bieuCam = parts.slice(1).join(',').trim() || '';
    const sampleText = "Đây là giọng đọc " + details.name + " " + details.gender + " " + phongCach + " " + bieuCam + " Hệ thống liên thông với mô đun TTS của Gemini thế hệ mới để kiến thiết giọng nói sinh động, tự nhiên nhất";
    try {
      const customKey = localStorage.getItem('custom_gemini_api_key') || '';
      const response = await fetch('/api/generate-narration', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': customKey
        },
        body: JSON.stringify({
          text: sampleText,
          voice: voiceActor
        })
      });

      const data = await handleResponse<any>(response);

      if (data.isFallback) {
        playBrowserSpeechFallback(sampleText);
      } else if (data.audioData) {
        try {
          let cleanBase64 = data.audioData;
          if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
          }
          cleanBase64 = cleanBase64.replace(/\s+/g, '');
          const remainder = cleanBase64.length % 4;
          if (remainder > 0) {
            cleanBase64 = cleanBase64.padEnd(cleanBase64.length + (4 - remainder), '=');
          }

          const binaryString = atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          
          audio.addEventListener('error', (e) => {
            console.warn('Audio play failed with load error - playing speech synthesis fallback.', e);
            playBrowserSpeechFallback(sampleText);
          });
          
          audio.play().catch(audioPlayErr => {
            console.warn('Audio.play() promise rejected - playing speech synthesis fallback.', audioPlayErr);
            playBrowserSpeechFallback(sampleText);
          });
        } catch (decodeErr) {
          console.warn('Base64 decode or audio instantiation failed - playing speech synthesis fallback.', decodeErr);
          playBrowserSpeechFallback(sampleText);
        }
      }
    } catch (err) {
      console.error(err);
      playBrowserSpeechFallback(sampleText);
    } finally {
      setIsPreviewingVoice(false);
    }
  };

  // Web Audio ambient sound synthesizer state
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [bgmOscillators, setBgmOscillators] = useState<any[]>([]);
  const [bgmGain, setBgmGain] = useState<any>(null);

  const [narrationTracks, setNarrationTracks] = useState<AudioPlaybackItem[]>(() => {
    // Collect all narration lines defined across storyboard shots
    const tracks: AudioPlaybackItem[] = [];
    shots.forEach((s) => {
      if (s.audioLayers.narration?.trim()) {
        tracks.push({
          id: `Narration_${s.id}`,
          type: 'narration',
          name: `Thuyết minh ${s.id}`,
          prompt: s.audioLayers.narration,
          text: s.audioLayers.narration
        });
      }
    });

    // If empty fallback with core voice guidance instruction lines
    if (tracks.length === 0) {
      tracks.push({
        id: 'Narration_Demo_01',
        type: 'narration',
        name: 'Giới thiệu bản thảo',
        prompt: 'Preparing cinematic environment. Initializing all video trackers and motion blocks.',
        text: 'Preparing cinematic environment. Initializing all video trackers and motion blocks.'
      });
    }
    return tracks;
  });

  const [renderingStates, setRenderingStates] = useState<{ [id: string]: 'idle' | 'rendering' | 'ready' | 'failed' }>({});
  const [audioUrls, setAudioUrls] = useState<{ [id: string]: string }>({});

  const handleGenerateNarrationTTS = async (id: string, text: string) => {
    setRenderingStates(prev => ({ ...prev, [id]: 'rendering' }));

    try {
      const customKey = localStorage.getItem('custom_gemini_api_key') || '';
      const response = await fetch('/api/generate-narration', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': customKey
        },
        body: JSON.stringify({
          text,
          voice: voiceActor
        })
      });

      const data = await handleResponse<any>(response);

      if (data.isFallback) {
        // Fallback to high-quality browser Web Speech synthesis API!
        console.log('Using browser-side Speech Synthesis fallback.');
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Choose suitable speech options
        if (voiceActor === 'Kore') {
          utterance.pitch = 0.85;
          utterance.rate = 0.95;
        } else if (voiceActor === 'Puck') {
          utterance.pitch = 1.25;
          utterance.rate = 1.05;
        } else if (voiceActor === 'Aoede') {
          utterance.pitch = 1.1;
          utterance.rate = 1.0;
        } else if (voiceActor === 'Charon') {
          utterance.pitch = 0.75;
          utterance.rate = 0.95;
        } else if (voiceActor === 'Fenrir') {
          utterance.pitch = 0.65;
          utterance.rate = 0.85;
        } else {
          utterance.pitch = 1.0;
          utterance.rate = 0.95;
        }

        // We can synthesize on command on the client. Let's record a mock URL and trigger speech!
        setAudioUrls(prev => ({ ...prev, [id]: 'browser-speech-API-synthesis' }));
        setRenderingStates(prev => ({ ...prev, [id]: 'ready' }));
        return;
      }

      if (data.audioData) {
        try {
          let cleanBase64 = data.audioData;
          if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
          }
          cleanBase64 = cleanBase64.replace(/\s+/g, '');
          const remainder = cleanBase64.length % 4;
          if (remainder > 0) {
            cleanBase64 = cleanBase64.padEnd(cleanBase64.length + (4 - remainder), '=');
          }

          // Decode base64 to Blob
          const binaryString = atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(blob);

          setAudioUrls(prev => ({ ...prev, [id]: audioUrl }));
          setRenderingStates(prev => ({ ...prev, [id]: 'ready' }));
        } catch (decodeErr) {
          console.warn('Base64 decode failure in track TTS generation - falling back to Speech Synthesis.', decodeErr);
          setAudioUrls(prev => ({ ...prev, [id]: 'browser-speech-API-synthesis' }));
          setRenderingStates(prev => ({ ...prev, [id]: 'ready' }));
        }
      } else {
        throw new Error('No audio block returned.');
      }
    } catch (err) {
      console.error(err);
      setRenderingStates(prev => ({ ...prev, [id]: 'failed' }));
      
      // Fallback to speech synthesis
      setAudioUrls(prev => ({ ...prev, [id]: 'browser-speech-API-synthesis' }));
      setRenderingStates(prev => ({ ...prev, [id]: 'ready' }));
    }
  };

  const handlePlayNarration = (id: string, text: string) => {
    const url = audioUrls[id];
    if (url === 'browser-speech-API-synthesis') {
      playBrowserSpeechFallback(text);
    } else if (url) {
      const audio = new Audio(url);
      audio.addEventListener('error', (e) => {
        console.warn('Narration playback load error - falling back to Web Speech synthesis.', e);
        playBrowserSpeechFallback(text);
      });
      audio.play().catch(playErr => {
        console.warn('Narration playback promise rejected - falling back to Web Speech synthesis.', playErr);
        playBrowserSpeechFallback(text);
      });
    }
  };

  // Background Premium Music Controls & Synthesizer Playback
  const stopBgmPlayback = () => {
    // 1. Stop synthesizer loops
    stopSynthAmbientBgm();
    // 2. Stop HTML5 player
    if (activeAudioObj) {
      try {
        activeAudioObj.pause();
        activeAudioObj.currentTime = 0;
      } catch (e) {}
    }
    setIsPlayingBgmTrack(false);
  };

  const startBgmPlayback = (trackId: string) => {
    stopBgmPlayback();
    const track = backgroundTracks.find(t => t.id === trackId) || backgroundTracks[0];
    
    // Play HTML5 loop or fall back to live synthesized oscillators
    try {
      const audio = new Audio(track.url);
      audio.loop = true;
      audio.volume = bgmVolume / 100;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setActiveAudioObj(audio);
            setIsPlayingBgmTrack(true);
          })
          .catch((playErr) => {
            console.warn("HTML5 background audio play was blocked or timed out, enabling high-fidelity browser synthesizer fallback instead.", playErr);
            startSynthAmbientBgm(track.synthType);
            setIsPlayingBgmTrack(true);
          });
      } else {
        setActiveAudioObj(audio);
        setIsPlayingBgmTrack(true);
      }
    } catch (err) {
      console.warn("HTML5 loop creation error, enabling high-fidelity browser synthesizer fallback.", err);
      startSynthAmbientBgm(track.synthType);
      setIsPlayingBgmTrack(true);
    }
  };

  const handleTogglePlayBgm = (trackId: string) => {
    if (isPlayingBgmTrack && selectedTrackId === trackId) {
      stopBgmPlayback();
    } else {
      setSelectedTrackId(trackId);
      startBgmPlayback(trackId);
    }
  };

  // Web Audio custom directors synthesizers
  const startSynthAmbientBgm = (type: string) => {
    try {
      if (isPlayingSynthBgm) {
        stopSynthAmbientBgm();
      }

      const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) setAudioCtx(ctx);

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(bgmVolume / 100, ctx.currentTime);
      mainGain.connect(ctx.destination);

      const oscillatorsList: any[] = [];
      setActiveSynthTone(type);

      if (type === 'cyberpunk') {
        const f = 65.41; // C2 tone
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(f, ctx.currentTime);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(f * 1.5, ctx.currentTime); // G2 fifth chord harmonics

        const oscSub = ctx.createOscillator();
        oscSub.type = 'triangle';
        oscSub.frequency.setValueAtTime(f / 2, ctx.currentTime); // C1 sub

        const biquadFilter = ctx.createBiquadFilter();
        biquadFilter.type = 'lowpass';
        biquadFilter.frequency.setValueAtTime(350, ctx.currentTime);

        osc1.connect(biquadFilter);
        osc2.connect(biquadFilter);
        oscSub.connect(biquadFilter);
        biquadFilter.connect(mainGain);

        osc1.start();
        osc2.start();
        oscSub.start();

        oscillatorsList.push(osc1, osc2, oscSub);
      } else if (type === 'epic') {
        // High quality bright orchestral brass simulation
        const f = 110.00; // A2
        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(f, ctx.currentTime);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(f * 1.5, ctx.currentTime);

        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(f * 2, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(mainGain);

        osc1.start();
        osc2.start();
        osc3.start();

        oscillatorsList.push(osc1, osc2, osc3);
      } else if (type === 'heartbeat') {
        const intervalId = setInterval(() => {
          if (!ctx) return;
          const thud = ctx.createOscillator();
          const thudGain = ctx.createGain();
          thud.type = 'sine';
          thud.frequency.setValueAtTime(45, ctx.currentTime);

          thudGain.gain.setValueAtTime(0, ctx.currentTime);
          thudGain.gain.linearRampToValueAtTime(bgmVolume / 100, ctx.currentTime + 0.05);
          thudGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

          thud.connect(thudGain);
          thudGain.connect(ctx.destination);
          thud.start();
          thud.stop(ctx.currentTime + 0.6);
        }, 900);

        oscillatorsList.push({ mockOsc: true, intervalId });
      } else {
        const oscMel = ctx.createOscillator();
        oscMel.type = 'sine';
        oscMel.frequency.setValueAtTime(220, ctx.currentTime); // A3

        const oscMel2 = ctx.createOscillator();
        oscMel2.type = 'triangle';
        oscMel2.frequency.setValueAtTime(277.18, ctx.currentTime); // C#4

        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (panner) {
          panner.pan.setValueAtTime(-0.3, ctx.currentTime);
          oscMel.connect(panner);
          panner.connect(mainGain);
        } else {
          oscMel.connect(mainGain);
        }
        oscMel2.connect(mainGain);

        oscMel.start();
        oscMel2.start();
        oscillatorsList.push(oscMel, oscMel2);
      }

      setBgmOscillators(oscillatorsList);
      setBgmGain(mainGain);
      setIsPlayingSynthBgm(true);
    } catch (err) {
      console.error('Failed to boot Web Audio Synthesizer:', err);
    }
  };

  const stopSynthAmbientBgm = () => {
    bgmOscillators.forEach((osc) => {
      try {
        if (osc.mockOsc && osc.intervalId) {
          clearInterval(osc.intervalId);
        } else {
          osc.stop();
        }
      } catch (e) {}
    });
    try {
      if (bgmGain) bgmGain.disconnect();
    } catch (e) {}

    setBgmOscillators([]);
    setIsPlayingSynthBgm(false);
    setActiveSynthTone(null);
  };

  const handleUpdateVolume = (vol: number) => {
    setBgmVolume(vol);
    if (activeAudioObj) {
      try {
        activeAudioObj.volume = vol / 100;
      } catch (e) {}
    }
    if (bgmGain && audioCtx) {
      bgmGain.gain.setValueAtTime(vol / 100, audioCtx.currentTime);
    }
  };

  // Export screenplay and full pre-production storyboard JSON package customized for Veo video generation format
  const handleExportFullProject = () => {
    const formattedData = {
      project_info: {
        movie_title: globalBrief.title || 'Untitled Movie',
        summary: globalBrief.scriptText || '',
        roles: keyElements
          .filter(e => e.type === 'character')
          .map(e => ({
            id: e.id,
            name: e.name,
            description: e.description,
            appearance_details: e.appearanceDetails || ""
          }))
      },
      entity_prompts: {
        characters: keyElements
          .filter(e => e.type === 'character')
          .map(e => ({
            id: e.id,
            name: e.name,
            description: e.description,
            image_prompt: e.imagePrompt || "",
            image_url: e.imageUrl || ""
          })),
        locations: keyElements
          .filter(e => e.type === 'location')
          .map(e => ({
            id: e.id,
            name: e.name,
            description: e.description,
            image_prompt: e.imagePrompt || "",
            image_url: e.imageUrl || ""
          })),
        props: keyElements
          .filter(e => e.type === 'prop')
          .map(e => ({
            id: e.id,
            name: e.name,
            description: e.description,
            image_prompt: e.imagePrompt || "",
            image_url: e.imageUrl || ""
          }))
      },
      scenes_video_generation_prompts: shots.map((s, idx) => ({
        shot_id: s.id,
        sequence_number: idx + 1,
        duration_seconds: s.durationSeconds,
        location_id: s.locationElementId,
        character_ids: s.characterIds || [],
        blocking_story_beat: s.storyBeat,
        dialogue: s.dialogue || "",
        cinematography: s.cinematography,
        audio_layers: s.audioLayers,
        start_frame_image_generation_prompt: s.startFramePrompt || "",
        start_frame_image_url: s.startFrameUrl || "",
        video_generation_prompt: s.videoPrompt || "",
        video_url: s.videoUrl || ""
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formattedData, null, 2));
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(globalBrief.title || 'Kick_ban_storyboard').replace(/\s+/g, "_")}_storyboard.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export structured Word Document compatible with MS Word containing English tags and prompt settings
  const handleExportVeo3Prompts = () => {
    const characters = keyElements.filter(e => e.type === 'character');
    const locations = keyElements.filter(e => e.type === 'location');
    const props = keyElements.filter(e => e.type === 'prop');

    const escapeHtml = (text: string) => {
      if (!text) return '';
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const projectTitle = escapeHtml(globalBrief.title || 'Untitled');
    const genres = escapeHtml(globalBrief.genre || 'N/A');
    const style = escapeHtml(globalBrief.visualStyle || 'N/A');
    const ratio = escapeHtml(globalBrief.aspectRatio || '16:9');
    const summary = escapeHtml(globalBrief.scriptText || '');

    let charRows = '';
    characters.forEach(char => {
      charRows += `
        <tr>
          <td><strong>${escapeHtml(char.name)}</strong></td>
          <td>${escapeHtml(char.description)}</td>
          <td>${escapeHtml(char.appearanceDetails || 'N/A')}</td>
          <td><div class="prompt-box">${escapeHtml(char.imagePrompt || 'No image prompt set')}</div></td>
        </tr>
      `;
    });

    let locRows = '';
    locations.forEach(loc => {
      locRows += `
        <tr>
          <td><strong>${escapeHtml(loc.name)}</strong></td>
          <td>${escapeHtml(loc.description)}</td>
          <td><div class="prompt-box">${escapeHtml(loc.imagePrompt || 'No image prompt set')}</div></td>
        </tr>
      `;
    });

    let propRows = '';
    props.forEach(prop => {
      propRows += `
        <tr>
          <td><strong>${escapeHtml(prop.name)}</strong></td>
          <td>${escapeHtml(prop.description)}</td>
          <td><div class="prompt-box">${escapeHtml(prop.imagePrompt || 'No image prompt set')}</div></td>
        </tr>
      `;
    });

    let shotCards = '';
    shots.forEach((shot, index) => {
      const scale = escapeHtml(shot.cinematography?.scale || 'X-Wide');
      const angle = escapeHtml(shot.cinematography?.angle || 'Eye-level');
      const movement = escapeHtml(shot.cinematography?.movement || 'Static');
      const dialogueText = shot.dialogue ? escapeHtml(shot.dialogue.trim()) : '';
      
      shotCards += `
        <div style="border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; background: #ffffff;">
          <h3 style="color: #2563eb; margin-top: 0; font-size: 16px; margin-bottom: 8px; font-weight: bold; font-family: monospace;">
            SHOT #${index + 1} (${shot.durationSeconds || 5}s) - ${scale} | ${angle} | ${movement}
          </h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
            <tr>
              <th style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px; width: 140px; background-color: #f1f5f9; text-align: left;">Location Details</th> 
              <td style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px;">
                ${escapeHtml(locations.find(l => l.id === shot.locationElementId)?.name || shot.locationElementId || 'None')}
              </td>
            </tr>
            <tr>
              <th style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px; background-color: #f1f5f9; text-align: left;">Characters Present</th>
              <td style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px;">
                ${escapeHtml(shot.characterIds?.map(id => characters.find(c => c.id === id)?.name || id).join(', ') || 'None')}
              </td>
            </tr>
            <tr>
              <th style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px; background-color: #f1f5f9; text-align: left;">Action & Story Beat</th>
              <td style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px;">
                ${escapeHtml(shot.storyBeat || 'Main action flow')}
              </td>
            </tr>
            ${dialogueText ? `
            <tr>
              <th style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px; color: #4f46e5; background-color: #f5f3ff; text-align: left;">Verbatim Dialogue</th>
              <td style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px; font-style: italic; color: #4f46e5; background: #f5f3ff;">
                "${dialogueText}"
              </td>
            </tr>
            ` : ''}
            <tr>
              <th style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px; background-color: #f1f5f9; text-align: left;">Audio Layers</th>
              <td style="padding: 6px; border: 1px solid #e2e8f0; font-size: 11px;">
                <strong>SFX:</strong> ${escapeHtml(shot.audioLayers?.sfx || 'None')} | 
                <strong>BGM:</strong> ${escapeHtml(shot.audioLayers?.bgm || 'None')}
              </td>
            </tr>
          </table>

          <div style="margin-top: 10px;">
            <strong style="font-size: 12px; color: #475569;">1. START-FRAME IMAGE GENERATION PROMPT (English):</strong>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px; font-family: 'Courier New', Courier, monospace; font-size: 12px; margin-top: 6px; margin-bottom: 12px; white-space: pre-wrap; color: #0f172a;">${escapeHtml(shot.startFramePrompt || 'No start frame prompt set')}</div>
          </div>

          <div style="margin-top: 10px;">
            <strong style="font-size: 12px; color: #475569;">2. VEO VIDEO GENERATION MOTION PROMPT (English):</strong>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px; font-family: 'Courier New', Courier, monospace; font-size: 12px; margin-top: 6px; margin-bottom: 12px; white-space: pre-wrap; color: #0f172a;">${escapeHtml(shot.videoPrompt || 'No motion prompt set')}</div>
          </div>
        </div>
      `;
    });

    const htmlDoc = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<style>
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    line-height: 1.6;
    color: #1e293b;
    padding: 20px;
  }
  h1 {
    color: #0f172a;
    font-size: 24px;
    border-bottom: 3px solid #06b6d4;
    padding-bottom: 8px;
    margin-top: 20px;
    margin-bottom: 15px;
    text-transform: uppercase;
  }
  h2 {
    color: #1e3a8a;
    font-size: 18px;
    background: #f1f5f9;
    padding: 8px 12px;
    border-left: 5px solid #3b82f6;
    margin-top: 30px;
    margin-bottom: 12px;
  }
  h3 {
    color: #334155;
    font-size: 14px;
    margin-top: 15px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 3px;
    text-transform: uppercase;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    margin-bottom: 20px;
  }
  th {
    background-color: #f8fafc;
    color: #334155;
    font-weight: bold;
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    font-size: 12px;
    text-align: left;
  }
  td {
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    font-size: 12px;
  }
  .prompt-box {
    background-color: #f8fafc;
    border: 1px dashed #cbd5e1;
    padding: 10px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    margin-top: 6px;
    margin-bottom: 12px;
    white-space: pre-wrap;
    color: #0f172a;
  }
</style>
</head>
<body>
  <h1>VEO 3 PRE-PRODUCTION STORYBOARD & PROMPTS PACKAGE</h1>
  
  <h2>1. GENERAL PROJECT INFORMATION</h2>
  <table>
    <tr>
      <th style="width: 25%;">Movie Title</th>
      <td><strong>${projectTitle}</strong></td>
    </tr>
    <tr>
      <th>Genre</th>
      <td>${genres}</td>
    </tr>
    <tr>
      <th>Aspect Ratio / Frame Size</th>
      <td>${ratio}</td>
    </tr>
    <tr>
      <th>Visual Art Style</th>
      <td>${style}</td>
    </tr>
    <tr>
      <th>Key Language / Audio Format</th>
      <td>${escapeHtml(globalBrief.language || 'Tiếng Việt')}</td>
    </tr>
    <tr>
      <th>Overall Synopsis / Description</th>
      <td>${summary}</td>
    </tr>
  </table>

  <h2>2. ASSET ENTITY PROMPTS FOR VEO GENERATION</h2>
  
  <h3>a. Characters & Cast Details</h3>
  ${charRows ? `
  <table>
    <thead>
      <tr>
        <th style="width: 15%; background-color: #f1f5f9;">Name</th>
        <th style="width: 30%; background-color: #f1f5f9;">Core Description</th>
        <th style="width: 25%; background-color: #f1f5f9;">Detailed Appearance</th>
        <th style="background-color: #f1f5f9;">Start-Frame Avatar Prompt (English)</th>
      </tr>
    </thead>
    <tbody>
      ${charRows}
    </tbody>
  </table>
  ` : '<p style="font-style: italic; color: #64748b;">No main characters defined for this script.</p>'}

  <h3>b. Location Environments</h3>
  ${locRows ? `
  <table>
    <thead>
      <tr>
        <th style="width: 15%; background-color: #f1f5f9;">Location Name</th>
        <th style="width: 45%; background-color: #f1f5f9;">Atmosphere & Details</th>
        <th style="background-color: #f1f5f9;">Start-Frame Space Prompt (English)</th>
      </tr>
    </thead>
    <tbody>
      ${locRows}
    </tbody>
  </table>
  ` : '<p style="font-style: italic; color: #64748b;">No environment locations defined for this script.</p>'}

  <h3>c. Dynamic Props & Elements</h3>
  ${propRows ? `
  <table>
    <thead>
      <tr>
        <th style="width: 15%; background-color: #f1f5f9;">Prop Name</th>
        <th style="width: 45%; background-color: #f1f5f9;">Core Function & Mechanics</th>
        <th style="background-color: #f1f5f9;">Prop Reference Prompt (English)</th>
      </tr>
    </thead>
    <tbody>
      ${propRows}
    </tbody>
  </table>
  ` : '<p style="font-style: italic; color: #64748b;">No dynamic props defined for this script.</p>'}

  <h2>3. VIDEO PRODUCTION PROMPTS FOR EACH FILM SHOT</h2>
  ${shotCards}
  
  <p style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    Generated automatically by Director Suite Video Generator package compiler
  </p>
</body>
</html>
`;

    const mimeType = 'application/msword;charset=utf-8';
    const blob = new Blob([htmlDoc], { type: mimeType });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = downloadUrl;
    downloadAnchor.download = `${(globalBrief.title || 'Kick_ban_storyboard').replace(/\s+/g, "_")}_veo3_prompts.doc`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="bg-[#0B0F19] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6 w-full">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-lg font-extrabold text-[#F1F5F9] font-mono flex items-center gap-2 uppercase tracking-wide">
          <span className="inline-block w-2.5 h-6 bg-cyan-500 rounded-sm"></span>
          TRẠM HOÀ ÂM HẬU KỲ CHI TIẾT (PRE-PRODUCTION AUDIO STATION)
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          BƯỚC 8: Hoạch định thảm nhạc nền, tạo tiếng nói AI chuẩn diễn đạt và hiệu chỉnh âm vòm bối cảnh của thước phim.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Synth BGM Ambient station box */}
        <div className="p-5 border border-slate-800 rounded-xl bg-[#0F1722]/55 space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Music className="w-4 h-4 text-cyan-400" />
            NHẠC NỀN BỐI CẢNH (SYNTHESIZER TRACK)
          </h3>
          <p className="text-xs text-slate-400 leading-normal">
            Lựa chọn bài nhạc mẫu (không lời) tương ứng với mỗi gam màu nhạc cảm để phát thính giác điện ảnh đồng thời:
          </p>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 tracking-wider mb-1.5 uppercase">Chọn gam màu nhạc cảm</label>
              <select
                value={selectedTrackId}
                onChange={(e) => {
                  const trackId = e.target.value;
                  setSelectedTrackId(trackId);
                  if (isPlayingBgmTrack) {
                    startBgmPlayback(trackId);
                  }
                }}
                className="w-full p-2 text-xs bg-[#111827] border border-slate-800 rounded font-mono text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {backgroundTracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-[#111827] rounded border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-cyan-405 text-cyan-400 font-bold uppercase block leading-none mb-1">XÚC CẢM NHẠC TRƯỜNG</span>
                <span className="text-xs text-slate-300 block font-medium truncate">
                  {backgroundTracks.find(t => t.id === selectedTrackId)?.mood}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePlayBgm(selectedTrackId)}
                className={`py-1.5 px-3 rounded font-mono text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer select-none ${
                  isPlayingBgmTrack
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)] border-none'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)] border-none'
                }`}
              >
                <Play className={`w-3 h-3 ${isPlayingBgmTrack ? 'animate-pulse' : ''}`} />
                <span>{isPlayingBgmTrack ? 'Dừng' : 'Nghe thử'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-1.5">
            <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
              <span>ÂM LƯỢNG NHẠC NỀN CHỦ:</span>
              <span className="text-cyan-405 text-cyan-400">{bgmVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={bgmVolume}
              onChange={(e) => handleUpdateVolume(parseInt(e.target.value) || 0)}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Narrative Speak-Over generator box */}
        <div className="p-5 border border-slate-800 rounded-xl bg-[#0F1722]/55 space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            Tuyển chọn diễn viên đọc thoại (Narration VOICE)
          </h3>
          <p className="text-xs text-slate-400 leading-normal">
            Lựa chọn diễn giả đọc thuyết minh lời thoại để bộc lộ cảm xúc sâu sắc và rõ nét nhất:
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-mono font-bold text-slate-500 tracking-wider mb-1.5 uppercase">Giọng đọc mẫu</label>
              <select
                value={voiceActor}
                onChange={(e) => setVoiceActor(e.target.value)}
                className="w-full p-2 text-xs bg-[#111827] border border-slate-800 rounded font-mono text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer text-ellipsis overflow-hidden"
              >
                {Object.keys(voiceDetails).map((key) => {
                  const details = voiceDetails[key];
                  return (
                    <option key={key} value={key}>
                      {details.name} ({details.gender}, {details.style})
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              type="button"
              onClick={handlePreviewVoiceActor}
              disabled={isPreviewingVoice}
              className="w-full sm:w-auto py-2 px-3 bg-[#131924] hover:bg-cyan-955 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 border border-slate-700 rounded font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer h-[34px]"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPreviewingVoice ? 'animate-bounce' : ''}`} />
              <span>{isPreviewingVoice ? 'Đang đọc mẫu...' : 'Nghe thử giọng'}</span>
            </button>
          </div>

          <div className="p-3 bg-[#0F172A] rounded text-[11px] text-slate-400 leading-relaxed italic border border-slate-800">
            * Hệ thống liên thông với mô đun TTS của Gemini thế hệ mới để kiến thiết giọng nói sinh động, tự nhiên nhất.
          </div>
        </div>
      </div>

      {/* List of dialogue speak lines to trigger */}
      <div className="space-y-4 mb-8">
        <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2.5">DANH SÁCH LỜI THOẠI THUYẾT MINH PHIM (NARRATION DECKS)</h3>
        {narrationTracks.map((item) => {
          const state = renderingStates[item.id] || 'idle';
          const isReady = state === 'ready';
          const isRendering = state === 'rendering';

          return (
            <div
              key={item.id}
              className="p-4 border border-slate-800 hover:border-slate-700 rounded-xl bg-[#111827]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-cyan-405 text-cyan-400 bg-[#0A1D20]/50 border border-cyan-800/80 font-mono font-bold px-2 py-0.5 rounded">
                  {item.name}
                </span>
                <p className="text-xs font-sans font-medium text-[#F1F5F9] mt-1.5">
                  "{item.text}"
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isReady ? (
                  <button
                    onClick={() => handlePlayNarration(item.id, item.text || '')}
                    className="py-1.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded font-mono text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  >
                    <Play className="w-3 h-3 fill-white text-white" /> Phát Audio
                  </button>
                ) : (
                  <button
                    disabled={isRendering}
                    onClick={() => handleGenerateNarrationTTS(item.id, item.text || '')}
                    className={`py-1.5 px-3 rounded font-mono text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isRendering 
                        ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-wait' 
                        : 'bg-[#131924] text-slate-200 hover:bg-[#1E293B] border border-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    {isRendering ? 'AI Có Sẵn...' : 'Tạo Phục Âm'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Finish and export pack block */}
      <div className="p-6 bg-[#0E1524] border border-cyan-950/60 text-white rounded-xl space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <CheckCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wider font-mono">DỰ ÁN SẴN SÀNG CHO SẢN XUẤT (EXPORT PRODUCTION PACK)</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Tất cả cấu trúc 9 bước bao gồm tóm tắt, bảng cảnh split 5s, thư viện mô tả bối cảnh/diễn viên dạng pixel, thảm âm, tháp video prompt đã hoàn chỉnh. Hãy tải gói này về để tiếp tục nạp vào các nền tảng sinh tạo video hoặc chỉnh sửa hậu kỳ chuyên nghiệp.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleExportFullProject}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            Tải Storyboard JSON
          </button>

          <button
            onClick={handleExportVeo3Prompts}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] cursor-pointer"
          >
            <FileText className="w-4 h-4 text-white" />
            Tải Veo 3 Prompts
          </button>

          <button
            onClick={onRestart}
            className="group relative overflow-hidden py-3 px-8 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-700 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.8)] active:scale-95 active:shadow-[0_0_50px_rgba(34,211,238,1)] active:brightness-125 cursor-pointer selection:bg-transparent border-none"
          >
            {/* Shimmer sweep effect */}
            <span className="absolute inset-0 w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[450px] transition-transform duration-1000 ease-out pointer-events-none" />
            
            <CheckCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-300" />
            <span>HOÀN THÀNH</span>
          </button>
        </div>
      </div>

      {/* Stepper buttons footer */}
      <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-300 hover:bg-[#1E293B]/80 hover:text-white transition-all cursor-pointer"
        >
          &larr; QUAY LẠI BƯỚC 8
        </button>
        <span className="text-xs font-mono text-slate-500 flex items-center">
          Director Suite v1.0.0
        </span>
      </div>
    </div>
  );
}
