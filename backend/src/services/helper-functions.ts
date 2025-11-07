// Helper functions for music processing
// Extracted from v0version - accurate harmonization logic

import type { Note, Chord, InstrumentConfig, HarmonicAnalysis, VoiceLeadingContext } from '../types/index.js';

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

// ==================== BASIC UTILITIES ====================

export function stepToMidi(step: string, octave: number, alter: number): number {
  const stepValues: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }
  return (octave + 1) * 12 + (stepValues[step] || 0) + alter
}

export function midiToStep(midi: number): { step: string; octave: number; alter: number } {
  const octave = Math.floor(midi / 12) - 1
  const pitchClass = midi % 12

  const steps = [
    { step: "C", alter: 0 },
    { step: "C", alter: 1 },
    { step: "D", alter: 0 },
    { step: "E", alter: -1 },
    { step: "E", alter: 0 },
    { step: "F", alter: 0 },
    { step: "F", alter: 1 },
    { step: "G", alter: 0 },
    { step: "G", alter: 1 },
    { step: "A", alter: 0 },
    { step: "B", alter: -1 },
    { step: "B", alter: 0 },
  ]

  return { ...steps[pitchClass], octave }
}

export function analyzeAndBuildChord(
  melodyPitch: number,
  scalePitches: number[],
  keyRoot: number,
  scale: number[],
  context: VoiceLeadingContext,
  allMelodyNotes: Note[],
  currentIndex: number,
  enableVariation = false,
): Chord {
  const melodyPitchClass = melodyPitch % 12
  const scaleIndex = scalePitches.indexOf(melodyPitchClass)

  let chordScaleDegree: number
  let chordQuality: "major" | "minor" | "diminished" | "augmented"

  if (scaleIndex === -1) {
    chordScaleDegree = 6
    chordQuality = "diminished"
  } else {
    const isStrongBeat = context.measurePosition % 2 === 0
    const isEndOfPhrase = currentIndex === allMelodyNotes.length - 1 || currentIndex % 8 === 7

    chordScaleDegree = selectChordDegree(
      scaleIndex,
      isStrongBeat,
      isEndOfPhrase,
      context,
      enableVariation ? context.instrumentVariation : 0,
    )
    chordQuality = getChordQuality(chordScaleDegree, scale === MAJOR_SCALE)
  }

  const chordRoot = (keyRoot + scale[chordScaleDegree]) % 12
  const chordThird = (chordRoot + (chordQuality === "major" ? 4 : chordQuality === "minor" ? 3 : 3)) % 12
  const chordFifth = (chordRoot + (chordQuality === "diminished" ? 6 : 7)) % 12

  let inversion: 0 | 1 | 2 = 0
  if (melodyPitchClass === chordThird) {
    inversion = 1
  } else if (melodyPitchClass === chordFifth) {
    inversion = 2
  }

  const voices = voiceChord(melodyPitch, chordRoot, chordThird, chordFifth, inversion, context)

  return {
    root: chordRoot,
    quality: chordQuality,
    inversion,
    voices,
  }
}

export function selectChordDegree(
  melodyScaleDegree: number,
  isStrongBeat: boolean,
  isEndOfPhrase: boolean,
  context: VoiceLeadingContext,
  variation = 0,
): number {
  if (isEndOfPhrase) {
    if (melodyScaleDegree === 0) return 0
    if (melodyScaleDegree === 4) return 4
    if (melodyScaleDegree === 6) return 4
  }

  if (isStrongBeat) {
    const stableChords = [0, 3, 4]
    for (const degree of stableChords) {
      if (
        degree === melodyScaleDegree ||
        (degree + 2) % 7 === melodyScaleDegree ||
        (degree + 4) % 7 === melodyScaleDegree
      ) {
        return degree
      }
    }
  }

  const possibleChords: number[] = []

  for (let degree = 0; degree < 7; degree++) {
    const chordTones = [degree, (degree + 2) % 7, (degree + 4) % 7]
    if (chordTones.includes(melodyScaleDegree)) {
      possibleChords.push(degree)
    }
  }

  if (possibleChords.length === 0) {
    return melodyScaleDegree
  }

  const weights = possibleChords.map((degree) => {
    let baseWeight = 1.0
    if (degree === 0) baseWeight = 3.0
    if (degree === 4) baseWeight = 2.5
    if (degree === 3) baseWeight = 2.0
    if (degree === 1 || degree === 5) baseWeight = 1.5

    return baseWeight + variation * (Math.random() - 0.5) * 0.5
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < possibleChords.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return possibleChords[i]
    }
  }

  return possibleChords[0]
}

