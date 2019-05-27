const Hp = {};

//
// Debug and error handling:
//

Hp._dbg = false;
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

    // Initializing events:
    $(window).resize(Hp.updateSize);
    $(canvas).mousemove(Hp._mousemoveDelegate);
    $(canvas).click(Hp._clickDelegate);
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

                if (Hp._dbg) {
                    const ctx = Hp._context;
                    const canvasSize = Hp._canvasSize();
                    const tileSize = Hp.page.tileSizeInPix;

                    // Grid
                    ctx.globalAlpha = 0.2;
                    ctx.strokeStyle = Hp._dbgGridColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (let ix = 0; ix < Hp.page.gridSize.x; ix++) {
                        ctx.moveTo(ix * tileSize.x, 0);
                        ctx.lineTo(ix * tileSize.x, canvasSize.y);
                    }
                    for (let iy = 0; iy < Hp.page.gridSize.y; iy++) {
                        ctx.moveTo(0, iy * tileSize.y);
                        ctx.lineTo(canvasSize.x, iy * tileSize.y);
                    }
                    ctx.stroke();

                    // Tiles:
                    let boxColorArray = [
                        "#858",
                        "#800",
                        "#060",
                        "#008",
                        "#068",
                        "#A80"
                    ];

                    for (let iTile = 0; iTile < Hp.page.tiles.length; iTile++) {
                        let tile = Hp.page.tiles[iTile];
                        tile.drawDbgOverlay(tile, tileSize, boxColorArray[iTile % boxColorArray.length]);
                    }
                }
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
    constructor(name, optStyle, gridSize) {
        super();
        this.name = name;
        this.tiles = [];
        this.gridSize = gridSize;

        if (typeof optStyle === "undefined")
            optStyle = {};

        this.loadStyleProperty("bgColor", optStyle, "#fff");
    }

    get tileSizeInPix() {
        const canvasSize = Hp._canvasSize();
        return {x: canvasSize.x / this.gridSize.x, y: canvasSize.y / this.gridSize.y}
    }

    tileRectToPixRect(tileRect) {
        const tileSize = this.tileSizeInPix;
        return {
            x: tileRect.x * tileSize.x,
            y: tileRect.y * tileSize.y,
            w: tileRect.w * tileSize.x,
            h: tileRect.h * tileSize.y
        };
    };

    pushTile(tile) {
        this.tiles.push(tile);
        tile.page = this;
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
        for (let iTile = 0; iTile < this.tiles.length; iTile++) {
            const tile = this.tiles[iTile];
            tile.draw(deltaSec);
        }
    }

    //
    // API shorthands:
    //

    _addTile(tile) {
        this.tiles.push(tile);
        return this.tiles[this.tiles.length - 1];
    }

    addBoxTile(name, rect, optStyle) {
        return this._addTile(new Hp._BoxTile(this, name, rect, optStyle));
    }

    addFrameTile(name, rect, img, optStyle) {
        return this._addTile(new Hp._FrameTile(this, name, rect, img, optStyle));
    }

    addTxtTile(name, rect, text, optStyle) {
        return this._addTile(new Hp._TextTile(this, name, rect, text, optStyle));
    }

    addMarqueeTile(name, rect, img, optStyle) {
        return this._addTile(new Hp._MarqueeTile(this, name, rect, img, optStyle));
    }

    addBobTile(name, rect, img, optStyle) {
        return this._addTile(new Hp._BobTile(this, name, rect, img, optStyle));
    }

    addBtnTile(name, rect, optStyle) {
        return this._addTile(new Hp._BtnTile(this, name, rect, optStyle));
    }

    addMaskTile(name, rect, optStyle) {
        return this._addTile(new Hp._MaskTile(this, name, rect, optStyle));
    }
};

