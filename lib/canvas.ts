// Canvas utilities for the photobooth camera capture.

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Captures a frame from the webcam video element, cropped (never stretched)
 * to the given target aspect ratio (width / height), then mirrored
 * horizontally for a natural selfie feel.
 *
 * Cropping instead of stretching keeps people looking normal regardless of
 * the camera's native resolution/aspect ratio.
 */
export function captureFromVideo(
  video: HTMLVideoElement,
  targetAspect: number = 16 / 9,
  maxDimension: number = 1280
): string {
  const sw = video.videoWidth || 1280;
  const sh = video.videoHeight || 720;
  const sourceAspect = sw / sh;

  // Crop the source video to match the target aspect ratio (center-crop).
  let cropW = sw;
  let cropH = sh;
  if (sourceAspect > targetAspect) {
    cropW = sh * targetAspect; // source is wider than target -> crop left/right
  } else {
    cropH = sw / targetAspect; // source is taller than target -> crop top/bottom
  }
  const sx = (sw - cropW) / 2;
  const sy = (sh - cropH) / 2;

  // Output resolution preserves the target aspect ratio exactly.
  let outW: number;
  let outH: number;
  if (targetAspect >= 1) {
    outW = maxDimension;
    outH = Math.round(maxDimension / targetAspect);
  } else {
    outH = maxDimension;
    outW = Math.round(maxDimension * targetAspect);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(outW, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, outW, outH);
  return canvas.toDataURL("image/png");
}