export function getChordQuality(scaleDegree: number, isMajorKey: boolean): "major" | "minor" | "diminished" | "augmented" {
  if (isMajorKey) {
    if (scaleDegree === 0 || scaleDegree === 3 || scaleDegree === 4) return "major"
    if (scaleDegree === 6) return "diminished"
    return "minor"
  } else {
    if (scaleDegree === 0 || scaleDegree === 3) return "minor"
    if (scaleDegree === 2 || scaleDegree === 5 || scaleDegree === 6) return "major"
    if (scaleDegree === 1) return "diminished"
    if (scaleDegree === 4) return "major"
    return "minor"
  }
}

export function voiceChord(
  melodyPitch: number,
  chordRoot: number,
  chordThird: number,
  chordFifth: number,
  inversion: 0 | 1 | 2,
  context: VoiceLeadingContext,
): number[] {
  const soprano = melodyPitch
  const sopranoOctave = Math.floor(soprano / 12)

  const altoMin = 55
  const altoMax = 76
  const tenorMin = 48
  const tenorMax = 67
  const bassMin = 40
  const bassMax = 60

  let altoTone: number, tenorTone: number, bassTone: number

  if (inversion === 0) {
    bassTone = findClosestPitch(chordRoot, sopranoOctave - 2, bassMin, bassMax)
    altoTone = findClosestPitch(chordThird, sopranoOctave - 1, altoMin, altoMax)
    tenorTone = findClosestPitch(chordFifth, sopranoOctave - 1, tenorMin, tenorMax)
  } else if (inversion === 1) {
    bassTone = findClosestPitch(chordThird, sopranoOctave - 2, bassMin, bassMax)
    altoTone = findClosestPitch(chordFifth, sopranoOctave - 1, altoMin, altoMax)
    tenorTone = findClosestPitch(chordRoot, sopranoOctave - 1, tenorMin, tenorMax)
  } else {
    bassTone = findClosestPitch(chordFifth, sopranoOctave - 2, bassMin, bassMax)
    altoTone = findClosestPitch(chordRoot, sopranoOctave - 1, altoMin, altoMax)
    tenorTone = findClosestPitch(chordThird, sopranoOctave - 1, tenorMin, tenorMax)
  }

  if (context.previousChord) {
    const prevVoices = context.previousChord.voices

    altoTone = applyVoiceLeadingToVoice(altoTone, prevVoices[1], chordRoot, chordThird, chordFifth, altoMin, altoMax)
    tenorTone = applyVoiceLeadingToVoice(
      tenorTone,
      prevVoices[2],
      chordRoot,
      chordThird,
      chordFifth,
      tenorMin,
      tenorMax,
    )
    bassTone = applyVoiceLeadingToVoice(
      bassTone,
      prevVoices[3],
      chordRoot,
      chordThird,
      chordFifth,
      bassMin,
      bassMax,
      true,
    )

    const adjustedVoices = avoidParallelMotion([soprano, altoTone, tenorTone, bassTone], prevVoices, [
      chordRoot,
      chordThird,
      chordFifth,
    ])
    altoTone = adjustedVoices[1]
    tenorTone = adjustedVoices[2]
    bassTone = adjustedVoices[3]
  }

  return [soprano, altoTone, tenorTone, bassTone]
}

export function findClosestPitch(pitchClass: number, targetOctave: number, minMidi: number, maxMidi: number): number {
  let pitch = targetOctave * 12 + pitchClass

  while (pitch < minMidi) pitch += 12
  while (pitch > maxMidi) pitch -= 12

  return pitch
}

export function applyVoiceLeadingToVoice(
  currentPitch: number,
  previousPitch: number,
  chordRoot: number,
  chordThird: number,
  chordFifth: number,
  minRange: number,
  maxRange: number,
  allowLeaps = false,
): number {
  const interval = Math.abs(currentPitch - previousPitch)

  if (interval > (allowLeaps ? 12 : 7)) {
    const chordTones = [chordRoot, chordThird, chordFifth]
    const previousOctave = Math.floor(previousPitch / 12)

    let bestPitch = currentPitch
    let bestDistance = interval

    for (const tone of chordTones) {
      for (let octave = previousOctave - 1; octave <= previousOctave + 1; octave++) {
        const candidate = octave * 12 + tone
        if (candidate >= minRange && candidate <= maxRange) {
          const distance = Math.abs(candidate - previousPitch)
          if (distance < bestDistance) {
            bestDistance = distance
            bestPitch = candidate
          }
        }
      }
    }

    currentPitch = bestPitch
  }

  while (currentPitch < minRange) currentPitch += 12
  while (currentPitch > maxRange) currentPitch -= 12

  return currentPitch
}

