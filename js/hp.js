const Hp = {};

//
// Debug and error handling:
//

Hp._dbg = true;
Hp._dbgGridColor = "#444";

Hp.errorFlag = false;

Hp.Error = function (optDesc) {
    alert("Something went wrong while running your game:\n" + (optDesc !== null ? optDesc + "\n" : "") +
          "If the game has worked for you before, then please try reloading your browser window.\n" +
          "If that doesn't work, try clearing your cookies and cache before reloading again.");
    if (Hp._dbg && optDesc !== null) {
        console.log("Hp.Error:\n" + optDesc);
    }
    Hp.errorFlag = true;
};

Hp.assert = function (cond, optDescIfFail) {
    if (cond) {
        return;
    }
    if (typeof optDescIfFail === "undefined") {
        optDescIfFail = null;
    }
    throw new Hp.Error(optDescIfFail);
};

//
// Engine core:
//

Hp.gameId   = null;     // Should be set by external code before calling 'init'
Hp.roomId   = null;     // Should be set by external code before calling 'init'
Hp.playerId = null;     // Should be set by external code before calling 'init'

Hp._canvas  = null;
Hp._context = null;

Hp._serverUrl = null;

Hp.page = null;

Hp.init = function (canvas) {
    // Ensuring a game ID, room ID, and player ID have been assigned:
    Hp.assert(Hp.gameId   !== null, "No 'gameId' set by the server.");
    Hp.assert(Hp.roomId   !== null, "No 'roomId' set by the server.");
    Hp.assert(Hp.playerId !== null, "No 'playerId' set by the server.");

    // Initializing the _canvas and renderer:
    Hp._canvas = canvas;
    Hp._context = canvas.getContext("2d");
    Hp.assert(Hp._context !== null, "No valid _canvas context could be acquired.");
    Hp.updateSize();

    // Initializing the server URL:
    Hp._serverUrl = location.protocol + "//" + document.domain + ":" + location.port + "/hp/" + Hp.gameId;
};

Hp.start = function () {
    let lastFrameTimeSec = window.performance.now() / 1000.0;
    let frameRequest = null;

    let drawFrame = function (thisFrameTimeMs) {
        // Requesting the next frame be drawn:
        frameRequest = window.requestAnimationFrame(drawFrame);

        // Calculating a time-delta and using it to draw a frame:
        const thisFrameTimeSec = thisFrameTimeMs / 1000.0;
        const deltaSec = thisFrameTimeSec - lastFrameTimeSec;

        lastFrameTimeSec = thisFrameTimeSec;

        try {
            const ctx = Hp._context;
            const canvasSize = Hp._canvasSize();

            if (Hp.page !== null && !Hp.errorFlag) {
                ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);
                Hp.page.draw(deltaSec);
            } else {
                const message = (Hp._dbg) ?
                    "[Debug] No page is currently loaded in the Harpoon engine." :
                    "An error occurred. Please reload this page.";

                ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);

                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);

                ctx.fillStyle = "#fff";
                ctx.font = "1em monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.fillText(message, canvasSize.x / 2, canvasSize.y / 2);
            }
        } catch (ex) {
            console.log("A fatal error occurred.");
            console.log(ex);
        }
    };

    drawFrame(lastFrameTimeSec);
};

//
// Rendering and game state:
//

Hp.updateSize = function () {
    const canvas = Hp._canvas;
    const ctx = Hp._context;

    const pixRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();    // Getting size in CSS pixels
    canvas.width = rect.width * pixRatio;
    canvas.height = rect.height * pixRatio;

    ctx.scale(pixRatio, pixRatio);
    ctx.clearRect(0, 0, rect.width, rect.height);
};

Hp.BaseStyled = class {
    constructor() {
        this.style = {};
    }

    loadStyleProperty(name, lookup, defaultValue) {
        this.style[name] = lookup.hasOwnProperty(name) ? lookup[name] : defaultValue;
    }
};

Hp.Page = class extends Hp.BaseStyled {
    constructor(name, style, gridSize) {
        super();
        this.name = name;
        this.tiles = [];
        this.gridSize = gridSize;

        this.loadStyleProperty("bgColor", style, "#fff");
    }

    pushTile(tile) {
        this.tiles.push(tile);
        return tile;
    }

    draw(deltaSec) {
        const canvasSize = Hp._canvasSize();
        const ctx = Hp._context;

        // Clearing the background:
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = this.style.bgColor;
        ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);

        // Computing the tile size and drawing each tile in a rectangle measured from the tile size:
        const tileSize = {x: canvasSize.x / this.gridSize.x, y: canvasSize.y / this.gridSize.y};
        for (let iTile = 0; iTile < this.tiles.length; iTile++) {
            const tile = this.tiles[iTile];
            let pixRect = {
                x: tile.rect.x * tileSize.x, y: tile.rect.y * tileSize.y,
                w: tile.rect.w * tileSize.x, h: tile.rect.h * tileSize.y
            };
            tile.draw(deltaSec, pixRect);
        }
    }
};

