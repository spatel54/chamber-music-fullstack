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

export function extractNotes(xmlDoc: Document): Note[] {
  const notes: Note[] = []
export function getScaleNotes(root: number, scale: number[]): string[] {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  return scale.map((interval) => noteNames[(root + interval) % 12])
}

export function getKeyInfo(fifths: number, mode: string): { root: number; scale: number[] } {
