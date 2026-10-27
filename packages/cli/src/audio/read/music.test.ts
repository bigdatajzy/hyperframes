import { describe, expect, it } from "vitest";
import { readMusic } from "./music.js";
import { READ_RATE } from "./signal.js";

const chord = (hz: number[]) => (t: number) =>
  hz.reduce((sum, f) => sum + 0.1 * Math.sin(2 * Math.PI * f * t), 0);
const C_MAJOR = chord([261.63, 329.63, 392]);
const F_SHARP_MINOR = chord([369.99, 440, 554.37]);

function piano(seconds: number, parts: [number, number, (t: number) => number][]): Float32Array {
  const out = new Float32Array(Math.round(seconds * READ_RATE));
  for (const [from, to, sound] of parts)
    for (let i = Math.round(from * READ_RATE); i < Math.round(to * READ_RATE); i++)
      out[i] = sound(i / READ_RATE);
  return out;
}

let seed = 11;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function rumble(seconds: number, from = 0): Float32Array {
  const out = new Float32Array(Math.round(seconds * READ_RATE));
  let low = 0;
  for (let i = Math.round(from * READ_RATE); i < out.length; i++)
    out[i] = 0.4 * (low = 0.995 * low + 0.02 * noise());
  return out;
}

const kick = (t: number) => {
  const since = t % 0.5;
  return 0.6 * Math.exp(-since / 0.05) * Math.sin(2 * Math.PI * 60 * since);
};

describe("readMusic", () => {
  it("splits the bed at its cut-outs and tells a new piece from one that returns", () => {
    const stem = piano(26, [
      [0, 8, C_MAJOR],
      [9, 16, F_SHARP_MINOR],
      [17, 24, C_MAJOR],
    ]);
    const { music } = readMusic({ stems: { piano: stem }, drums: null, sampleRate: READ_RATE });
    expect(
      music.segments.map((s) => [Math.round(s.start), Math.round(s.end), s.piece, s.entry]),
    ).toEqual([
      [0, 8, 1, "start"],
      [9, 16, 2, "new"],
      [17, 24, 1, "returns"],
    ]);
    expect(music.breaks.map((b) => [Math.round(b.start), Math.round(b.end)])).toEqual([
      [8, 9],
      [16, 17],
    ]);
    expect(music.pieces[0]).toMatchObject({ id: 1, instruments: ["piano"], firstAt: 0 });
    expect(music.energy.map((e) => e.start)).toEqual([0]);
  });

  it("names the stems that carry a piece, loudest first, and notes a fade at its end", () => {
    const fadeOut = (t: number) => C_MAJOR(t) * Math.min(1, Math.max(0.001, (10 - t) / 3));
    const loud = piano(10, [[0, 10, fadeOut]]);
    const quiet = loud.map((v) => v * 0.6);
    const { music } = readMusic({
      stems: { piano: loud, guitar: quiet, bass: new Float32Array(loud.length) },
      drums: null,
      sampleRate: READ_RATE,
    });
    expect(music.pieces[0]!.instruments).toEqual(["piano", "guitar"]);
    expect(music.segments[0]!.fadeFrom).toBeGreaterThan(6.5);
  });

  it("keeps a tonal bed on a beat as music, alone in one stem", () => {
    const song = piano(20, [[0, 20, (t) => C_MAJOR(t) + kick(t)]]);
    const { music, ambience } = readMusic({
      stems: { other: song, bass: new Float32Array(song.length) },
      drums: null,
      sampleRate: READ_RATE,
    });
    expect(ambience).toEqual([]);
    expect(music.segments).toHaveLength(1);
    expect(music.segments[0]!.bpm).toBe(120);
  });

  it("reads noise in a single stem as ambience with its level, not as a piece", () => {
    const { music, ambience } = readMusic({
      stems: { other: rumble(10), bass: new Float32Array(10 * READ_RATE) },
      drums: null,
      sampleRate: READ_RATE,
    });
    expect(music.segments).toEqual([]);
    expect(music.pieces).toEqual([]);
    expect(ambience).toEqual([{ start: 0, end: expect.closeTo(10, 0), db: expect.any(Number) }]);
    expect(ambience[0]!.db).toBeGreaterThan(-40);
    expect(ambience[0]!.db).toBeLessThan(-10);
  });

  it("does not call the gap between music and ambience a break", () => {
    const bed = piano(18, [[0, 8, C_MAJOR]]);
    const noisy = rumble(18, 9);
    const { music, ambience } = readMusic({
      stems: { piano: bed, other: noisy },
      drums: null,
      sampleRate: READ_RATE,
    });
    expect(music.segments.map((s) => [Math.round(s.start), Math.round(s.end)])).toEqual([[0, 8]]);
    expect(ambience.map((a) => [Math.round(a.start), Math.round(a.end)])).toEqual([[9, 18]]);
    expect(music.breaks).toEqual([]);
  });
});
