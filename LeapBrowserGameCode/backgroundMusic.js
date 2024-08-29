let instrumentsReady = false;
let instruments = {};
let musicChannel;
let reverb, delay;

import { SampleLibrary, createFMSynth, createBassSynth, createFlute } from './Tonejs-Instruments.js';

const instrumentConfigs = {
    "Kick": {
        type: "Player",
        options: {
            url: "/samples/drums/Kick.mp3",
            volume: -1
        },
        postProcess: (instrument) => {
            const panner = new Tone.Panner(0).connect(musicChannel);
            instrument.connect(panner);
            instrument.panner = panner;
            return instrument;
        }
    },
    "Snare": {
        type: "Player",
        options: {
            url: "/samples/drums/Snare.mp3",
            volume: -1
        },
        postProcess: (instrument) => {
            const panner = new Tone.Panner(0).connect(musicChannel);
            instrument.connect(panner);
            instrument.panner = panner;
            return instrument;
        }
    },
    "Hats": { 
        type: "MetalSynth", 
        options: { 
            frequency: 200, 
            envelope: { 
                attack: 0.001, 
                decay: 0.1, 
                release: 0.01 
            },
            volume: -40
        },
        postProcess: (instrument) => {
            const panner = new Tone.Panner(0).connect(musicChannel);
            instrument.connect(panner);
            instrument.panner = panner;
            return instrument;
        }
    },
    "Bass": {
        type: "BassSynth",
        create: function() {
            const bass = createBassSynth();
            const panner = new Tone.Panner(0).connect(musicChannel);
            bass.connect(panner);
            bass.panner = panner;
            console.log(`Created Bass instrument:`, bass);
            return bass;
        }
    },
    "Chords": {
        type: "FMSynth",
        create: function() {
            const chords = createFMSynth();
            const panner = new Tone.Panner(0).connect(musicChannel);
            chords.connect(panner);
            chords.panner = panner;
            console.log(`Created Chords instrument:`, chords);
            return chords;
        }
    },
    "Piano": {
        type: "Sampler",
        load: function() {
            console.log("Attempting to load piano samples...");
            return new Promise((resolve, reject) => {
                const piano = SampleLibrary.load({
                    instruments: "piano",
                    baseUrl: "/samples/",
                    onload: () => {
                        console.log("Piano samples loaded successfully");
                        const panner = new Tone.Panner(0).connect(musicChannel);
                        piano.connect(panner);
                        piano.panner = panner;
                        resolve(piano);
                    }
                });
            });
        }
    },
    "Poly Synth": { 
        type: "PolySynth", 
        options: { volume: -1, polyphony: 10, oscillator: { type: "sawtooth" } },
        postProcess: (instrument) => {
            const panner = new Tone.Panner(0).connect(musicChannel);
            instrument.connect(panner);
            instrument.panner = panner;
            return instrument;
        }
    },
    "Melody High": { 
        type: "Synth", 
        options: { volume: -1, oscillator: { type: "square" } },
        postProcess: (instrument) => {
            const panner = new Tone.Panner(0).connect(musicChannel);
            instrument.connect(panner);
            instrument.panner = panner;
            return instrument;
        }
    },
    "Melody Low": { 
        type: "Synth", 
        options: { volume: -6, oscillator: { type: "square" } },
        postProcess: (instrument) => {
            const panner = new Tone.Panner(0).connect(musicChannel);
            instrument.connect(panner);
            instrument.panner = panner;
            return instrument;
        }
    },
    "Flute": {
        type: "Flute",
        create: function() {
            const flute = createFlute();
            const panner = new Tone.Panner(0).connect(musicChannel);
            flute.connect(panner);
            flute.panner = panner;
            console.log(`Created Flute instrument:`, flute);
            return flute;
        }
    },
};

const defaultPans = {
    "Kick": 0,
    "Snare": 0.2,
    "Hats": -0.2,
    "Bass": 0,
    "Chords": -0.9,
    "Piano": -0.1,
    "Poly Synth": 0.9,
    "Melody High": 1,
    "Melody Low": -1,
    "Flute": 1
};

