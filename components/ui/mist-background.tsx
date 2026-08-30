"use client"

import React, { useEffect, useRef } from 'react';

/**
 * WebGL FBM mist — opaque canvas with mix-blend-mode: screen.
 * Black pixels = invisible, bright fog pixels = visible overlay.
 * No WebGL alpha channel gymnastics needed.
 */
const MistBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2  u_resolution;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 6; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        uv.x *= u_resolution.x / u_resolution.y;

        vec2 q;
        q.x = fbm(uv + 0.07 * u_time);
        q.y = fbm(uv + vec2(1.0, 1.0));

        vec2 r;
        r.x = fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15  * u_time);
        r.y = fbm(uv + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

        float f = fbm(uv + r);

        // Screen-blend palette:
        // pure black (0,0,0) = invisible   bright white = solid fog
        vec3 fogColor = vec3(0.80, 0.87, 0.82); // soft greenish-white

        float fogStrength = smoothstep(0.30, 0.70, f) * 0.90;

        // Ground fog — denser at the bottom
        float heightFade = 1.0 - smoothstep(0.0, 0.65, gl_FragCoord.y / u_resolution.y);
        fogStrength *= (0.35 + 0.65 * heightFade);

        fogStrength = clamp(fogStrength, 0.0, 1.0);

        // Output: black base (invisible in screen) + fog colour
        vec3 color = fogColor * fogStrength;
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const verts = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const posLoc  = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resLoc  = gl.getUniformLocation(program, 'u_resolution');

    let raf: number;
    const render = (time: number) => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.uniform1f(timeLoc, time * 0.001);
      gl.uniform2f(resLoc,  canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default MistBackground;
