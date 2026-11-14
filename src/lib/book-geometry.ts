import { clamp, type Direction } from "./book-machine";

export type PeelCorner = "top" | "bottom";

export interface Point {
  x: number;
  y: number;
}

export interface PaperFoldGeometry {
  /** Outgoing front page polygon in its own [0..width] x [0..height] space. */
  frontClip: string;
  /** Reflected back page polygon in its own [0..width] x [0..height] space. */
  backClip: string;
  /** CSS transform-origin for the reflected back page. */
  backOrigin: string;
  /** CSS 2D rigid reflection transform (translate3d + rotate) for the back page. */
  backTransform: string;
  /** Cylindrical highlight + shadow gradient rendered on the folded back page. */
  backShadeGradient: string;
  /** Crease darkening gradient rendered on the outgoing front page near the fold. */
  frontShadeGradient: string;
  /** Soft shadow cast by the lifted curl onto the revealed destination page underneath. */
  castShadowGradient: string;
  /** Drop-shadow filter on the folded flap so it shadows the opposite page across the spine. */
  flapDropShadow: string;
  /** Fold angle in degrees for diagnostics and tests. */
  foldAngleDeg: number;
  /** Peeled corner position in outgoing page coordinates. */
  peeledCorner: Point;
}

export interface HardCoverGeometry {
  /** Rigid 3D spine rotation transform for the cover sheet. */
  sheetTransform: string;
  /** Z-index of the front face (2 before 90 deg, 1 after 90 deg). */
  frontZIndex: string;
  /** Z-index of the back face (1 before 90 deg, 2 after 90 deg). */
  backZIndex: string;
  /** Directional lighting gradient on the rotating board face. */
  faceShadeGradient: string;
  /** Opacity of the directional lighting overlay (peaks at 90 deg). */
  faceShadeOpacity: string;
  /** Ambient shadow cast onto the static inner page while the cover is < 90 deg open. */
  underShadowOpacity: string;
  /** Rotation angle in degrees. */
  angleDeg: number;
}

/**
 * Sutherland-Hodgman half-plane clipper for a convex polygon.
 * Keeps points Q satisfying (Q.x - mx) * nx + (Q.y - my) * ny <= 0.
 */
function clipPolygonHalfPlane(
  polygon: readonly Point[],
  mx: number,
  my: number,
  nx: number,
  ny: number,
): Point[] {
  const result: Point[] = [];
  const count = polygon.length;
  if (count === 0) return result;
  for (let i = 0; i < count; i++) {
    const current = polygon[i]!;
    const prev = polygon[(i + count - 1) % count]!;
    const currentSide = (current.x - mx) * nx + (current.y - my) * ny;
    const prevSide = (prev.x - mx) * nx + (prev.y - my) * ny;
    const currentInside = currentSide <= 1e-5;
    const prevInside = prevSide <= 1e-5;

    if (currentInside !== prevInside) {
      const denom = prevSide - currentSide;
      const t = Math.abs(denom) > 1e-9 ? prevSide / denom : 0;
      result.push({
        x: prev.x + (current.x - prev.x) * t,
        y: prev.y + (current.y - prev.y) * t,
      });
    }
    if (currentInside) {
      result.push(current);
    }
  }
  return result;
}

function toPolygonCss(points: readonly Point[], width: number, height: number): string {
  if (points.length < 3) return "polygon(0% 0%, 0% 0%, 0% 0%)";
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  const coords = points.map((p) => {
    const px = ((clamp(p.x, -2, w + 2) / w) * 100).toFixed(2);
    const py = ((clamp(p.y, -2, h + 2) / h) * 100).toFixed(2);
    return `${px}% ${py}%`;
  });
  return `polygon(${coords.join(", ")})`;
}

/**
 * Computes rigid 3D perspective geometry and lighting for hard book covers
 * (matching Heyzine's .hard-page-wrapper 3000px perspective rotation).
 */
