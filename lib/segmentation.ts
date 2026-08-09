// Background removal using MediaPipe Selfie Segmentation
// Gracefully degrades if not available

let segmentationModel: unknown = null;
let isLoading = false;

export async function loadSegmentationModel(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (segmentationModel) return true;
  if (isLoading) return false;

  isLoading = true;
  try {
    const { SelfieSegmentation } = await import("@mediapipe/selfie_segmentation");
    const model = new SelfieSegmentation({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });
    model.setOptions({ modelSelection: 1 });
    await model.initialize();
    segmentationModel = model;
    return true;
  } catch {
    return false;
  } finally {
    isLoading = false;
  }
}

export async function removeBackground(imageSrc: string): Promise<string> {
  // If model not ready, return original image
  if (!segmentationModel) return imageSrc;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const model = segmentationModel as any;
        model.onResults((results: { segmentationMask: ImageBitmap }) => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Draw mask
          ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = "source-in";
          ctx.drawImage(img, 0, 0);
          ctx.globalCompositeOperation = "source-over";
          resolve(canvas.toDataURL("image/png"));
        });

        await model.send({ image: img });
      } catch {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
