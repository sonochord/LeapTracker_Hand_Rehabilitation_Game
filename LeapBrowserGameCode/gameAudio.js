let audioInitialised = false;

const movementSynth = new Tone.PolySynth(Tone.FMSynth).toDestination();
movementSynth.set({
    volume: -5,
    harmonicity: 3.0,
    modulationIndex: 10,
    oscillator: { type: "sine" },
    envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.1,
        release: 0.1
    },
    modulation: { type: "square" },
    modulationEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.2
    }
});

const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).toDestination();
const delay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.3, wet: 0.2 }).toDestination();

const crashSynth = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 }
}).toDestination();

const respawnSynth = new Tone.PolySynth(Tone.Synth).toDestination();
respawnSynth.set({
    volume: -12,
    oscillator: { type: "sine" },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.5 }
});

const movementScale = [
    "C6",
    "B5", "A5", "G5", "F5", "E5", "D5", "C5",
    "B4", "A4", "G4", "F4", "E4", "D4", "C4",
    "B3", "A3", "G3", "F3", "E3", "D3", "C3",
    "B2", "A2", "G2", "F2", "E2", "D2", "C2"
];
let lastNoteIndex = 0;

let audioContext;
let crashNoiseSynth;
let badBlockSynth;

const notes = [
  { name: 'C6', frequency: 1046.50, duration: 0.23316075, delay: 0 },
  { name: 'F6', frequency: 1396.91, duration: 0.38860125, delay: 0.07772025 }
];

const badNotes = [
  { name: 'F7', frequency: 2793.83, duration: 0.038860125, delay: 0 },
  { name: 'E7', frequency: 2637.02, duration: 0.038860125, delay: 0.038860125 },
  { name: 'D7', frequency: 2349.32, duration: 0.038860125, delay: 0.07772025 },
  { name: 'C#7', frequency: 2217.46, duration: 0.038860125, delay: 0.11658037500000001 },
  { name: 'B6', frequency: 1975.53, duration: 0.038860125, delay: 0.1554405 },
  { name: 'A#6', frequency: 1864.66, duration: 0.038860125, delay: 0.194300625 },
  { name: 'G6', frequency: 1567.98, duration: 0.038860125, delay: 0.23316075000000003 },
  { name: 'F#6', frequency: 1479.98, duration: 0.038860125, delay: 0.272020875 },
  { name: 'F6', frequency: 1396.91, duration: 0.38860125, delay: 0.310881 }
];

export async function initAudio() {
    if (audioInitialised) return;
    
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await Tone.start();
        await audioContext.resume();
        
        // Initialise synths
        crashNoiseSynth = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.05,
                release: 0.1
            }
        }).toDestination();

        badBlockSynth = new Tone.Synth().toDestination();
        
        audioInitialised = true;
        console.log("Audio initialised successfully");
    } catch (error) {
        console.error("Failed to initialise audio:", error);
        throw error;
    }
}

function playNote(frequency, duration) {
    if (!audioInitialised) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

export function playScoreSound() {
    if (!audioInitialised) {
        console.warn("Audio not initialised yet. Skipping score sound.");
        return;
    }
    
    notes.forEach(note => {
        setTimeout(() => {
            playNote(note.frequency, note.duration);
        }, note.delay * 1000);
    });
}

export function playMovementSound(pinchFactor) {
    if (!audioInitialised) {
        console.warn('Audio not initialised yet. Skipping movement sound.');
        return;
    }
    const noteIndex = Math.floor(pinchFactor * (movementScale.length - 1));
    if (noteIndex !== lastNoteIndex) {
        const note = movementScale[noteIndex];
        movementSynth.triggerAttackRelease(note, "8n");
        lastNoteIndex = noteIndex;
    }
}

let lastCrashTime = 0;
const minTimeBetweenCrashes = 0.5; // 500ms in seconds

export function playCrashSound() {
    if (!audioInitialised) {
        console.warn('Audio not initialised yet. Skipping crash sound.');
        return;
    }
    
    const now = Tone.now();
    if (now - lastCrashTime >= minTimeBetweenCrashes) {
        crashNoiseSynth.triggerAttackRelease("16n", now);
        playBadBlockSound(now);
        lastCrashTime = now;
    }
}

function playBadBlockSound(startTime) {
    if (!audioInitialised) return;

    badNotes.forEach((note, index) => {
        badBlockSynth.triggerAttackRelease(note.frequency, note.duration, startTime + note.delay);
    });
}

export function playGameOverSound() {
    if (!audioInitialised) return;
    // Your existing playGameOverSound code
}

export function playRespawnSound() {
    if (!audioInitialised) {
        console.warn('Audio not initialised yet. Skipping respawn sound.');
        return;
    }
    const now = Tone.now();
    respawnSynth.triggerAttackRelease("C4", "4n", now);
    respawnSynth.triggerAttackRelease("E4", "4n", now + 0.1);
    respawnSynth.triggerAttackRelease("G4", "4n", now + 0.2);
    respawnSynth.triggerAttackRelease("C5", "2n", now + 0.3);
}

export { audioInitialised, audioContext };