export function computeHardCover(
  progress: number,
  direction: Direction,
  fromSpread: number,
  toSpread: number,
  total: number,
): HardCoverGeometry {
  const p = clamp(progress, 0, 1);
  const angleDeg = -direction * p * 180;
  const firstHalf = p <= 0.5;
  // Lighting intensity peaks when the board is perpendicular to the viewer (90 deg).
  const shadePeak = 1 - Math.abs(p * 2 - 1);
  const shadeOpacity = (shadePeak * 0.92).toFixed(4);
  const gradientTowardRight =
    (direction === 1 && firstHalf) || (direction === -1 && !firstHalf);
  const faceShadeGradient = gradientTowardRight
    ? "linear-gradient(to right, rgba(0, 0, 0, 0.32) 0%, rgba(0, 0, 0, 0.12) 45%, rgba(0, 0, 0, 0) 100%)"
    : "linear-gradient(to left, rgba(0, 0, 0, 0.32) 0%, rgba(0, 0, 0, 0.12) 45%, rgba(0, 0, 0, 0) 100%)";

  // Determine how open the cover is relative to the inner page underneath [0 = closed over page, 1 = past 90 deg].
  const openingFront = fromSpread < 0 && toSpread >= 0;
  const closingFront = fromSpread >= 0 && toSpread < 0;
  const closingBack = fromSpread < total && toSpread >= total;
  const openingBack = fromSpread >= total && toSpread < total;

  let underShadow = 0;
  if (openingFront || openingBack) {
    underShadow = p < 0.5 ? (1 - p * 2) * 0.46 : 0;
  } else if (closingFront || closingBack) {
    underShadow = p > 0.5 ? ((p - 0.5) * 2) * 0.46 : 0;
  }

  return {
    sheetTransform: `rotateY(${angleDeg.toFixed(3)}deg) translate3d(0px, 0px, 0px)`,
    frontZIndex: firstHalf ? "2" : "1",
    backZIndex: firstHalf ? "1" : "2",
    faceShadeGradient,
    faceShadeOpacity: shadeOpacity,
    underShadowOpacity: underShadow.toFixed(4),
    angleDeg,
  };
}

/**
 * Computes continuous 2D planar reflection fold geometry and cylindrical shading
 * for flexible paper leaves (matching Heyzine's fold-wrapper / fold-page math
 * with zero segmented strips).
 */
