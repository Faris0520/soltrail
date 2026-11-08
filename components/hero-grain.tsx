"use client";

import { useEffect, useRef } from "react";

const NOISE_AMP = 70;

function noiseTile() {
  const tile = document.createElement("canvas");
  tile.width = 128;
  tile.height = 128;
  const context = tile.getContext("2d");
  if (!context) return tile;
  const image = context.createImageData(128, 128);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const value = (128 + (Math.random() - 0.5) * 2 * NOISE_AMP) | 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return tile;
}

export function HeroGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const field = canvas?.parentElement;
    if (!canvas || !field) return;

    const tile = noiseTile();

    const paint = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = field.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.imageSmoothingEnabled = false;
      const pattern = context.createPattern(tile, "repeat");
      if (!pattern) return;
      context.fillStyle = pattern;
      context.fillRect(0, 0, width, height);
    };

    paint();

    const observer = new ResizeObserver(() => paint());
    observer.observe(field);

    const resolution = { media: window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`) };
    const onResolution = () => {
      resolution.media.removeEventListener("change", onResolution);
      paint();
      resolution.media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      resolution.media.addEventListener("change", onResolution);
    };
    resolution.media.addEventListener("change", onResolution);

    return () => {
      observer.disconnect();
      resolution.media.removeEventListener("change", onResolution);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-grain" aria-hidden="true" />;
}
