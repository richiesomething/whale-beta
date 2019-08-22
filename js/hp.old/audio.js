if (typeof Hp === "undefined") {
    Hp = {};
}

Hp.audio = {};

Hp.audio.start = function (audioAsset) {
    Hp.audio.stop(audioAsset);
    audioAsset.currentTime = 0;
    audioAsset.play();
};

Hp.audio.stop = function (audioAsset) {
    audioAsset.pause();
    audioAsset.currentTime = 0;
};

Hp.audio.startLooped = function (audioAsset) {
    Hp.audio.start(audioAsset);
    audioAsset.addEventListener('ended', function() {
        Hp.audio.start(audioAsset);
    }, false);
};
