if (typeof Hp === "undefined") {
    Hp = {};
}

Hp.render = {
    _c2d: null,
    _dbgView: true,
    _dbgGridColor: "#555555",
    _animList: [],
};

Hp.render.resize = function () {
    const pixRatio = window.devicePixelRatio || 1;
    const rect = Hp._canvas.getBoundingClientRect();    // Getting size in CSS pixels
    Hp._canvas.width = rect.width * pixRatio;
    Hp._canvas.height = rect.height * pixRatio;

    Hp.render._c2d.scale(pixRatio, pixRatio);
    Hp.render._c2d.clearRect(0, 0, rect.width, rect.height);
};

Hp.render.BaseDrawing = class {
    constructor() {
        this.style = {};
    }

    _dbgDraw(tile, gridToPixScale, boxColor, lineWidth) {
        const c2d = Hp.render._c2d;
        const pixRect = {
            x: tile.rect.x * gridToPixScale.x,
            y: tile.rect.y * gridToPixScale.y,
            w: tile.rect.w * gridToPixScale.x,
            h: tile.rect.h * gridToPixScale.y
        };

        // Drawing the original img:
        this._draw(pixRect);

        c2d.globalAlpha = 1.0;

        // Drawing a boundary:
        c2d.strokeStyle = boxColor;
        c2d.lineWidth = lineWidth;
        c2d.strokeRect(pixRect.x, pixRect.y, pixRect.w, pixRect.h);

        // Drawing a label:
        c2d.fillStyle = boxColor;
        c2d.font = "1em monospace";
        c2d.fillText(tile.name, pixRect.x + 6 + c2d.measureText(tile.name).width / 2, pixRect.y + 16);
    }

    _getStyleProperty(propertyName, defaultValue) {
        const styleMap = this.style;
        if (styleMap.hasOwnProperty(propertyName)) {
            return styleMap[propertyName];
        } else {
            return styleMap[propertyName] = defaultValue;
        }
    }
    _draw(pixRect) {}

    _update(dtSec) {}
};

Hp.render.BoxDrawing = class extends Hp.render.BaseDrawing {
    constructor(optStyle) {
        super();
        if (typeof optStyle === "undefined")
            this.style = {};
        else
            this.style = optStyle;
    }

    get lineColor() { return this._getStyleProperty("lineColor", "#000"); }
    get fillColor() { return this._getStyleProperty("fillColor", "#fff"); }
    get lineWidth() { return this._getStyleProperty("lineWidth", 1); }     // In DiPx

    set lineColor(value) { return this.style.lineColor = value; }
    set fillColor(value) { return this.style.fillColor = value; }
    set lineWidth(value) { return this.style.lineWidth = value; }

    _draw(pixRect) {
        super._draw(pixRect);
        const c2d = Hp.render._c2d;

        // Fill
        c2d.globalAlpha = 1;
        c2d.fillStyle = this.fillColor;
        c2d.fillRect(pixRect.x, pixRect.y, pixRect.w, pixRect.h);

        // Line
        c2d.globalAlpha = 1;
        c2d.strokeStyle = this.lineColor;
        c2d.lineWidth = this.lineWidth;
        c2d.strokeRect(pixRect.x, pixRect.y, pixRect.w, pixRect.h);
    }
};

Hp.render.CircleDrawing = class extends Hp.render.BaseDrawing {
    constructor(optStyle) {
        super();
        if (typeof optStyle === "undefined")
            this.style = {};
        else
            this.style = optStyle;
    }

    get lineColor() { return this._getStyleProperty("lineColor", "#000"); }
    get fillColor() { return this._getStyleProperty("fillColor", "#fff"); }
    set lineColor(value) { return this.style.lineColor = value; }
    set fillColor(value) { return this.style.fillColor = value; }

    _draw(pixRect) {
        super._draw(pixRect);
        const c2d = Hp.render._c2d;

        const r = Math.min(pixRect.w, pixRect.h) / 2;
        const c = {
            x: pixRect.x + pixRect.w / 2,
            y: pixRect.y + pixRect.h / 2
        };

        // Fill
        c2d.globalAlpha = 1;
        c2d.fillStyle = this.fillColor;
        c2d.beginPath();
        c2d.arc(c.x, c.y, r, 0, 2*Math.PI);
        c2d.fill();

        // Line
        c2d.globalAlpha = 1;
        c2d.strokeStyle = this.lineColor;
        c2d.beginPath();
        c2d.arc(c.x, c.y, r, 0, 2*Math.PI);
        c2d.stroke();
    }
};

