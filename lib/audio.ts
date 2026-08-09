// Audio manager - gracefully handles missing files
const audioCache: Map<string, HTMLAudioElement> = new Map();

const AUDIO_MAP: Record<string, string> = {
  select: "/audio/select.mp3",
  confirm: "/audio/confirm.mp3",
  shutter: "/audio/shutter.mp3",
  countdown: "/audio/countdown.mp3",
  flash: "/audio/flash.mp3",
};

export function playSound(name: keyof typeof AUDIO_MAP | string, volume = 1.0): void {
  if (typeof window === "undefined") return;
  const path = AUDIO_MAP[name] || `/audio/${name}.mp3`;

  try {
    let audio = audioCache.get(path);
    if (!audio) {
      audio = new Audio(path);
      audio.addEventListener("error", () => {
        // Silently ignore missing audio files
      });
      audioCache.set(path, audio);
    }
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(() => {
      // Ignore autoplay restrictions
    });
  } catch {
    // Ignore all audio errors
  }
}
