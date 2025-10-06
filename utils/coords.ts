export type ImageTransform = {
  // פוזיציה וגודל התמונה על הקנבס אחרי זום/פאן
  tx: number;   // תזוזה X של התמונה על הקנבס (פאן)
  ty: number;   // תזוזה Y
  scale: number; // זום (1 = ללא זום)
  imgW: number; // רוחב התמונה המקורי (בפיקסלים)
  imgH: number; // גובה התמונה המקורי
};

export function imageToScreen(nx: number, ny: number, t: ImageTransform) {
  const x = t.tx + nx * (t.imgW * t.scale);
  const y = t.ty + ny * (t.imgH * t.scale);
  return { x, y };
}

export function screenToImage(x: number, y: number, t: ImageTransform) {
  const nx = (x - t.tx) / (t.imgW * t.scale);
  const ny = (y - t.ty) / (t.imgH * t.scale);
  return {
    nx: Math.max(0, Math.min(1, nx)),
    ny: Math.max(0, Math.min(1, ny)),
  };
}