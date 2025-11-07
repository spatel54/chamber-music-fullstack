# Backend Fix Plan - Restore v0version Accurate Harmonization

## Critical Issues Identified

### 1. helper-functions.ts - MISSING CORE FUNCTIONS
**Missing from current:**
- `analyzeAndBuildChord()` - Main chord analysis with context
- Proper `selectChordDegree()` with weighted probabilities  
- `avoidParallelMotion()` - Prevents parallel 5ths/octaves
- Correct signatures for `voiceChord()`, `findClosestPitch()`, `applyVoiceLeadingToVoice()`

### 2. generateHarmonicProgression() - WRONG LOGIC
**v0version (CORRECT):**
```typescript
// Lines 665-714
- Uses analyzeAndBuildChord() for each note
- Maintains VoiceLeadingContext with previousChord, measurePosition, phrasePosition
- Considers strong beats and phrase endings
- Applies weighted chord selection (I=3.0, V=2.5, IV=2.0)
```

**Current (BROKEN):**
```typescript
// Lines 286-350
- Simple degree selection without context
- No measurePosition/phrasePosition tracking
- Missing selectChordDegree() implementation
- No voice leading context
```

### 3. voiceChord() - COMPLETELY DIFFERENT
**v0version (CORRECT):**
```typescript
// Lines 1024-1082
voiceChord(melodyPitch, chordRoot, chordThird, chordFifth, inversion, context)
// Returns [soprano, alto, tenor, bass] - 4 voices
// Fixed ranges: alto(55-76), tenor(48-67), bass(40-60)
// Applies voice leading per voice with chord tones
// Calls avoidParallelMotion()
```

**Current (BROKEN):**
```typescript
// Lines 474-525  
voiceChord(chord, instrumentConfig, lastPitch, melodyPitch)
// Wrong parameters - takes chord object instead of pitches
// No SATB ranges
// Missing parallel motion avoidance
```

## Files to Replace

1. **src/services/helper-functions.ts**
   - Copy functions from v0 lines 854-1175
   - Add exports
   - Fix imports

2. **src/services/musicProcessor.ts**  
   - Update generateHarmonicProgression() call
   - Ensure context is passed correctly

## Next Steps

1. Restore helper-functions.ts with v0 logic
2. Test with sample MusicXML
3. Verify output accuracy