const defaultLevels = {
    "Kick": 2,
    "Snare": 2,
    "Hats": -6,
    "Bass": 5,
    "Chords": 6,
    "Piano": 5,
    "Poly Synth": 0,
    "Melody High": 0,
    "Melody Low": 0,
    "Flute": 0  // Changed from 3 to 0
};

const defaultReverbSends = {
    "Kick": 0,
    "Snare": 0.2,
    "Hats": 0.1,
    "Bass": 0,
    "Chords": 0.3,
    "Piano": 0.2,
    "Poly Synth": 0.25,
    "Melody High": 0.15,
    "Melody Low": 0.15,
    "Flute": 0.2
};

const defaultDelaySends = {
    "Kick": 0,
    "Snare": 0.1,
    "Hats": 0.05,
    "Bass": 0,
    "Chords": 0.15,
    "Piano": 0.1,
    "Poly Synth": 0.2,
    "Melody High": 0.25,
    "Melody Low": 0.25,
    "Flute": 0.2
};

function log(message) {
    console.log(message);
    if (typeof window !== 'undefined' && window.debugOutput) {
        window.debugOutput.innerHTML += message + '<br>';
    }
}

export async function initBackgroundMusic() {
    await Tone.start();
    console.log('Tone.js initialised');
    createMusicChannel();
    await initialiseInstruments();
    
    // Wait a short time to ensure all instruments are fully loaded
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Apply default settings after ensuring instruments are ready
    instrumentsReady = true;
    applyDefaultLevels();
    applyDefaultPans();
    applyDefaultReverbSends();
    applyDefaultDelaySends();
    await loadMIDI();
}

function createMusicChannel() {
    // Create a compressor
    const compressor = new Tone.Compressor({
        threshold: -24,
        ratio: 3,
        attack: 0.003,
        release: 0.25
    });

    // Create the reverb and delay effects
    reverb = new Tone.Reverb({
        decay: 1.5,
        preDelay: 0.01
    });

    delay = new Tone.FeedbackDelay({
        delayTime: "8n",
        feedback: 0.3
    });

    // Create the channel and chain it with the compressor
    musicChannel = new Tone.Channel({
        channelCount: 2, // Explicitly set the channel count to 2 for stereo
        volume: -10 // Set initial volume, adjust as needed
    }).chain(compressor, Tone.Destination);

    // Connect reverb and delay to the music channel
    reverb.connect(musicChannel);

    const delayVolume = new Tone.Volume(-6); // Adjust the value as needed
    delay.chain(delayVolume, musicChannel);

    // Ensure the destination is configured for stereo
    Tone.Destination.channelCount = 2;

    console.log("Music channel created with compressor, reverb, and delay configured for stereo output");
}


// Initialise instruments with sends to reverb and delay
async function initialiseInstruments() {
    const instrumentPromises = Object.entries(instrumentConfigs).map(async ([name, config]) => {
        try {
            let instrument;
            if (config.type === "Player") {
                instrument = new Tone.Player(config.options);
                await instrument.load(config.options.url);
            } else if (config.load) {
                instrument = await config.load();
            } else if (config.create) {
                instrument = config.create();
                console.log(`Created ${name} instrument:`, instrument);
            } else {
                instrument = new Tone[config.type](config.options);
            }

            // Apply post-processing (including panning) if defined
            if (config.postProcess) {
                instrument = config.postProcess(instrument);
            } else {
                // If no postProcess is defined, add a default panner
                const panner = new Tone.Panner(0).connect(musicChannel);
                instrument.connect(panner);
                instrument.panner = panner;
            }

            // Add send functionality to all instruments
            instrument.send = (effect, amount) => {
                const send = new Tone.Gain(amount);
                instrument.connect(send);
                send.connect(effect);
                return send;
            };

            // Connect to reverb and delay
            instrument.reverbSend = instrument.send(reverb, 0);
            instrument.delaySend = instrument.send(delay, 0);

            log(`Initialised ${name} and connected to music channel with panner and sends`);
            return [name, instrument];
        } catch (error) {
            console.error(`Error initialising ${name}:`, error);
            return [name, null];
        }
    });
    const loadedInstruments = await Promise.all(instrumentPromises);
    instruments = Object.fromEntries(loadedInstruments.filter(([_, inst]) => inst !== null));

    console.log("Instruments initialised:", Object.keys(instruments));
}

