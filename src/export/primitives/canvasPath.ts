/** 圆角矩形路径（供 fill / stroke / clip 使用） */
export function roundRect(
  ctx: UniApp.CanvasContext,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.arc(x + w - radius, y + radius, radius, 1.5 * Math.PI, 0)
  ctx.lineTo(x + w, y + h - radius)
  ctx.arc(x + w - radius, y + h - radius, radius, 0, 0.5 * Math.PI)
  ctx.lineTo(x + radius, y + h)
  ctx.arc(x + radius, y + h - radius, radius, 0.5 * Math.PI, Math.PI)
  ctx.lineTo(x, y + radius)
  ctx.arc(x + radius, y + radius, radius, Math.PI, 1.5 * Math.PI)
  ctx.closePath()
}