Hp.render.FrameDrawing = class extends Hp.render.BaseDrawing {
    constructor(imageAsset, optStyle) {
        super();
        this.image = imageAsset;
        if (typeof optStyle === "undefined")
            this.style = {};
        else
            this.style = optStyle;
    }

    get alpha()      { return this._getStyleProperty("alpha", 1.0); }
    set alpha(value) { return this.style.alpha = (value < 0 ? 0 : (value > 1 ? 1 : value)); }

    _draw(pixRect) {
        super._draw(pixRect);
        const c2d = Hp.render._c2d;

        const drawRect = Hp.math.scaleRectToFitRect(
            {x: 0, y: 0, w: this.image.naturalWidth, h: this.image.naturalHeight},
            pixRect
        );
        c2d.globalAlpha = this.alpha;
        c2d.drawImage(this.image, drawRect.x, drawRect.y, drawRect.w, drawRect.h);
    }
};

Hp.render.MarqueeDrawing = class extends Hp.render.BaseDrawing {
    constructor(image, optStyle) {
        super();
        this.image = image;
        if (typeof optStyle === "undefined")
            this.style = {};
        else
            this.style = optStyle;
    }

    get alpha()  { return this._getStyleProperty("alpha", 1.0); }
    get offset() { return this._getStyleProperty("offset", 0.0); }
    get speed()  { return this._getStyleProperty("speed", 60); }   // In DiPx per second

    set alpha(value)  { return this.style.alpha  = (value < 0 ? 0 : (value > 1 ? 1 : value)); }
    set offset(value) { return this.style.offset = value; }
    set speed(value)  { return this.style.speed  = value; }

    _update(dtSec) {
        super._update(dtSec);
        const dOffsetDiPxPerSec = this.speed;
        this.offset += dOffsetDiPxPerSec * dtSec;
    }

    _draw(pixRect) {
        super._draw(pixRect);
        const c2d = Hp.render._c2d;

        const imgW = this.image.naturalWidth;
        const imgH = this.image.naturalHeight;

        if (imgW !== 0 && imgH !== 0) {
            // Scaling the img so it forms a 'pixRect.h'-height ream:
            const scaleFactor = pixRect.h / imgH;
            const outW = imgW * scaleFactor;
            const outH = imgH * scaleFactor;

            c2d.globalAlpha = this.alpha;

            let replicaOffset = this.offset;
            while (replicaOffset > 0) {
                replicaOffset -= imgW;
            }
            for (; replicaOffset < pixRect.x + pixRect.w; replicaOffset += outW) {
                c2d.drawImage(this.image, pixRect.x + replicaOffset, pixRect.y, outW, outH);
            }
        }
    }
};

Hp.render.TextDrawing = class extends Hp.render.BaseDrawing {
    constructor(text, optStyle) {
        super();
        this.text = text;
        if (typeof optStyle === "undefined")
            this.style = {};
        else
            this.style = optStyle;
    }

    get alpha()    { return this._getStyleProperty("alpha", 1.0); }
    get color()    { return this._getStyleProperty("color", "#fff"); }
    get fontName() { return this._getStyleProperty("fontName", "ObjectSans-Regular"); }
    get fontSize() { return this._getStyleProperty("fontSize", 1); }   // In em

    set alpha(value)    { return this.style.alpha    = (value < 0 ? 0 : (value > 1 ? 1 : value)); }
    set color(value)    { return this.style.color    = value; }
    set fontName(value) { return this.style.fontName = value; }
    set fontSize(value) { return this.style.fontSize = value; }

    _draw(pixRect) {
        super._draw(pixRect);
        const c2d = Hp.render._c2d;

        c2d.globalAlpha = this.alpha;
        c2d.fillStyle = this.color;
        c2d.textAlign = "center";
        c2d.textBaseline = "middle";
        c2d.font = this.fontSize.toString() + "em " + this.fontName;
        c2d.fillText(this.text, pixRect.x + (pixRect.w / 2), pixRect.y + (pixRect.h / 2));
    }
};