function applyDefaultLevels() {
    if (!instrumentsReady) {
        console.warn("Instruments not ready. Skipping volume adjustment.");
        return;
    }
    console.log("Applying default volume levels");
    Object.entries(defaultLevels).forEach(([name, level]) => {
        setInstrumentVolume(name, level);
    });
    console.log("Default volume levels applied");
}

function setInstrumentVolume(instrumentName, volume) {
    if (!instrumentsReady) {
        console.warn("Instruments not ready. Skipping volume adjustment.");
        return;
    }
    const instrument = instruments[instrumentName];
    if (instrument) {
        if (instrument.volume && typeof instrument.volume.value !== 'undefined') {
            instrument.volume.value = volume;
            console.log(`Set ${instrumentName} volume to ${volume} dB`);
        } else if (instrument.volume && typeof instrument.volume.setValueAtTime === 'function') {
            instrument.volume.setValueAtTime(volume, Tone.now());
            console.log(`Set ${instrumentName} volume to ${volume} dB using setValueAtTime`);
        } else if (typeof instrument.set === 'function') {
            instrument.set({ volume: volume });
            console.log(`Set ${instrumentName} volume to ${volume} dB using .set() method`);
        } else {
            console.warn(`Unable to set volume for ${instrumentName}`);
        }
    } else {
        console.warn(`Instrument ${instrumentName} not found. Unable to set volume.`);
    }
}
function setInstrumentPan(instrumentName, pan) {
    if (!instrumentsReady) {
        console.warn("Instruments not ready. Skipping pan adjustment.");
        return;
    }
    const instrument = instruments[instrumentName];
    if (instrument && instrument.panner) {
        instrument.panner.pan.value = pan;
        console.log(`Set ${instrumentName} pan to ${pan}`);
    } else {
        console.warn(`Unable to set pan for ${instrumentName}`);
    }
}

function applyDefaultPans() {
    if (!instrumentsReady) {
        console.warn("Instruments not ready. Skipping pan adjustment.");
        return;
    }
    console.log("Applying default pan positions");
    Object.entries(defaultPans).forEach(([name, pan]) => {
        setInstrumentPan(name, pan);
    });
    console.log("Default pan positions applied");
}



function applyDefaultReverbSends() {
    if (!instrumentsReady) {
        console.warn("Instruments not ready. Skipping reverb send adjustment.");
        return;
    }
    console.log("Applying default reverb send levels");
    Object.entries(defaultReverbSends).forEach(([name, level]) => {
        setInstrumentReverbSend(name, level);
    });
    console.log("Default reverb send levels applied");
}

function setInstrumentReverbSend(instrumentName, level) {
    if (!instrumentsReady) {
        console.warn("Instruments not ready. Skipping reverb send adjustment.");
        return;
    }
    const instrument = instruments[instrumentName];
    if (instrument && instrument.reverbSend) {
        instrument.reverbSend.gain.setValueAtTime(level, Tone.now());
        console.log(`Set ${instrumentName} reverb send to ${level}`);
    } else {
        console.warn(`Unable to set reverb send for ${instrumentName}`);
    }
}

function applyDefaultDelaySends() {
    if (!instrumentsReady) {
        console.warn("Instruments not ready. Skipping delay send adjustment.");
        return;
    }
    console.log("Applying default delay send levels");
    Object.entries(defaultDelaySends).forEach(([name, level]) => {
        setInstrumentDelaySend(name, level);
    });
    console.log("Default delay send levels applied");
}

function setInstrumentDelaySend(instrumentName, level) {
    if (!instrumentsReady) {
        console.warn("Instruments not ready. Skipping delay send adjustment.");
        return;
    }
    const instrument = instruments[instrumentName];
    if (instrument && instrument.delaySend) {
        instrument.delaySend.gain.setValueAtTime(level, Tone.now());
        console.log(`Set ${instrumentName} delay send to ${level}`);
    } else {
        console.warn(`Unable to set delay send for ${instrumentName}`);
    }
}


