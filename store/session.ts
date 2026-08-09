import { create } from "zustand";

type SessionStatus = "idle" | "waiting" | "countdown" | "capturing" | "processing" | "done";
type Orientation = "landscape" | "portrait";

interface SessionStore {
  // Session
  sessionId: string | null;
  status: SessionStatus;
  connectedPhones: number;
  orientation: Orientation;

  // Photos
  photos: string[];
  currentPhotoIndex: number;

  // UI
  countdownValue: number | null;
  showFlash: boolean;

  // Actions
  setSessionId: (id: string) => void;
  setStatus: (status: SessionStatus) => void;
  setConnectedPhones: (count: number) => void;
  setOrientation: (orientation: Orientation) => void;
  addPhoto: (photo: string, index: number) => void;
  setCountdownValue: (val: number | null) => void;
  setShowFlash: (show: boolean) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  status: "idle",
  connectedPhones: 0,
  orientation: "landscape",
  photos: [],
  currentPhotoIndex: 0,
  countdownValue: null,
  showFlash: false,

  setSessionId: (id) => set({ sessionId: id }),
  setStatus: (status) => set({ status }),
  setConnectedPhones: (count) => set({ connectedPhones: count }),
  setOrientation: (orientation) => set({ orientation }),
  addPhoto: (photo, index) =>
    set((state) => {
      const photos = [...state.photos];
      photos[index] = photo;
      return { photos, currentPhotoIndex: index + 1 };
    }),
  setCountdownValue: (val) => set({ countdownValue: val }),
  setShowFlash: (show) => set({ showFlash: show }),
  resetSession: () =>
    set({
      photos: [],
      currentPhotoIndex: 0,
      status: "waiting",
      countdownValue: null,
      showFlash: false,
    }),
}));
