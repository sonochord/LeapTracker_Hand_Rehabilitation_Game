var SampleLibrary = {
    minify: false,
    ext: '.[mp3|ogg]',
    baseUrl: '/samples/',
    list: ['piano'],
    onload: null,



    load: function (arg) {
        var t, rt, i;
        (arg) ? t = arg: t = {};
        t.instruments = t.instruments || this.list;
        t.baseUrl = t.baseUrl || this.baseUrl;
        t.onload = t.onload || this.onload;

        rt = {};

        if (Array.isArray(t.instruments)) {
            for (i = 0; i <= t.instruments.length - 1; i++) {
                var newT = this[t.instruments[i]];
                if (t.instruments[i] === 'FMSynth' || t.instruments[i] === 'BassSynth' || t.instruments[i] === 'Flute') {
                    rt[t.instruments[i]] = newT.create();
                } else {
                    rt[t.instruments[i]] = new Tone.Sampler(
                        newT, {
                            baseUrl: t.baseUrl + t.instruments[i] + "/",
                            onload: t.onload,
                            release: 0.5 // Add release time (in seconds)
                        }
                    )
                }
            }
            return rt
        } else {
            newT = this[t.instruments];
            if (t.instruments === 'FMSynth' || t.instruments === 'BassSynth' || t.instruments === 'Flute') {
                return newT.create();
            } else {
                var s = new Tone.Sampler(
                    newT, {
                        baseUrl: t.baseUrl + t.instruments + "/",
                        onload: t.onload,
                        release: 0.5 // Add release time (in seconds)
                    }
                )
                return s
            }
        }
    },


    'piano': {
        'A7': 'A7.mp3',
        'A1': 'A1.mp3',
        'A2': 'A2.mp3',
        'A3': 'A3.mp3',
        'A4': 'A4.mp3',
        'A5': 'A5.mp3',
        'A6': 'A6.mp3',
        'A#7': 'As7.mp3',
        'A#1': 'As1.mp3',
        'A#2': 'As2.mp3',
        'A#3': 'As3.mp3',
        'A#4': 'As4.mp3',
        'A#5': 'As5.mp3',
        'A#6': 'As6.mp3',
        'B7': 'B7.mp3',
        'B1': 'B1.mp3',
        'B2': 'B2.mp3',
        'B3': 'B3.mp3',
        'B4': 'B4.mp3',
        'B5': 'B5.mp3',
        'B6': 'B6.mp3',
        'C7': 'C7.mp3',
        'C1': 'C1.mp3',
        'C2': 'C2.mp3',
        'C3': 'C3.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'C6': 'C6.mp3',
        'C7': 'C7.mp3',
        'C#7': 'Cs7.mp3',
        'C#1': 'Cs1.mp3',
        'C#2': 'Cs2.mp3',
        'C#3': 'Cs3.mp3',
        'C#4': 'Cs4.mp3',
        'C#5': 'Cs5.mp3',
        'C#6': 'Cs6.mp3',
        'D7': 'D7.mp3',
        'D1': 'D1.mp3',
        'D2': 'D2.mp3',
        'D3': 'D3.mp3',
        'D4': 'D4.mp3',
        'D5': 'D5.mp3',
        'D6': 'D6.mp3',
        'D#7': 'Ds7.mp3',
        'D#1': 'Ds1.mp3',
        'D#2': 'Ds2.mp3',
        'D#3': 'Ds3.mp3',
        'D#4': 'Ds4.mp3',
        'D#5': 'Ds5.mp3',
        'D#6': 'Ds6.mp3',
        'E7': 'E7.mp3',
        'E1': 'E1.mp3',
        'E2': 'E2.mp3',
        'E3': 'E3.mp3',
        'E4': 'E4.mp3',
        'E5': 'E5.mp3',
        'E6': 'E6.mp3',
        'F7': 'F7.mp3',
        'F1': 'F1.mp3',
        'F2': 'F2.mp3',
        'F3': 'F3.mp3',
        'F4': 'F4.mp3',
        'F5': 'F5.mp3',
        'F6': 'F6.mp3',
        'F#7': 'Fs7.mp3',
        'F#1': 'Fs1.mp3',
        'F#2': 'Fs2.mp3',
        'F#3': 'Fs3.mp3',
        'F#4': 'Fs4.mp3',
        'F#5': 'Fs5.mp3',
        'F#6': 'Fs6.mp3',
        'G7': 'G7.mp3',
        'G1': 'G1.mp3',
        'G2': 'G2.mp3',
        'G3': 'G3.mp3',
        'G4': 'G4.mp3',
        'G5': 'G5.mp3',
        'G6': 'G6.mp3',
        'G#7': 'Gs7.mp3',
        'G#1': 'Gs1.mp3',
        'G#2': 'Gs2.mp3',
        'G#3': 'Gs3.mp3',
        'G#4': 'Gs4.mp3',
        'G#5': 'Gs5.mp3',
        'G#6': 'Gs6.mp3'
    },

};

function createFMSynth() {
    const synth = new Tone.PolySynth(Tone.FMSynth);
  
    synth.set({
      volume: -12.5,
      detune: 0,
      maxPolyphony: 64,
      options: {
        modulationIndex: 0,
        harmonicity: 0,
        oscillator: {
          type: "sawtooth",
          partialCount: 0,
          partials: [],
        },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.8,
          release: 0.1,
          attackCurve: "linear",
          decayCurve: "linear",
          releaseCurve: "linear",
        },
        modulation: {
          type: "sine",
          partialCount: 0,
          partials: [],
        },
        modulationEnvelope: {
          attack: 0.5,
          decay: 0,
          sustain: 1,
          release: 0.5,
          attackCurve: "linear",
          decayCurve: "linear",
          releaseCurve: "linear",
        },
      },
    });
  
    return synth;
  }

  function createBassSynth() {
    return new Tone.MonoSynth({
        oscillator: {
            type: "sawtooth"
        },
        envelope: {
            attack: 0.1,
            decay: 0.3,
            sustain: 0.4,
            release: 1.4
        },
        filterEnvelope: {
            attack: 0.001,
            decay: 0.1,
            sustain: 0.1,
            release: 1,
            baseFrequency: 300,
            octaves: 4
        }
    });
}

function createFlute() {
    const fluteSynth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.5 }
    });

    const noiseSynth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.5 }
    });

    const noiseGain = new Tone.Gain(0.03);
    const filter1 = new Tone.Filter({ type: 'highpass', frequency: 1000, rolloff: -12 });
    const filter2 = new Tone.Filter({ type: 'lowpass', frequency: 7000, rolloff: -12 });

    noiseSynth.connect(noiseGain);
    noiseGain.connect(filter1);
    fluteSynth.connect(filter2);

    const output = new Tone.Gain(1);
    filter1.connect(output);
    filter2.connect(output);

    return {
        triggerAttackRelease: (note, duration, time, velocity) => {
            fluteSynth.triggerAttackRelease(note, duration, time, velocity);
            noiseSynth.triggerAttackRelease(duration, time, velocity);
        },
        connect: (destination) => {
            output.connect(destination);
        },
        disconnect: () => {
            output.disconnect();
        },
        volume: output.gain
    };
}

export {
    SampleLibrary,
    createFMSynth,
    createBassSynth,
    createFlute
};