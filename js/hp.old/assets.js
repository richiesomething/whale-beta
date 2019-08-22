if (typeof Hp === "undefined") {
    Hp = {};
}

Hp.assets = {
    _assetCache: {},
    _audioCache: {}
};

Hp.assets.image = function (imageName) {
    const dpi = (window.devicePixelRatio || 1) * 96;

    let sizeHint = "x3";
    if (dpi <= 96) {
        sizeHint = "x1";
    } else if (dpi <= 96*2) {
        sizeHint = "x2";
    }

    const imageKey = sizeHint + "/" + imageName;
    if (Hp.assets._assetCache.hasOwnProperty(imageKey)) {
        return Hp.assets._assetCache[imageKey];
    } else {
        const image = Hp.assets._assetCache[imageKey] = new Image();
        image.src = "img/" + imageKey;
        console.log(image.src);
        return image;
    }
};

Hp.assets.audio = function (assetName) {
    if (Hp.assets._audioCache.hasOwnProperty(assetName)) {
        return Hp.assets._audioCache[assetName];
    } else {
        return Hp.assets._audioCache[assetName] = new Audio("/audio/" + assetName + ".ogg");
    }
};
