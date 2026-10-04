"use client";

import { useState } from "react";

// Panel widths the user can drag to. They snap in 10px steps because each width is a real
// Tailwind class: the project allows inline styles only in the renderer, and Tailwind only
// generates classes that appear literally in source.

export const STEP = 10;
const MIN_CANVAS = 360; // the canvas never gets narrower than this while dragging
const CHROME = 48; // page padding plus the two handles

export const LEFT = { min: 180, max: 320, initial: 200 };
export const RIGHT = { min: 280, max: 440, initial: 300 };

const LEFT_CLASS: Record<number, string> = {
  180: "lg:w-[180px]",
  190: "lg:w-[190px]",
  200: "lg:w-[200px]",
  210: "lg:w-[210px]",
  220: "lg:w-[220px]",
  230: "lg:w-[230px]",
  240: "lg:w-[240px]",
  250: "lg:w-[250px]",
  260: "lg:w-[260px]",
  270: "lg:w-[270px]",
  280: "lg:w-[280px]",
  290: "lg:w-[290px]",
  300: "lg:w-[300px]",
  310: "lg:w-[310px]",
  320: "lg:w-[320px]",
};

const RIGHT_CLASS: Record<number, string> = {
  280: "lg:w-[280px]",
  290: "lg:w-[290px]",
  300: "lg:w-[300px]",
  310: "lg:w-[310px]",
  320: "lg:w-[320px]",
  330: "lg:w-[330px]",
  340: "lg:w-[340px]",
  350: "lg:w-[350px]",
  360: "lg:w-[360px]",
  370: "lg:w-[370px]",
  380: "lg:w-[380px]",
  390: "lg:w-[390px]",
  400: "lg:w-[400px]",
  410: "lg:w-[410px]",
  420: "lg:w-[420px]",
  430: "lg:w-[430px]",
  440: "lg:w-[440px]",
};

function snap(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value / STEP) * STEP));
}

export function usePanelSizes() {
  const [left, setLeftRaw] = useState(LEFT.initial);
  const [right, setRightRaw] = useState(RIGHT.initial);

  // The most a panel may take right now, leaving room for the other panel and the canvas.
  const room = (other: number) => window.innerWidth - CHROME - other - MIN_CANVAS;

  return {
    left,
    right,
    leftClass: LEFT_CLASS[left],
    rightClass: RIGHT_CLASS[right],
    setLeft: (px: number) => setLeftRaw(snap(px, LEFT.min, Math.max(LEFT.min, Math.min(LEFT.max, room(right))))),
    setRight: (px: number) => setRightRaw(snap(px, RIGHT.min, Math.max(RIGHT.min, Math.min(RIGHT.max, room(left))))),
  };
}
