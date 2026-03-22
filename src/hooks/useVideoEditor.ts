import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';

interface Clip {
  id: string;
  start: number;
  duration: number;
  videoUrl: string;
  transform?: {
    x?: number;
    y?: number;
    scale?: number;
    rotate?: number;
  };
}

interface VideoEditorState {
  composition: {
    videoUrl: string;
    clips: Clip[];
    effects: any[];
  };
  currentTime: number;
  isPlaying: boolean;
  selectedClipId: string | null;

  // Actions
  addClip: (videoUrl: string, start: number, duration: number) => void;
  removeClip: (id: string) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  setCurrentTime: (time: number) => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  selectClip: (id: string | null) => void;
  exportVideo: () => Promise<void>;

  // Agent-friendly helpers
  trimClip: (id: string, newStart: number, newDuration: number) => void;
  scaleClip: (id: string, scale: number) => void;
  rotateClip: (id: string, degrees: number) => void;
  moveClip: (id: string, x: number, y: number) => void;
  removeAllClips: () => void;
  getClipById: (id: string) => Clip | undefined;
}

export const useVideoEditor = create<VideoEditorState>()(
  immer((set, get) => ({
    composition: {
      videoUrl: '',
      clips: [],
      effects: [],
    },
    currentTime: 0,
    isPlaying: false,
    selectedClipId: null,

    addClip: (videoUrl, start, duration) =>
      set((state) => {
        state.composition.clips.push({
          id: nanoid(),
          start,
          duration,
          videoUrl,
        });
      }),

    removeClip: (id) =>
      set((state) => {
        state.composition.clips = state.composition.clips.filter(
          (clip) => clip.id !== id
        );
      }),

    updateClip: (id, updates) =>
      set((state) => {
        const clip = state.composition.clips.find((c) => c.id === id);
        if (clip) {
          Object.assign(clip, updates);
        }
      }),

    setCurrentTime: (time) =>
      set((state) => {
        state.currentTime = time;
      }),

    play: () =>
      set((state) => {
        state.isPlaying = true;
      }),

    pause: () =>
      set((state) => {
        state.isPlaying = false;
      }),

    seek: (time) =>
      set((state) => {
        state.currentTime = time;
        state.isPlaying = false;
      }),

    selectClip: (id) =>
      set((state) => {
        state.selectedClipId = id;
      }),

    exportVideo: async () => {
      // TODO: Implement export functionality
      // This will require server-side rendering via Edge Function
      console.log('Export video not yet implemented');
    },

    // Agent-friendly helpers
    trimClip: (id, newStart, newDuration) =>
      set((state) => {
        const clip = state.composition.clips.find((c) => c.id === id);
        if (clip) {
          clip.start = newStart;
          clip.duration = newDuration;
        }
      }),

    scaleClip: (id, scale) =>
      set((state) => {
        const clip = state.composition.clips.find((c) => c.id === id);
        if (clip) {
          if (!clip.transform) clip.transform = {};
          clip.transform.scale = scale;
        }
      }),

    rotateClip: (id, degrees) =>
      set((state) => {
        const clip = state.composition.clips.find((c) => c.id === id);
        if (clip) {
          if (!clip.transform) clip.transform = {};
          clip.transform.rotate = degrees;
        }
      }),

    moveClip: (id, x, y) =>
      set((state) => {
        const clip = state.composition.clips.find((c) => c.id === id);
        if (clip) {
          if (!clip.transform) clip.transform = {};
          clip.transform.x = x;
          clip.transform.y = y;
        }
      }),

    removeAllClips: () =>
      set((state) => {
        state.composition.clips = [];
      }),

    getClipById: (id) => {
      const state = get();
      return state.composition.clips.find((c) => c.id === id);
    },
  }))
);