Hp.BaseTile = class extends Hp.BaseStyled {
    constructor(name, rect) {
        super();
        this.name = name;
        this.rect = rect;
    }

    draw(deltaSec, pixRect) {}
};

Hp.BoxTile = class extends Hp.BaseTile {
    constructor(name, rect, style) {
        super(name, rect);

        this.loadStyleProperty("lineColor", style, "#000");
        this.loadStyleProperty("fillColor", style, "#fff");
        this.loadStyleProperty("lineWidth", style, 1.0);
    }

    draw(deltaSec, pixRect) {
        super.draw(deltaSec, pixRect);
        Hp._drawBox(pixRect, this.style.fillColor, this.style.lineColor, this.style.lineWidth);
    }
};

Hp.MarqueeTile = class extends Hp.BaseTile {
    constructor(name, rect, image, style) {
        super(name, rect);

        this.img = image;

        this.loadStyleProperty("alpha", style, 1.0);
        this.loadStyleProperty("offset", style, 0);
        this.loadStyleProperty("speed", style, 60.0);

        this._nowOffset = this.style.offset;
    }

    draw(deltaSec, pixRect) {
        super.draw(deltaSec, pixRect);

        // Updating the marquee offset based on the elapsed time:
        this._nowOffset += this.style.speed * deltaSec;

        const imgW = this.img.naturalWidth;
        const imgH = this.img.naturalHeight;

        if (imgW !== 0 && imgH !== 0) {
            // Scaling the img so it forms a 'pixRect.h'-height ream:
            const scaleFactor = pixRect.h / imgH;
            const outW = imgW * scaleFactor;
            const outH = imgH * scaleFactor;

            // TODO: Clean this up so the first and last replica don't render outside 'pixRect'
            let replicaOffset = this._nowOffset;
            while (replicaOffset > 0) {
                replicaOffset -= imgW;
            }
            for (; replicaOffset < pixRect.x + pixRect.w; replicaOffset += outW) {
                const replicaPixRect = {x: pixRect.x + replicaOffset, y: pixRect.y, w: outW, h: outH};
                Hp._drawImg(replicaPixRect, this.img, this.style.alpha);
            }
        }
    }
};

Hp._drawBox = function (pixRect, fillColor, lineColor, lineWidth) {
    const c2d = Hp._context;

    // Fill
    c2d.globalAlpha = 1;
    c2d.fillStyle = fillColor;
    c2d.fillRect(pixRect.x, pixRect.y, pixRect.w, pixRect.h);

    // Outline
    c2d.globalAlpha = 1;
    c2d.strokeStyle = lineColor;
    c2d.lineWidth = lineWidth;
    c2d.strokeRect(pixRect.x, pixRect.y, pixRect.w, pixRect.h);
};

Hp._drawImg = function (pixRect, image, alpha) {
    const c2d = Hp._context;

    c2d.globalAlpha = alpha;
    c2d.drawImage(image, pixRect.x, pixRect.y, pixRect.w, pixRect.h);
};

Hp._canvasSize = function () {
    const boundingRect = Hp._canvas.getBoundingClientRect();
    return {x: boundingRect.width, y: boundingRect.height};
};

//
// Server communication:
//

Hp._assetCache = {};

Hp.sendMessage = function (event, optData, optCallback) {
    const eventName = Hp.gameId + "." + event;
    const xhr = new XMLHttpRequest();
    const message = {
        event: eventName,
        client_mono_time_sec: window.performance.now() / 1000.0,
        room_id: Hp.roomId,
        player_id: Hp.playerId
    };
    if (typeof optData !== "undefined" && Object.keys(optData).length > 0) {
        message.data = optData;
    }
    const dataStr = JSON.stringify(message);

    xhr.open("POST", Hp._serverUrl, true);    // Async!
    xhr.send(dataStr);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                optCallback(response.ok, response.data);
            } else {
                optCallback(false, {"reason": "Connection failed."});
                console.log(xhr.status);
            }
        }
    }
};

Hp.loadImg = function (imageName) {
    const dpi = (window.devicePixelRatio || 1) * 96;

    let sizeHint = "x3";
    if (dpi <= 96) {
        sizeHint = "x1";
    } else if (dpi <= 96*2) {
        sizeHint = "x2";
    }

    const imageKey = "img/" + sizeHint + "/" + imageName;
    if (Hp._assetCache.hasOwnProperty(imageKey)) {
        return Hp._assetCache[imageKey];
    } else {
        const image = Hp._assetCache[imageKey] = new Image();
        image.src = imageKey;
        console.log(image.src);
        return image;
    }
};