Hp.render.TextBlockDrawing = class extends Hp.render.BaseDrawing {
    constructor(text, optStyle) {
        super();
        this.text = text;
        if (typeof optStyle === "undefined") {
            this.style = {};
        } else {
            this.style = optStyle;
        }
    }

    get color()        { return this._getStyleProperty("color", "#000"); }
    get alpha()        { return this._getStyleProperty("alpha", 1.0); }
    get fontName()     { return this._getStyleProperty("fontName", "ObjectSans-Regular"); }
    get fontSize()     { return this._getStyleProperty("fontSize", 1.0); }
    get lineHeight()   { return this._getStyleProperty("lineHeight", 15.36); }  // DiPx value for 1em
    get hPadding()     { return this._getStyleProperty("hPadding", 5.0); }      // DiPx
    get vPadding()     { return this._getStyleProperty("vPadding", 5.0); }      // DiPx

    set alpha(value)      { return this.style.alpha      = (value < 0 ? 0 : (value > 1 ? 1 : value)); }
    set color(value)      { return this.style.color      = value; }
    set fontName(value)   { return this.style.fontName   = value; }
    set fontSize(value)   { return this.style.fontSize   = value; }
    set lineHeight(value) { return this.style.lineHeight = value; }  // DiPx value for 1em
    set hPadding(value)   { return this.style.hPadding   = value; }      // DiPx
    set vPadding(value)   { return this.style.vPadding   = value; }      // DiPx

    _draw(pixRect) {
        super._draw(pixRect);

        const c2d = Hp.render._c2d;

        // Setting up the draw properties:
        c2d.globalAlpha = this.alpha;
        c2d.fillStyle = this.color;
        c2d.textAlign = "left";
        c2d.textBaseline = "top";
        c2d.font = this.fontSize.toString() + "em " + this.fontName;

        let lines = this.text.split("\n");
        let drawY = this.vPadding;
        let drawLineMaxW = pixRect.w - 2*this.hPadding;

        for (let iLine = 0; iLine < lines.length; iLine++) {
            const line = lines[iLine];
            const words = line.split(" ");

            let drawLine = words[0];
            for (let iWord = 1; iWord < words.length;) {
                if (drawY > drawLineMaxW) {
                    break;
                }
                const word = words[iWord];
                const testDrawLine = drawLine + " " + word;
                const testDrawLineWidth = c2d.measureText(testDrawLine).width;
                if (testDrawLineWidth > drawLineMaxW) {
                    // Draw 'drawLine' without 'word':
                    c2d.fillText(drawLine, pixRect.x + this.hPadding, pixRect.y + drawY);
                    drawY += this.lineHeight;
                    drawLine = "";
                } else {
                    drawLine = testDrawLine;
                    iWord++;
                }
            }
            if (drawLine !== "") {
                c2d.fillText(drawLine, pixRect.x + this.hPadding, pixRect.y + drawY);
                drawY += this.lineHeight;
                drawLine = "";
            }
            drawY += this.lineHeight;
        }
    }
};

Hp.render._init = function (canvas) {
    Hp.render._c2d = canvas.getContext("2d");
    if (Hp.render._c2d === null) {
        throw new Hp.Error("Failed to acquire a valid _canvas context!");
    }
    Hp.render.resize();
};

Hp.render._draw = function (page, dtSec) {
    if (page === null) {
        return;
    }

    // Updating:
    for (let iTile = 0; iTile < page.orderedTileList.length; iTile++) {
        const tile = page.orderedTileList[iTile];
        tile.drawing._update(dtSec);
    }
    for (let iAnim = 0; iAnim < Hp.render._animList.length;) {
        const anim = Hp.render._animList[iAnim];
        const done = anim.update(dtSec);
        if (done) {
            Hp.render._animList = Hp.render._animList.splice(iAnim, 1);
        } else {
            iAnim++;
        }
    }

    // Drawing:
    const canvasSize = Hp.render._canvasSizeDiPx();

    Hp.render._c2d.clearRect(0, 0, canvasSize.x, canvasSize.y);
    Hp.render._c2d.beginPath();

    Hp.render._c2d.fillStyle = page.bgColor;
    Hp.render._c2d.fillRect(0, 0, canvasSize.x, canvasSize.y);

    if (Hp.render._dbgView) {
        Hp.render._drawDbgImp(page);
    } else {
        Hp.render._drawImp(page);
    }
};