export function avoidParallelMotion(currentVoices: number[], previousVoices: number[], chordTones: number[]): number[] {
  const adjusted = [...currentVoices]

  for (let i = 0; i < currentVoices.length; i++) {
    for (let j = i + 1; j < currentVoices.length; j++) {
      const currentInterval = Math.abs(currentVoices[i] - currentVoices[j]) % 12
      const previousInterval = Math.abs(previousVoices[i] - previousVoices[j]) % 12

      if ((currentInterval === 7 || currentInterval === 0) && currentInterval === previousInterval) {
        const currentMotion = currentVoices[i] - previousVoices[i]
        const otherMotion = currentVoices[j] - previousVoices[j]

        if ((currentMotion > 0 && otherMotion > 0) || (currentMotion < 0 && otherMotion < 0)) {
          const lowerVoiceOctave = Math.floor(adjusted[j] / 12)

          for (const tone of chordTones) {
            const candidate = lowerVoiceOctave * 12 + tone
            const newInterval = Math.abs(adjusted[i] - candidate) % 12

            if (newInterval !== currentInterval) {
              adjusted[j] = candidate
              console.log(
                `[Harmonize] Avoided parallel ${currentInterval === 7 ? "fifth" : "octave"} between voices ${i} and ${j}`,
              )
              break
            }
          }
        }
      }
    }
  }

  return adjusted
}

export function getKeyInfo(fifths: number, mode: string): { root: number; scale: number[] } {
  const majorRoots = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]
  let root: number
  if (fifths >= 0) {
    root = majorRoots[fifths % 12]
  } else {
    root = majorRoots[(12 + fifths) % 12]
  }

  const scale = mode === "minor" ? MINOR_SCALE : MAJOR_SCALE

  return { root, scale }
}

export function getScaleNotes(root: number, scale: number[]): string[] {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return scale.map((interval) => noteNames[(root + interval) % 12]);
}

// ==================== HARMONIC PROGRESSION GENERATION ====================

export function generateHarmonicProgression(
  melodyNotes: Note[],
  root: number,
  scale: number[],
  mode: string,
  enableVariation: boolean,
): Chord[] {
  const scalePitches = scale.map((interval) => (root + interval) % 12)
  const chords: Chord[] = []

  const context: VoiceLeadingContext = {
    previousChord: null,
    previousMelody: null,
    measurePosition: 0,
    phrasePosition: 0,
    instrumentVariation: enableVariation ? Math.random() : 0,
  }

  melodyNotes.forEach((note, index) => {
    if (note.pitch === -1) {
      chords.push({
        root: 0,
        quality: "major",
        inversion: 0,
        voices: [-1, -1, -1, -1],
      })
      context.measurePosition = (context.measurePosition + 1) % 4
      context.phrasePosition++
      return
    }

    const chord = analyzeAndBuildChord(
      note.pitch,
      scalePitches,
      root,
      scale,
      context,
      melodyNotes,
      index,
      enableVariation,
    )

    chords.push(chord)
    context.previousChord = chord
    context.previousMelody = note.pitch
    context.measurePosition = (context.measurePosition + 1) % 4
    context.phrasePosition++
  })

  return chords
}

export function generateInstrumentPart(
  harmonicProgression: Chord[],
  assignedVoiceIndex: 1 | 2 | 3,
  instrumentConfig: InstrumentConfig,
  melodyNotes: Note[],
): Note[] {
  const instrumentNotes: Note[] = []
  let previousVoicePitch: number | null = null

  harmonicProgression.forEach((chord, index) => {
    const melodyNote = melodyNotes[index]

    if (!melodyNote) {
      console.log(`[Harmonize] Warning: No melody note at index ${index}, skipping`)
      return
    }

    if (chord.voices[0] === -1) {
      instrumentNotes.push({
        pitch: -1,
        duration: melodyNote.duration,
        offset: melodyNote.offset,
      })
      previousVoicePitch = null
      return
    }

    let voicePitch = chord.voices[assignedVoiceIndex]

    voicePitch = constrainToInstrumentRange(
      voicePitch,
      instrumentConfig.minMidi,
      instrumentConfig.maxMidi,
      previousVoicePitch,
    )

    instrumentNotes.push({
      pitch: voicePitch,
      duration: melodyNote.duration,
      offset: melodyNote.offset,
    })

    previousVoicePitch = voicePitch
  })

  return instrumentNotes
}