Hp._BaseTile = class extends Hp.BaseStyled {
    constructor(page, name, rect) {
        super();
        this.page = page;
        this.name = name;
        this.tileRect = rect;
        this._onDrawCbList = [];
    }

    draw(deltaSec) {
        for (let i = 0; i < this._onDrawCbList.length; i++) {
            const drawCb = this._onDrawCbList[i];
            drawCb(this, deltaSec);
        }
    }

    drawDbgOverlay(color) {
        const ctx = Hp._context;
        const pixRect = this.page.tileRectToPixRect(this.tileRect);

        // Drawing a boundary:
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(pixRect.x, pixRect.y, pixRect.w, pixRect.h);

        // Drawing a label:
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = color;
        ctx.font = "1em monospace";
        ctx.fillText(this.name, pixRect.x + 6 + ctx.measureText(this.name).width / 2, pixRect.y + 16);
    }

    addDrawCb(drawCb) {
        this._onDrawCbList.push(drawCb);
        return drawCb;
    }

    remDrawCb(drawCb) {
        for (let i = 0; i < this._onDrawCbList.length; i++) {
            const checkDrawCb = this._onDrawCbList[i];
            if (checkDrawCb === drawCb) {
                this._onDrawCbList.splice(i, 1);
                break;
            }
        }
    }
};

Hp._BoxTile = class extends Hp._BaseTile {
    constructor(page, name, rect, optStyle) {
        super(page, name, rect);

        if (typeof optStyle === "undefined")
            optStyle = {};

        this.loadStyleProperty("alpha", optStyle, 1.0);
        this.loadStyleProperty("lineColor", optStyle, "#000");
        this.loadStyleProperty("fillColor", optStyle, "#fff");
        this.loadStyleProperty("lineWidth", optStyle, 1.0);
    }

    draw(deltaSec) {
        super.draw(deltaSec);
        const pixRect = this.page.tileRectToPixRect(this.tileRect);
        Hp._drawBox(pixRect, this.style.fillColor, this.style.lineColor, this.style.lineWidth, this.style.alpha);
    }
};

Hp._FrameTile = class extends Hp._BaseTile {
    constructor(page, name, rect, img, optStyle) {
        super(page, name, rect);

        this.img = img;

        if (typeof optStyle === "undefined")
            optStyle = {};

        this.loadStyleProperty("alpha", optStyle, 1.0);
    }

    draw(deltaSec) {
        super.draw(deltaSec);

        const drawRect = Hp._scaleRectToFitRect(
            {x: 0, y: 0, w: this.img.naturalWidth, h: this.img.naturalHeight},
            this.page.tileRectToPixRect(this.tileRect)
        );
        Hp._drawImg(drawRect, this.img, this.style.alpha);
    }
};

Hp._TextTile = class extends Hp._BaseTile {
    constructor(page, name, rect, text, optStyle) {
        super(page, name, rect);

        this.text = text;

        if (typeof optStyle === "undefined")
            optStyle = {};

        this.loadStyleProperty("alpha", optStyle, 1.0);
        this.loadStyleProperty("color", optStyle, "#000");
        this.loadStyleProperty("fontName", optStyle, "ObjectSans-Regular");
        this.loadStyleProperty("fontSize", optStyle, 1.0);
    }

    draw(deltaSec) {
        super.draw(deltaSec);
        const ctx = Hp._context;
        const pixRect = this.page.tileRectToPixRect(this.tileRect);

        ctx.globalAlpha = this.style.alpha;
        ctx.fillStyle = this.style.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = this.style.fontSize.toString() + "em " + this.style.fontName;
        ctx.fillText(this.text, pixRect.x + (pixRect.w / 2), pixRect.y + (pixRect.h / 2));
    }
};

