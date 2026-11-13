/** ID photo size in pixels (3:4 portrait, sharp enough for an 17 x 21 mm print at 300 dpi). */
export const PHOTO_WIDTH = 240;
export const PHOTO_HEIGHT = 300;

/** Centre crop of a source image to the photo's 4:5 frame: the source rectangle to draw. */
export function coverCrop(srcW: number, srcH: number, dstW = PHOTO_WIDTH, dstH = PHOTO_HEIGHT) {
  const target = dstW / dstH;
  if (srcW / srcH > target) {
    const w = Math.round(srcH * target);
    return { sx: Math.round((srcW - w) / 2), sy: 0, sw: w, sh: srcH };
  }
  const h = Math.round(srcW / target);
  return { sx: 0, sy: Math.round((srcH - h) / 2), sw: srcW, sh: h };
}