export function constrainToInstrumentRange(
  pitch: number,
  minMidi: number,
  maxMidi: number,
  previousPitch: number | null,
): number {
  let adjustedPitch = pitch

  while (adjustedPitch < minMidi) adjustedPitch += 12
  while (adjustedPitch > maxMidi) adjustedPitch -= 12

  if (previousPitch !== null) {
    const interval = Math.abs(adjustedPitch - previousPitch)

    if (interval > 8) {
      const pitchClass = pitch % 12
      const previousOctave = Math.floor(previousPitch / 12)

      let bestPitch = adjustedPitch
      let bestDistance = interval

      for (let octave = previousOctave - 1; octave <= previousOctave + 1; octave++) {
        const candidate = octave * 12 + pitchClass
        if (candidate >= minMidi && candidate <= maxMidi) {
          const distance = Math.abs(candidate - previousPitch)
          if (distance < bestDistance) {
            bestDistance = distance
            bestPitch = candidate
          }
        }
      }

      adjustedPitch = bestPitch
    }
  }

  return adjustedPitch
}


// ==================== POLYPHONIC PROGRESSION GENERATION ====================

export function generateHarmonicProgressionPolyphonic(
  melodicLines: Note[][],
  root: number,
  scale: number[],
  mode: string,
  enableVariation: boolean,
): Chord[] {
  const scalePitches = scale.map((interval) => (root + interval) % 12)
  const chords: Chord[] = []

  const maxLength = Math.max(...melodicLines.map((line) => line.length))

  const context: VoiceLeadingContext = {
    previousChord: null,
    previousMelody: null,
    measurePosition: 0,
    phrasePosition: 0,
    instrumentVariation: enableVariation ? Math.random() : 0,
  }

  for (let i = 0; i < maxLength; i++) {
    const simultaneousNotes: number[] = []

    for (const line of melodicLines) {
      if (i < line.length && line[i].pitch !== -1) {
        simultaneousNotes.push(line[i].pitch)
      }
    }

    if (simultaneousNotes.length === 0) {
      chords.push({
        root: 0,
        quality: "major",
        inversion: 0,
        voices: [-1, -1, -1, -1],
      })
      context.measurePosition = (context.measurePosition + 1) % 4
      context.phrasePosition++
      continue
    }

    const chord = analyzeVerticalHarmony(
      simultaneousNotes,
      scalePitches,
      root,
      scale,
      context,
      melodicLines,
      i,
      enableVariation,
    )

    chords.push(chord)
    context.previousChord = chord
    context.previousMelody = simultaneousNotes[0]
    context.measurePosition = (context.measurePosition + 1) % 4
    context.phrasePosition++
  }

  return chords
}

// ==================== HARMONIC VALIDATION AND REFINEMENT ====================

export function validateHarmonicProgression(
  progression: Chord[],
  melody: Note[],
  root: number,
  scale: number[],
  isMajor: boolean
): HarmonicAnalysis {
  let score = 100;
  const warnings: string[] = [];
  const suggestions: string[] = [];

  for (let i = 1; i < progression.length; i++) {
    const prev = progression[i - 1];
    const curr = progression[i];

    if (prev.root === -1 || curr.root === -1) continue;

    const interval = Math.abs(curr.root - prev.root);

    if (interval > 7) {
      score -= 5;
      warnings.push(`Large harmonic leap at position ${i}`);
    }

    if (prev.inversion === curr.inversion && prev.root !== curr.root) {
      score -= 2;
    }
  }

  const scaleNotes = scale.map((interval) => (root + interval) % 12);

  progression.forEach((chord, i) => {
    if (chord.root === -1) return;

    const melodyPitch = melody[i]?.pitch;
    if (melodyPitch !== undefined && melodyPitch !== -1) {
      const melodyPC = melodyPitch % 12;
      const chordPCs = [chord.root, (chord.root + 4) % 12, (chord.root + 7) % 12];

      if (!chordPCs.includes(melodyPC)) {
        score -= 3;
        warnings.push(`Melody-harmony mismatch at position ${i}`);
      }
    }
  });

  return { score: Math.max(0, score), warnings, suggestions };
}