Hp._MarqueeTile = class extends Hp._BaseTile {
    constructor(page, name, rect, img, optStyle) {
        super(page, name, rect);

        this.img = img;

        if (typeof optStyle === "undefined")
            optStyle = {};

        this.loadStyleProperty("alpha", optStyle, 1.0);
        this.loadStyleProperty("offset", optStyle, 0);
        this.loadStyleProperty("speed", optStyle, 60.0);

        this._nowOffset = this.style.offset;
    }

    draw(deltaSec) {
        super.draw(deltaSec);

        const pixRect = this.page.tileRectToPixRect(this.tileRect);

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

Hp._BobTile = class extends Hp._BaseTile {
    constructor(page, name, rect, img, optStyle) {
        super(page, name, rect);
        this.img = img;

        if (typeof optStyle === "undefined") {
            optStyle = {};
        }

        this.loadStyleProperty("alpha", optStyle, 1.0);
        this.loadStyleProperty("amplitude", optStyle, 20);
        this.loadStyleProperty("speed", optStyle, Math.PI / 2.0);

        this._elapsedTime = 0.0;
    }

    draw(deltaSec) {
        super.draw(deltaSec);

        const drawRect = Hp._scaleRectToFitRect(
            {x: 0, y: 0, w: this.img.naturalWidth, h: this.img.naturalHeight},
            this.page.tileRectToPixRect(this.tileRect)
        );

        this._elapsedTime += deltaSec;
        const offset = Math.sin(this._elapsedTime * this.style.speed) * this.style.amplitude;
        Hp._drawImg({x: drawRect.x, y: offset + drawRect.y, w: drawRect.w, h: drawRect.h},
                    this.img, this.style.alpha);
    }
};

Hp._BtnTile = class extends Hp._BaseTile {

    // valid shapes: ["hidden-box", "box", "orb", "pill"]
    constructor(page, name, rect, optStyle) {
        super(page, name, rect);

        // These are get/set properties meant to be mutated, much like the 'style' properties:
        this.clickCb = null;
        this.disabled = false;

        // Setting up style properties:
        if (typeof optStyle === "undefined")
            optStyle = {};

        this.loadStyleProperty("alpha", optStyle, 1.0);
        this.loadStyleProperty("shape", optStyle, "hidden-box");
        this.loadStyleProperty("fillColor", optStyle, "#fff");
        this.loadStyleProperty("lineColor", optStyle, "#000");
        this.loadStyleProperty("lineWidth", optStyle, 1.0);

        this.loadStyleProperty("hover_fillColor", optStyle, "#000");
        this.loadStyleProperty("hover_lineColor", optStyle, "#fff");
        this.loadStyleProperty("hover_fadeInDurationSec", optStyle, 0.096);
        this.loadStyleProperty("hover_fadeOutDurationSec", optStyle, 0.096);

        this.loadStyleProperty("click_fillColor", optStyle, "#0f0");
        this.loadStyleProperty("click_lineColor", optStyle, "#000");
        this.loadStyleProperty("click_fadeInDurationSec", optStyle, 0.032);
        this.loadStyleProperty("click_holdColorDurationSec", optStyle, 0.064);
        this.loadStyleProperty("click_fadeOutDurationSec", optStyle, 0.032);

        // Subscribing to mousemove and click events:
        const self = this;
        Hp._subscribeEvent("mousemove", function (pos) { Hp._BtnTile._onMouseMove(self, pos); });
        Hp._subscribeEvent("click", function (pos) { Hp._BtnTile._onClick(self, pos); });

        // Animation stuff:
        this._hoverState = false;

        this._currentAnim = "none";
        this._animElapsedSec = 0;

        this._active_fillColor = this.style.fillColor;
        this._active_lineColor = this.style.lineColor;
    }

    get hoverState() {
        return this._hoverState;
    }

    draw(deltaSec) {
        super.draw(deltaSec);
        const pixRect = this.page.tileRectToPixRect(this.tileRect);

        // Updating the animation:
        this._animElapsedSec += deltaSec;

        if (this._currentAnim === "hover.fade-in") {
            const animProgressCoefficient = this._animElapsedSec / this.style.hover_fadeInDurationSec;
            if (animProgressCoefficient < 1) {
                this._active_fillColor = Hp.blendColor2(this.style.hover_fillColor, this.style.fillColor,
                                                         animProgressCoefficient);
                this._active_lineColor = Hp.blendColor2(this.style.hover_lineColor, this.style.lineColor,
                                                         animProgressCoefficient);
            } else {
                this._active_fillColor = this.style.hover_fillColor;
                this._active_lineColor = this.style.hover_lineColor;
                this._currentAnim = "none";
                this._animElapsedSec = 0;
            }
        }
        if (this._currentAnim === "hover.fade-out") {
            const animProgressCoefficient = this._animElapsedSec / this.style.hover_fadeOutDurationSec;
            if (animProgressCoefficient < 1) {
                this._active_fillColor = Hp.blendColor2(this.style.fillColor, this.style.hover_fillColor,
                                                         animProgressCoefficient);
                this._active_lineColor = Hp.blendColor2(this.style.lineColor, this.style.hover_lineColor,
                                                         animProgressCoefficient);
            } else {
                this._active_fillColor = this.style.fillColor;
                this._active_lineColor = this.style.lineColor;
                this._currentAnim = "none";
                this._animElapsedSec = 0;
            }
        }

        if (this._currentAnim === "click.fade-in") {
            let preClickFillColor = null;
            let preClickLineColor = null;
            if (this._hoverState) {
                preClickFillColor = this.style.hover_fillColor;
                preClickLineColor = this.style.hover_lineColor;
            } else {
                preClickFillColor = this.style.fillColor;
                preClickLineColor = this.style.lineColor;
            }

            const animProgressCoefficient = this._animElapsedSec / this.style.click_fadeInDurationSec;
            if (animProgressCoefficient < 1) {
                this._active_fillColor = Hp.blendColor2(this.style.click_fillColor, preClickFillColor,
                                                         animProgressCoefficient);
                this._active_lineColor = Hp.blendColor2(this.style.click_lineColor, preClickLineColor,
                                                         animProgressCoefficient);
            } else {
                // Transitioning to the 'hold' state:
                this._currentAnim = "click.hold";
                this._animElapsedSec -= this.style.click_fadeInDurationSec;

                // This is against 'good coding practices', but the following is the drawing code for the 'hold'
                // animation. We only do it once at the state transition, as opposed to every frame:
                this._active_fillColor = this.style.click_fillColor;
                this._active_lineColor = this.style.click_lineColor;
            }
        }
        if (this._currentAnim === "click.hold") {
            const animProgressCoefficient = this._animElapsedSec / this.style.click_holdColorDurationSec;
            if (animProgressCoefficient >= 1) {
                // Transitioning to the 'fade-out' state:
                this._currentAnim = "click.fade-out";
                this._animElapsedSec -= this.style.click_holdColorDurationSec;
            }
        }
        if (this._currentAnim === "click.fade-out") {
            let preClickFillColor = null;
            let preClickLineColor = null;
            if (this._hoverState) {
                preClickFillColor = this.style.hover_fillColor;
                preClickLineColor = this.style.hover_lineColor;
            } else {
                preClickFillColor = this.style.fillColor;
                preClickLineColor = this.style.lineColor;
            }

            const animProgressCoefficient = this._animElapsedSec / this.style.click_fadeOutDurationSec;
            if (animProgressCoefficient < 1) {
                this._active_fillColor = Hp.blendColor2(preClickFillColor, this.style.click_fillColor,
                                                         animProgressCoefficient);
                this._active_lineColor = Hp.blendColor2(preClickLineColor, this.style.click_lineColor,
                                                         animProgressCoefficient);
            } else {
                // Transitioning to the 'none' state:
                this._currentAnim = "none";
                this._animElapsedSec = 0;
                this._active_fillColor = preClickFillColor;
                this._active_lineColor = preClickLineColor;
            }
        }

        // Drawing the appropriate shapes given the computed colors:
        if (this.style.shape === "hidden-box") {
            // Do nothing, but compute click as within the box.
        } else if (this.style.shape === "box") {
            Hp._drawBox(pixRect, this._active_fillColor, this._active_lineColor, this.style.lineWidth);
        } else if (this.style.shape === "orb") {
            const orb = Hp._scaleOrbToFitRect(pixRect);
            Hp._drawOrb(orb, this._active_fillColor, this._active_lineColor, this.style.lineWidth);
        } else if (this.style.shape === "pill") {
            // TODO: Implement 'pill' shapes.
        } else {
            throw new Hp.Error("[Hp] Invalid button shape selected: '" + this.style.shape + "'.");
        }
    }

    _collidePtInBtn(pt) {
        const pixRect = this.page.tileRectToPixRect(this.tileRect);
        if (this.style.shape === "hidden-box" || this.style.shape === "box") {
            return Hp._collidePtInBox(pixRect, pt);
        } else if (this.style.shape === "orb") {
            const orb = Hp._scaleOrbToFitRect(pixRect);
            return Hp._collidePtInOrb(orb, pt);
        } else {
            // TODO: Implement 'pill'
            throw new Hp.Error("[Hp] Not implemented: '_BtnTile._collidePtInBtn' for shape '" + this.style.shape + "'.");
        }
    }
};

Hp._BtnTile._onMouseMove = function (self, mousePos) {
    if (self.disabled) {
        self._hoverState = false;
        return;
    }

    const hoverState = self._collidePtInBtn(mousePos);

    // If the new hover state differs from the old hover state, we want to play a smooth animation to transition
    // between the two states. We achieve this by resetting the animation timer every time a state change is made.
    // The 'draw' method then performs any blending based on the time elapsed since the animation timer was reset.
    if (self._hoverState !== hoverState) {
        self._hoverState = hoverState;

        // The hover animation cannot interrupt ongoing click animations:
        if (!self._currentAnim.startsWith("click")) {
            self._currentAnim = hoverState ? "hover.fade-in" : "hover.fade-out";
            self._animElapsedSec = 0;
        }
    }
};

Hp._BtnTile._onClick = function (self, mousePos) {
    if (self.disabled) {
        return;
    }

    // When this button is clicked on, we want to restart the 'glowing' animation so we can smoothly transition back
    // to whatever colors (hovered or not) desired.
    self._clickState = self._collidePtInBtn(mousePos);
    if (self._clickState) {
        // The click animation interrupts all other animations.
        self._currentAnim = "click.fade-in";
        self._animElapsedSec = 0;

        // Calling the user 'clickCb' handle if supplied:
        if (self.clickCb !== null) {
            self.clickCb(self, mousePos);
        }
    }
};

Hp._MaskTile = class extends Hp._BaseTile {
    constructor(page, name, rect, optStyle) {
        super(page, name, rect);

        this.onFadeInCompleteCb = null;
        this.onFadeOutCompleteCb = null;

        if (typeof optStyle === "undefined") {
            optStyle = {};
        }

        this.loadStyleProperty("color", optStyle, "#fff");
        this.loadStyleProperty("fadeInDurationSec", optStyle, 1.0);
        this.loadStyleProperty("fadeOutDurationSec", optStyle, 1.0);

        this._animState = "none";
        this._animElapsedSec = 0;
        this._maskAlpha = 0;
    }

    fadeIn() {
        this._animState = "fade-in";
        this._animElapsedSec = 0;
    }

    fadeOut() {
        this._animState = "fade-out";
        this._animElapsedSec = 0;
    }

    draw(deltaSec) {
        super.draw(deltaSec);

        this._animElapsedSec += deltaSec;
        if (this._animState === "fade-in") {
            const animProgress = this._animElapsedSec / this.style.fadeInDurationSec;
            if (animProgress < 1) {
                this._maskAlpha = animProgress;
            } else {
                this._maskAlpha = 1;
                this._animState = "none";
                this._animElapsedSec = 0;

                if (this.onFadeInCompleteCb !== null) {
                    this.onFadeInCompleteCb();
                }
            }
        }
        else if (this._animState === "fade-out") {
            const animProgress = this._animElapsedSec / this.style.fadeOutDurationSec;
            if (animProgress < 1) {
                this._maskAlpha = 1 - animProgress;
            } else {
                this._maskAlpha = 0;
                this._animState = "none";
                this._animElapsedSec = 0;

                if (this.onFadeOutCompleteCb !== null) {
                    this.onFadeOutCompleteCb();
                }
            }
        }

        const pixRect = this.page.tileRectToPixRect(this.tileRect);
        Hp._drawBox(pixRect, this.style.color, this.style.color, 0, this._maskAlpha);
    }
};

// Drawing helpers:

Hp._drawBox = function (pixRect, fillColor, lineColor, lineWidth, alpha) {
    const ctx = Hp._context;

    // Fill
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fillColor;
    ctx.fillRect(pixRect.x, pixRect.y, pixRect.w, pixRect.h);

    // Outline
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(pixRect.x, pixRect.y, pixRect.w, pixRect.h);
};

Hp._drawOrb = function (orb, fillColor, lineColor, lineWidth) {
    const ctx = Hp._context;

    // Fill
    ctx.globalAlpha = 1;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(orb.c.x, orb.c.y, orb.r, 0, 2*Math.PI);
    ctx.fill();

    // Outline
    ctx.globalAlpha = 1;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(orb.c.x, orb.c.y, orb.r, 0, 2*Math.PI);
    ctx.stroke();
};

Hp._drawImg = function (rect, image, alpha) {
    const ctx = Hp._context;

    ctx.globalAlpha = alpha;
    ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
};

Hp._canvasPageXY = function () {
    const boundingRect = Hp._canvas.getBoundingClientRect();
    return {x: boundingRect.x, y: boundingRect.y};
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

    if (typeof optCallback === "undefined") {
        optCallback = function (ok, data) {};
    }

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

Hp.loadAudio = function (assetName) {
    const audioKey = "/audio/" + assetName;
    if (Hp._assetCache.hasOwnProperty(audioKey)) {
        return Hp._assetCache[audioKey];
    } else {
        return Hp._assetCache[audioKey] = new Audio(audioKey);
    }
};

//
// Math
//

Hp._scaleOrbToFitRect = function (rect) {
    return {
        r: Math.min(rect.w, rect.h) / 2,
        c: {
            x: rect.x + rect.w / 2,
            y: rect.y + rect.h / 2
        }
    };
};

Hp._scaleRectToFitRect = function (innerRect, outerRect) {
    const innerRectAr = innerRect.w / innerRect.h;
    const outerRectAr = outerRect.w / outerRect.h;

    let outRect = {
        x: outerRect.x, y: outerRect.y,
        w: outerRect.w, h: outerRect.h
    };
    if (innerRectAr > outerRectAr) {
        // Pad vertically, fit horizontally
        outRect.h = innerRect.h * (outerRect.w / innerRect.w);
        outRect.y += (outerRect.h - outRect.h) / 2;
    } else if (outerRect < innerRect) {
        // Pad horizontally, fit vertically
        outRect.w = innerRect.w * (outerRect.h / innerRect.h);
        outRect.x += (outerRect.w - outRect.w) / 2;
    }
    return outRect;
};

Hp._collidePtInBox = function (rect, pt) {
    return (pt.x >= rect.x) && (pt.y >= rect.y) &&
           (pt.x - rect.x < rect.w) && (pt.y - rect.y < rect.h);
};

Hp._collidePtInOrb = function (orb, pt) {
    const deltaX = pt.x - orb.c.x;
    const deltaY = pt.y - orb.c.y;
    return deltaX*deltaX + deltaY*deltaY <= orb.r*orb.r;
};

Hp._collideBoxInBox = function (a, b) {
    return (
        Hp.math.collidePointInRect(a, {x: b.x + b.w, y: b.y + b.h}) ||
        Hp.math.collidePointInRect(b, {x: a.x + a.w, y: a.y + a.h})
    );
};

Hp._hexToRgbaColor = function (hexColor) {
    let hexRe = null;
    let alphaProvided = false;
    if (hexColor.length - 1 === 6) {
        // #rrggbb
        hexRe = /#([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})/;
        alphaProvided = false;
    } else if (hexColor.length - 1 === 8) {
        // #rrggbbaa
        hexRe = /#([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})([a-fA-F\d]{2})/;
        alphaProvided = true;
    } else if (hexColor.length - 1 === 3) {
        // #rgb
        hexRe = /#([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])/;
        alphaProvided = false;
    } else if (hexColor.length - 1 === 4) {
        // #rgba
        hexRe = /#([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])/;
        alphaProvided = true;
    } else {
        return null;    // Mis-formatted string!
    }

    const result = hexRe.exec(hexColor);
    if (result[0] !== hexColor) {
        return null;    // Mis-formatted string!
    }

    const rStr = (result[1].length === 1) ? (result[1] + result[1]) : result[1];
    const gStr = (result[2].length === 1) ? (result[2] + result[2]) : result[2];
    const bStr = (result[3].length === 1) ? (result[3] + result[3]) : result[3];
    const aStr = alphaProvided ? ((result[4].length === 1) ? (result[4] + result[4]) : result[4]) : null;

    return {
        r: parseInt(rStr, 16) / 255.0,
        g: parseInt(gStr, 16) / 255.0,
        b: parseInt(bStr, 16) / 255.0,
        a: alphaProvided ? parseInt(aStr, 16) / 255.0 : 1.0
    };
};

Hp._rgbaToHexColor = function (rgbaColor) {
    function componentCh(component) {
        let componentString = Math.floor(255.0 * component).toString(16);
        while (componentString.length < 2) {
            componentString = "0" + componentString;
        }
        if (componentString.length > 2) {
            componentString = componentString.substring(componentString.length - 2);
        }
        return componentString;
    }
    const rCh = componentCh(rgbaColor.r);
    const gCh = componentCh(rgbaColor.g);
    const bCh = componentCh(rgbaColor.b);
    const aCh = componentCh(rgbaColor.a);
    return "#" + rCh + gCh + bCh + aCh;
};

// Blends col1 with col2 according to: (x * col1) + ([1 - x] * col2)
// x is a blend factor between 0 and 1.
Hp.blendColor2 = function (col1, col2, x) {
    const c1Rgba = Hp._hexToRgbaColor(col1);
    const c2Rgba = Hp._hexToRgbaColor(col2);
    const product = {
        r: (c1Rgba.r * x) + (c2Rgba.r * (1 - x)),
        g: (c1Rgba.g * x) + (c2Rgba.g * (1 - x)),
        b: (c1Rgba.b * x) + (c2Rgba.b * (1 - x)),
        a: (c1Rgba.a * x) + (c2Rgba.a * (1 - x)),
    };
    return Hp._rgbaToHexColor(product);
};
//
// UI delegates:
//

Hp._mousemoveSubscribers = [];
Hp._clickSubscribers = [];

Hp._mousemoveDelegate = function (event) {
    const canvasPageXY = Hp._canvasPageXY();
    for (let i = 0; i < Hp._mousemoveSubscribers.length; i++) {
        const handler = Hp._mousemoveSubscribers[i];
        handler({x: event.pageX - canvasPageXY.x, y: event.pageY - canvasPageXY.y});
    }
};

Hp._clickDelegate = function (event) {
    const canvasPageXY = Hp._canvasPageXY();
    for (let i = 0; i < Hp._clickSubscribers.length; i++) {
        const handler = Hp._clickSubscribers[i];
        handler({x: event.pageX - canvasPageXY.x, y: event.pageY - canvasPageXY.y});
    }
};

Hp._subscribeEvent = function (eventName, handler) {
    if (eventName === "mousemove") {
        Hp._mousemoveSubscribers.push(handler);
    } else if (eventName === "click") {
        Hp._clickSubscribers.push(handler);
    } else {
        throw new Hp.Error("HP error: invalid subscription to event named '" + eventName + "'.");
    }
};

//
// Audio:
//

Hp.playAudio = function (audioAsset) {
    Hp.stopAudio(audioAsset);
    audioAsset.currentTime = 0;
    audioAsset.play();
};

Hp.playAudioLoop = function (audioAsset) {
    Hp.playAudio(audioAsset);
    audioAsset.addEventListener('ended', function() {
        Hp.playAudio(audioAsset);
    }, false);
};

Hp.stopAudio = function (audioAsset) {
    audioAsset.pause();
    audioAsset.currentTime = 0;
};
