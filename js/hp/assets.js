HpAssetManager = class {
    constructor() {
        this._audioCache = {};
    }

    audio(audioName) {
        if (this._audioCache.hasOwnProperty(audioName)) {
            return this._audioCache[audioName];
        } else {
            const audio = new Audio("/audio/" + audioName + ".ogg");
            this._audioCache[audioName] = audio;
            return audio;
        }
    }
};