async function loadMIDI() {
    if (!instrumentsReady) {
        log("Instruments are not ready yet. Please wait.");
        return;
    }

    log("Starting MIDI load process");
    const url = "PinchSong.json";
    try {
        log("Fetching MIDI file");
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        log("MIDI file loaded successfully");
        if (!json.tracks || !Array.isArray(json.tracks)) {
            throw new Error("Invalid MIDI JSON structure: Missing 'tracks' array");
        }
        
        log("Stopping and cancelling Transport");
        Tone.Transport.stop();
        Tone.Transport.cancel();
        
        log("Setting Transport BPM");
        const bpm = json.header.tempos && json.header.tempos[0] && json.header.tempos[0].bpm 
            ? json.header.tempos[0].bpm 
            : 192.99989385005838;
        Tone.Transport.bpm.value = bpm;
        log(`Transport BPM set to: ${bpm}`);
        
        log("Processing tracks");
        json.tracks.forEach((track, index) => {
            if (track.notes && Array.isArray(track.notes)) {
                const instrumentName = track.name || `Instrument ${index}`;
                const instrument = instruments[instrumentName];
                
                if (!instrument) {
                    console.warn(`Instrument ${instrumentName} not found. Using default synth.`);
                    instruments[instrumentName] = new Tone.Synth().connect(musicChannel);
                } else {
                    console.log(`Using instrument: ${instrumentName}, type: ${instrument.constructor.name}`);
                }
                
                track.notes.forEach(note => {
                    Tone.Transport.schedule((time) => {
                        try {
                            if (instrument instanceof Tone.Player) {
                                instrument.start(time);
                            } else if (instrument.triggerAttackRelease) {
                                instrument.triggerAttackRelease(
                                    note.name,
                                    note.duration,
                                    time,
                                    note.velocity
                                );
                            } else if (instrument.triggerAttack && instrument.triggerRelease) {
                                instrument.triggerAttack(note.name, time, note.velocity);
                                instrument.triggerRelease(note.name, time + note.duration);
                            } else {
                                console.warn(`Instrument ${instrumentName} doesn't have expected play methods`);
                            }
                            console.log(`Scheduled ${instrumentName}: note=${note.name}, time=${time}, duration=${note.duration}, velocity=${note.velocity}`);
                        } catch (error) {
                            console.error(`Error scheduling ${instrumentName}:`, error);
                        }
                    }, note.time);
                });
                
                log(`Scheduled ${track.notes.length} notes for ${instrumentName}`);
            } else {
                log(`No notes found on track ${index}`);
            }
        });
        
        log("Setting up Transport loop");
        const endTime = Math.max(...json.tracks.flatMap(track => track.notes.map(n => n.time + n.duration)));
        Tone.Transport.loopEnd = endTime;
        Tone.Transport.loop = true;
        
        log(`Transport BPM: ${Tone.Transport.bpm.value}, Loop End: ${endTime}`);
        
        log("Starting Transport");
        Tone.Transport.start();
        log(`Actual Transport BPM after start: ${Tone.Transport.bpm.value}`);
    } catch (error) {
        log("Error loading MIDI file: " + error.message);
        console.error("Full error:", error);
    }
}

export function stopMusic() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Object.values(instruments).forEach(instrument => {
      if (instrument.releaseAll) {
        instrument.releaseAll();
      }
    });
    log('Music stopped');
}

window.initBackgroundMusic = initBackgroundMusic;
window.setInstrumentVolume = setInstrumentVolume;
window.stopMusic = stopMusic;
window.setInstrumentPan = setInstrumentPan;
window.applyDefaultPans = applyDefaultPans;
window.setInstrumentReverbSend = setInstrumentReverbSend;
window.applyDefaultReverbSends = applyDefaultReverbSends;
window.setInstrumentDelaySend = setInstrumentDelaySend;
window.applyDefaultDelaySends = applyDefaultDelaySends;