export function refineHarmonicProgression(
  progression: Chord[],
  melody: Note[],
  root: number,
  scale: number[],
  isMajor: boolean
): Chord[] {
  const refined = [...progression];

  for (let i = 1; i < refined.length; i++) {
    const prev = refined[i - 1];
    const curr = refined[i];

    if (prev.root === -1 || curr.root === -1) continue;

    const interval = Math.abs(curr.root - prev.root);

    if (interval > 7) {
      const betterInversion = findBestInversionForCommonTone(curr, prev);
      if (betterInversion) {
        refined[i] = { ...curr, inversion: betterInversion.inversion as 0 | 1 | 2 };
      }
    }
  }

  for (let i = 0; i < refined.length; i++) {
    const chord = refined[i];
    if (chord.root === -1) continue;

    const melodyPitch = melody[i]?.pitch;
    if (melodyPitch !== undefined && melodyPitch !== -1) {
      const melodyPC = melodyPitch % 12;
      const intervals = chord.quality === "major" ? [0, 4, 7] : [0, 3, 7];
      const chordPCs = intervals.map((interval) => (chord.root + interval) % 12);

      if (!chordPCs.includes(melodyPC)) {
        const scaleNotes = scale.map((interval) => (root + interval) % 12);
        const closestScaleNote = scaleNotes.reduce((prev, curr) =>
          Math.abs(curr - melodyPC) < Math.abs(prev - melodyPC) ? curr : prev
        );

        const newRoot = closestScaleNote;
        refined[i] = { ...chord, root: newRoot };
      }
    }
  }

  return refined;
}

export function findBestInversionForCommonTone(
  currentChord: Chord,
  previousChord: Chord
): { inversion: number; commonTone: number } | null {
  const intervals = currentChord.quality === "major" ? [0, 4, 7] : [0, 3, 7];
  const prevIntervals = previousChord.quality === "major" ? [0, 4, 7] : [0, 3, 7];

  const prevPitches = prevIntervals.map((interval) => (previousChord.root + interval) % 12);
  const currPitches = intervals.map((interval) => (currentChord.root + interval) % 12);

  const commonTones = currPitches.filter((pitch) => prevPitches.includes(pitch));

  if (commonTones.length > 0) {
    const commonTone = commonTones[0];
    const index = currPitches.indexOf(commonTone);

    if (index === 1) return { inversion: 1, commonTone };
    if (index === 2) return { inversion: 2, commonTone };
  }

  return null;
}

export function smoothVoiceLeading(voices: number[], prevVoices: number[], config: InstrumentConfig): number[] {
  return voices.map((voice, i) => {
    if (prevVoices[i] !== undefined && voice !== -1) {
      // Constrain to instrument range with previous voice for smooth motion
      return constrainToInstrumentRange(voice, config.minMidi, config.maxMidi, prevVoices[i]);
    }
    return voice;
  });
}

export function analyzeVerticalHarmony(
  pitches: number[],
  scaleNotes: number[],
  root: number,
  scale: number[],
  context: VoiceLeadingContext,
  melodicLines: Note[][],
  index: number,
  enableVariation: boolean
): Chord {
  const pitchClasses = pitches.map((p) => p % 12);
  const isMajor = scale[2] === 4;
  
  const degreeScores: Record<number, number> = {};

  for (let degree = 1; degree <= 7; degree++) {
    let score = 0;
    const chordQuality = getChordQuality(degree, isMajor);
    const chordRoot = (root + scale[degree - 1]) % 12;
    const intervals = chordQuality === "major" ? [0, 4, 7] : chordQuality === "minor" ? [0, 3, 7] : [0, 3, 6];
    const chordPitches = intervals.map((interval) => (chordRoot + interval) % 12);

    pitchClasses.forEach((pc) => {
      if (chordPitches.includes(pc)) {
        score += 2;
      } else if (scaleNotes.includes(pc)) {
        score += 1;
      }
    });

    degreeScores[degree] = score;
  }

  const maxScore = Math.max(...Object.values(degreeScores));
  const bestDegree = parseInt(
    Object.keys(degreeScores).find((k) => degreeScores[parseInt(k)] === maxScore) || "1"
  );

  const quality = getChordQuality(bestDegree, isMajor);
  const chordRoot = (root + scale[bestDegree - 1]) % 12;

  // Handle voices array properly - take up to 4 pitches or pad with -1
  let voices: [number, number, number, number];
  if (pitches.length >= 4) {
    // If we have 4 or more pitches, take the first 4
    voices = [pitches[0], pitches[1], pitches[2], pitches[3]];
  } else {
    // If we have fewer than 4, pad with -1
    const paddedPitches = pitches.concat(Array(4 - pitches.length).fill(-1));
    voices = [paddedPitches[0], paddedPitches[1], paddedPitches[2], paddedPitches[3]];
  }

  return {
    root: chordRoot,
    quality,
    inversion: 0,
    voices
  };
}

