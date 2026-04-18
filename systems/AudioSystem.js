import * as Tone from 'tone';

class AudioSystem {
    constructor() {
        this.initialized = false;
        this.sounds = {};
    }

    async init() {
        if (this.initialized) return;
        
        await Tone.start();
        
        // Setup Samplers/Synths
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.synth.volume.value = -12;

        // Procedural sound effects
        this.choppingSound = new Tone.MembraneSynth().toDestination();
        this.trashSound = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
        }).toDestination();
        
        this.swimSound = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0 }
        }).toDestination();

        this.fireSound = new Tone.NoiseSynth({
            noise: { type: 'brown' },
            envelope: { attack: 0.1, decay: 0.5, sustain: 0.2 }
        }).toDestination();

        this.initialized = true;
    }

    playChopping() {
        if (!this.initialized) return;
        this.choppingSound.triggerAttackRelease('C1', '8n');
    }

    playTrash() {
        if (!this.initialized) return;
        this.trashSound.triggerAttackRelease('16n');
    }

    playSwim() {
        if (!this.initialized) return;
        this.swimSound.triggerAttackRelease('16n');
    }

    playFire() {
        if (!this.initialized) return;
        this.fireSound.triggerAttackRelease('8n');
    }

    playMoney() {
        if (!this.initialized) return;
        this.synth.triggerAttackRelease(['C4', 'E4', 'G4'], '16n');
    }

    playHurt() {
        if (!this.initialized) return;
        this.synth.triggerAttackRelease('C2', '8n');
    }

    playQuestComplete() {
        if (!this.initialized) return;
        const now = Tone.now();
        this.synth.triggerAttackRelease('C4', '8n', now);
        this.synth.triggerAttackRelease('E4', '8n', now + 0.1);
        this.synth.triggerAttackRelease('G4', '8n', now + 0.2);
        this.synth.triggerAttackRelease('C5', '4n', now + 0.3);
    }
}

export const audioSystem = new AudioSystem();