Hp.render._drawDbgImp = function (page) {
    const canvasSize = Hp.render._canvasSizeDiPx();
    const tileSize = Hp._currentPageTileSizeDiPx(page);

    // Grid
    this._c2d.strokeStyle = Hp.render._dbgGridColor;
    this._c2d.beginPath();
    for (let ix = 0; ix < page.gridSize.x; ix++) {
        this._c2d.moveTo(ix * tileSize.x, 0);
        this._c2d.lineTo(ix * tileSize.x, canvasSize.y);
    }
    for (let iy = 0; iy < page.gridSize.y; iy++) {
        this._c2d.moveTo(0, iy * tileSize.y);
        this._c2d.lineTo(canvasSize.x, iy * tileSize.y);
    }
    this._c2d.stroke();

    // Tiles:
    let boxColorArray = [
        "#858",
        "#800",
        "#060",
        "#008",
        "#068",
        "#A80"
    ];

    for (let iTile = 0; iTile < page.orderedTileList.length; iTile++) {
        let tile = page.orderedTileList[iTile];
        let drawing = tile.drawing;
        drawing._dbgDraw(tile, tileSize, boxColorArray[iTile % boxColorArray.length], 2);
    }
};

Hp.render._drawImp = function (page) {
    const tileSize = Hp._currentPageTileSizeDiPx();

    for (let iTile = 0; iTile < page.orderedTileList.length; iTile++) {
        let tile = page.orderedTileList[iTile];
        let drawing = tile.drawing;

        let pixRect = {
            x: tile.rect.x * tileSize.x,
            y: tile.rect.y * tileSize.y,
            w: tile.rect.w * tileSize.x,
            h: tile.rect.h * tileSize.y
        };
        drawing._drawFrame(pixRect);
    }
};

Hp.render._canvasSizeDiPx = function () {
    const boundingClientRect = Hp._canvas.getBoundingClientRect();
    return {
        x: boundingClientRect.width,
        y: boundingClientRect.height
    };
};

Hp.render.animate = function (fn, durationSec) {
    Hp.render._animList.push(new Hp.render._Animation(fn, durationSec));
};

Hp.render._Animation = class {
    constructor(animFn, durationSec) {
        this.animFn = animFn;
        this.netDurationSec = durationSec;
        this.remDurationSec = durationSec;
    }

    // Updates the animation, and returns whether the animation is done after this update.
    update(dtSec) {
        let deltaSec = 0;
        let done     = false;

        if (dtSec < this.remDurationSec) {
            deltaSec = dtSec;
            done     = false;
        } else {
            deltaSec = this.remDurationSec;
            done     = true;
        }

        this.remDurationSec -= deltaSec;
        const completion = (this.netDurationSec - this.remDurationSec) / this.netDurationSec;
        this.animFn(deltaSec, completion);
        return done;
    }
};

Hp.render._hexToRgba = function (hexColor) {
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
    return {
        r: parseInt(result[1], 16) / 255.0,
        g: parseInt(result[2], 16) / 255.0,
        b: parseInt(result[3], 16) / 255.0,
        a: alphaProvided ? parseInt(result[4], 16) / 255.0 : 1.0
    };
};

Hp.render._rgbaToHex = function (rgbaColor) {
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
Hp.render.blend2 = function (col1, col2, x) {
    const c1Rgba = Hp.render._hexToRgba(col1);
    const c2Rgba = Hp.render._hexToRgba(col2);
    const product = {
        r: (c1Rgba.r * x) + (c2Rgba.r * (1 - x)),
        g: (c1Rgba.g * x) + (c2Rgba.g * (1 - x)),
        b: (c1Rgba.b * x) + (c2Rgba.b * (1 - x)),
        a: (c1Rgba.a * x) + (c2Rgba.a * (1 - x)),
    };
    return Hp.render._rgbaToHex(product);
};