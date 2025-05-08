class SoundManager {
    constructor() {
        this.sounds = {};
    }

    load(name, src) {
        const audio = new Audio(src);
        this.sounds[name] = audio;
    }

    play(name) {
        if (this.sounds[name]) {
            this.sounds[name].currentTime = 0;
            this.sounds[name].playbackRate = 1;
            this.sounds[name].play();
        }
    }

    stop(name) {
        if (this.sounds[name]) {
            this.sounds[name].pause();
            this.sounds[name].currentTime = 0;
        }
    }
}
