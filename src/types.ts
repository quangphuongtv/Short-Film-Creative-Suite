export interface GlobalBrief {
  title: string;
  genre: string;
  aspectRatio: string;
  visualStyle: string;
  language: string;
  scriptText: string;
}

export interface SceneBreakdownItem {
  id: string;
  sequenceOrder: number;
  description: string;
  durationSeconds: number; // strictly <= 5 seconds
  transitionLogic?: string;
}

export type ElementType = 'character' | 'location' | 'prop';

export interface KeyElement {
  id: string; // e.g., Element_Alley_Night, Element_Main_Character
  type: ElementType;
  name: string;
  description: string;
  appearanceDetails?: string; // age, build, hair, skin tone, wardrobe (looks)
  looks?: string[]; // different looks list
  imagePrompt?: string; // reference image prompt
  imageUrl?: string; // generated image URL
  isGenerating?: boolean;
}

export interface StoryboardShot {
  id: string; // Shot_01, Shot_02 ...
  sceneId: string; // maps to scene order/id
  locationElementId: string; // references KeyElement of type 'location'
  characterIds: string[]; // references KeyElement characters in shot
  durationSeconds: number; // strictly <= 5 seconds
  storyBeat: string; // physical action & character blocking
  dialogue?: string; // verbatim dialogue lines
  cinematography: {
    scale: string; // close-up, medium, wide, extreme close-up
    angle: string; // low angle, high angle, eye-level
    movement: string; // static, slow push-in, handheld drift
  };
  audioLayers: {
    bgm?: string; // BGM details
    narration?: string; // Voiceover if applicable
    sfx?: string; // sound effects
  };
  startFramePrompt?: string; // Prompts for the image frame
  videoPrompt?: string; // Motion-focused video prompt
  startFrameUrl?: string; // Reference image URL
  videoUrl?: string; // Mock or generated video representation URL
  isGeneratingStartFrame?: boolean;
  isGeneratingVideo?: boolean;
}

export interface AudioPlaybackItem {
  id: string;
  type: 'bgm' | 'narration' | 'sfx';
  name: string;
  prompt: string;
  text?: string; // raw narration text if any
  audioUrl?: string;
  isGenerating?: boolean;
}

export interface ProjectState {
  currentStep: number; // 1 to 9
  globalBrief: GlobalBrief;
  scenes: SceneBreakdownItem[];
  keyElements: KeyElement[];
  storyboard: StoryboardShot[];
  audioPlayback: AudioPlaybackItem[];
}