export function computePaperFold(
  progress: number,
  direction: Direction,
  width: number,
  height: number,
  corner: PeelCorner = "bottom",
  pointerLiftRatio?: number,
): PaperFoldGeometry {
  const W = Math.max(width, 1);
  const H = Math.max(height, 1);
  const p = clamp(progress, 0, 1);
  const forward = direction === 1;
  const isBottom = corner === "bottom";

  // Original outer corner C0 = (x0, y0) in the outgoing page's [0..W] x [0..H] coordinates.
  const x0 = forward ? W : 0;
  const y0 = isBottom ? H : 0;

  if (p <= 0.0005) {
    return {
      frontClip: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      backClip: "polygon(0% 0%, 0% 0%, 0% 0%)",
      backOrigin: `${W - x0}px ${y0}px`,
      backTransform: "translate3d(0px, 0px, 0px) rotate(0deg)",
      backShadeGradient: "none",
      frontShadeGradient: "none",
      castShadowGradient: "none",
      flapDropShadow: "none",
      foldAngleDeg: 0,
      peeledCorner: { x: x0, y: y0 },
    };
  }

  if (p >= 0.9995) {
    const finalX = forward ? -W : 2 * W;
    const originX = W - x0;
    return {
      frontClip: "polygon(0% 0%, 0% 0%, 0% 0%)",
      backClip: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      backOrigin: `${originX}px ${y0}px`,
      backTransform: `translate3d(${(finalX - originX).toFixed(2)}px, 0px, 0px) rotate(0deg)`,
      backShadeGradient: "none",
      frontShadeGradient: "none",
      castShadowGradient: "none",
      flapDropShadow: "none",
      foldAngleDeg: 0,
      peeledCorner: { x: finalX, y: y0 },
    };
  }

  // Target peeled corner P = (xp, yp) before spine constraints.
  // Moves from x0 across the spread by 2*W*p while arching smoothly in Y.
  let xp = forward ? W * (1 - 2 * p) : 2 * W * p;
  const sinP = Math.sin(p * Math.PI);
  // Skew the arch slightly toward the first half of the turn (like lifting a corner and laying it down).
  const archEnvelope = Math.sin(Math.pow(p, 0.82) * Math.PI);
  // During dragging the corner follows vertical displacement directly. The
  // automatic turn uses its own arch; do not impose that arch on the hand.
  const liftMagnitude = pointerLiftRatio === undefined
    ? 0.24 * H * archEnvelope
    : clamp(pointerLiftRatio, 0.002, 0.95) * H;
  let yp = isBottom ? H - liftMagnitude : liftMagnitude;

  // Spine constraints: the paper is bound along x = spineX (0 for right page, W for left page).
  const spineX = forward ? 0 : W;
  const nearSpineY = y0;
  const farSpineY = isBottom ? 0 : H;

  // 1) Distance from near spine corner (spineX, nearSpineY) cannot exceed W.
  const dxNear = xp - spineX;
  const dyNear = yp - nearSpineY;
  const distNear = Math.hypot(dxNear, dyNear);
  if (distNear > W && distNear > 1e-6) {
    const scale = W / distNear;
    xp = spineX + dxNear * scale;
    yp = nearSpineY + dyNear * scale;
  }

  // 2) Distance from far spine corner (spineX, farSpineY) cannot exceed hypot(W, H).
  const maxDiag = Math.hypot(W, H);
  const dxFar = xp - spineX;
  const dyFar = yp - farSpineY;
  const distFar = Math.hypot(dxFar, dyFar);
  if (distFar > maxDiag && distFar > 1e-6) {
    const scale = maxDiag / distFar;
    xp = spineX + dxFar * scale;
    yp = farSpineY + dyFar * scale;
  }

  // Vector from P to C0: normal to the fold line pointing toward the peeled corner C0.
  const vx = x0 - xp;
  const vy = y0 - yp;
  const vLen = Math.hypot(vx, vy);
  const nx = vLen > 1e-6 ? vx / vLen : forward ? 1 : -1;
  const ny = vLen > 1e-6 ? vy / vLen : 0;

  // Midpoint M on the fold line (perpendicular bisector of P and C0).
  const mx = (x0 + xp) * 0.5;
  const my = (y0 + yp) * 0.5;

  const rect: Point[] = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];

  // Unpeeled portion of the outgoing front page: (Q - M) . n <= 0
  const keepPoly = clipPolygonHalfPlane(rect, mx, my, nx, ny);
  // Peeled flap portion of the outgoing front page: (Q - M) . (-n) <= 0
  const flapPoly = clipPolygonHalfPlane(rect, mx, my, -nx, -ny);
  // On the back face of the sheet, x_back = W - x_front, y_back = y_front.
  const backPoly = flapPoly.map((pt) => ({ x: W - pt.x, y: pt.y })).reverse();

  // Compute the 2D reflection rotation angle beta = 2 * phi.
  // For a forward turn, u = C0 - P = (W - xp, y0 - yp); at completion P = (-W, y0), u = (2W, 0) -> phi = 0.
  // For a backward turn, u = P - C0 = (xp, yp - y0); at completion P = (2W, y0), u = (2W, 0) -> phi = 0.
  const ux = forward ? W - xp : xp;
  const uy = forward ? y0 - yp : yp - y0;
  const phiRad = Math.atan2(uy, ux);
  const betaDeg = (2 * phiRad * 180) / Math.PI;

  const originX = W - x0;
  const originY = y0;
  const tx = xp - originX;
  const ty = yp - originY;

  // Distance from the peeled corner to the fold line is vLen / 2.
  const foldDist = Math.max(vLen * 0.5, 1);
  // In the back page's local space (x_b = W - x_f, y_b = y_f), the normal from C_back=(W-x0, y0)
  // toward the fold line is (+nx, -ny).
  // CSS linear-gradient angle: 0deg = up (0, -1), 90deg = right (1, 0) -> atan2(dx, -dy).
  const backNormalX = nx;
  const backNormalY = -ny;
  const backGradAngle = (Math.atan2(backNormalX, -backNormalY) * 180) / Math.PI;

  // Distance from the center of the back page (W/2, H/2) to C_back along backNormal:
  // In CSS linear-gradient, 50% is at the box center (W/2, H/2).
  // Project C_back - Center onto backNormal to locate d = 0 (peeled corner) and d = foldDist (fold crease) in px!
  const halfDiagProj =
    Math.abs(backNormalX) * (W * 0.5) + Math.abs(backNormalY) * (H * 0.5);
  // Since C_back is the corner in the direction of -backNormal, its coordinate along the gradient line is 0px!
  // Let's verify: backNormal points from C_back into the page interior, so C_back is the minimum point (0px)
  // of the gradient line, and the gradient line has total length 2 * halfDiagProj!
  const gradLineLen = Math.max(2 * halfDiagProj, 1);
  const creasePct = clamp((foldDist / gradLineLen) * 100, 2, 99.5);
  const curlStartPct = (creasePct * 0.32).toFixed(2);
  const bellyPct = (creasePct * 0.78).toFixed(2);
  const highlightPct = (creasePct * 0.94).toFixed(2);
  const edgePct = creasePct.toFixed(2);

  const intensity = clamp(Math.pow(sinP, 0.75), 0.15, 1);
  const bellyAlpha = (0.19 * intensity).toFixed(3);
  const highlightAlpha = (0.28 * intensity).toFixed(3);
  const creaseAlpha = (0.11 * intensity).toFixed(3);

  const backShadeGradient = `linear-gradient(${backGradAngle.toFixed(2)}deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) ${curlStartPct}%, rgba(0, 0, 0, ${bellyAlpha}) ${bellyPct}%, rgba(255, 255, 255, ${highlightAlpha}) ${highlightPct}%, rgba(0, 0, 0, ${creaseAlpha}) ${edgePct}%, rgba(0, 0, 0, 0) ${(creasePct + 0.5).toFixed(2)}%)`;

  // Front page crease shading: normal from C0 into the kept front page is (-nx, -ny).
  const frontNormalX = -nx;
  const frontNormalY = -ny;
  const frontGradAngle = (Math.atan2(frontNormalX, -frontNormalY) * 180) / Math.PI;
  const frontGradLen =
    Math.max(2 * (Math.abs(frontNormalX) * (W * 0.5) + Math.abs(frontNormalY) * (H * 0.5)), 1);
  const frontCreasePct = clamp((foldDist / frontGradLen) * 100, 1, 98);
  const frontRollPct = clamp(frontCreasePct + (28 / frontGradLen) * 100, frontCreasePct + 1, 100);
  const frontShadeGradient = `linear-gradient(${frontGradAngle.toFixed(2)}deg, rgba(0, 0, 0, 0) ${Math.max(0, frontCreasePct - 0.5).toFixed(2)}%, rgba(0, 0, 0, ${(0.14 * intensity).toFixed(3)}) ${frontCreasePct.toFixed(2)}%, rgba(0, 0, 0, 0) ${frontRollPct.toFixed(2)}%)`;

  // Cast shadow on the revealed page underneath: normal from C0 toward the fold line is (-nx, -ny).
  // The shadow sits just inside the peeled region (before frontCreasePct) and feathers toward C0.
  const shadowWidthPct = clamp((Math.min(foldDist * 0.55, 85) / frontGradLen) * 100, 3, frontCreasePct);
  const shadowOuterPct = Math.max(0, frontCreasePct - shadowWidthPct);
  const shadowPeakPct = Math.max(0, frontCreasePct - shadowWidthPct * 0.22);
  const castAlpha = (0.28 * intensity).toFixed(3);
  const castShadowGradient = `linear-gradient(${frontGradAngle.toFixed(2)}deg, rgba(0, 0, 0, 0) ${shadowOuterPct.toFixed(2)}%, rgba(0, 0, 0, ${castAlpha}) ${shadowPeakPct.toFixed(2)}%, rgba(0, 0, 0, ${(0.12 * intensity).toFixed(3)}) ${frontCreasePct.toFixed(2)}%, rgba(0, 0, 0, 0) ${(frontCreasePct + 1.2).toFixed(2)}%)`;

  const dropOffset = Math.round((forward ? -1 : 1) * (4 + 14 * sinP));
  const dropBlur = Math.round(8 + 16 * sinP);
  const dropAlpha = (0.24 * intensity).toFixed(3);
  const flapDropShadow = `drop-shadow(${dropOffset}px ${Math.round(4 * sinP)}px ${dropBlur}px rgba(20, 14, 10, ${dropAlpha}))`;

  return {
    frontClip: toPolygonCss(keepPoly, W, H),
    backClip: toPolygonCss(backPoly, W, H),
    backOrigin: `${originX}px ${originY}px`,
    backTransform: `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0px) rotate(${betaDeg.toFixed(3)}deg)`,
    backShadeGradient,
    frontShadeGradient,
    castShadowGradient,
    flapDropShadow,
    foldAngleDeg: betaDeg,
    peeledCorner: { x: xp, y: yp },
  };
}
