if (typeof Hp === "undefined") {
    Hp = {};
}

Hp.assets = {
    _imageCache: {},
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
    if (Hp.assets._imageCache.hasOwnProperty(imageKey)) {
        return Hp.assets._imageCache[imageKey];
    } else {
        const image = Hp.assets._imageCache[imageKey] = document.createElement("img");
        image.id = "asset-" + imageName;
        image.alt = "An image file named '" + imageName + "' used in the game.";
        image.src = "img/" + imageKey + ".png";
        image.classList.add("asset");
        image.classList.add("offscreen");
    }
};

Hp.assets.audio = function (assetName) {
    if (Hp.assets._audioCache.hasOwnProperty(assetName)) {
        return Hp.assets._audioCache[assetName];
    } else {
        return Hp.assets._audioCache[assetName] = new Audio("/audio/" + assetName + ".ogg");
    }
};
