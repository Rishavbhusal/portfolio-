/** GLSL for the node/packet points and the connection lines. Kept deliberately small. */

export const nodeVertex = /* glsl */ `
  attribute float aSize;
  attribute vec2 aSig; // x: pulse glow, y: verified (accent)
  uniform float uScale;
  uniform float uAlpha;
  varying float vGlow;
  varying float vGreen;
  varying float vSize;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    vGlow = aSig.x;
    vGreen = aSig.y;
    vSize = aSize;
    float s = aSize * (1.0 + aSig.x * 0.55 + aSig.y * 0.35);
    gl_PointSize = max(s * uScale / max(0.5, -mv.z), 0.0);
    gl_Position = projectionMatrix * mv;
    if (aSize <= 0.001) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`

export const nodeFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uBase;
  uniform vec3 uAccent;
  uniform float uAlpha;
  varying float vGlow;
  varying float vGreen;
  varying float vSize;
  varying float vDepth;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    if (d > 0.5) discard;
    float core = smoothstep(0.3, 0.0, d);
    float halo = smoothstep(0.5, 0.0, d) * 0.15;
    // thin ring on larger nodes: reads as a precise "node" rather than a blurry dot
    float ringMask = smoothstep(0.9, 1.5, vSize);
    float ring = (smoothstep(0.5, 0.44, d) - smoothstep(0.43, 0.37, d)) * 0.5 * ringMask;
    float a = core + halo * (0.4 + vGlow) + ring;
    vec3 col = mix(uBase * (0.8 + vGlow * 0.9), uAccent, vGreen);
    float fade = clamp(1.25 - (vDepth - 7.0) / 34.0, 0.22, 1.0);
    gl_FragColor = vec4(col, a * fade * uAlpha);
  }
`

export const lineVertex = /* glsl */ `
  attribute float aSize;
  attribute vec2 aSig;
  varying float vA;
  varying float vGreen;
  varying float vGlow;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    vA = clamp(aSize * 1.1, 0.0, 1.0);
    vGreen = aSig.y;
    vGlow = aSig.x;
    gl_Position = projectionMatrix * mv;
  }
`

export const lineFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uBase;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vA;
  varying float vGreen;
  varying float vGlow;
  varying float vDepth;
  void main() {
    float fade = clamp(1.25 - (vDepth - 7.0) / 34.0, 0.15, 1.0);
    vec3 col = mix(uBase, uAccent, vGreen * 0.9);
    float a = uOpacity * vA * (0.55 + vGlow * 1.4) * fade;
    gl_FragColor = vec4(col, a);
  }
`
