if (typeof Hp === "undefined") {
    Hp = {};
}

Hp.render = {
    c2d: null,
    dbgView: false,
    dbgGridColor: "#555555"
};

Hp.render.resize = function () {
    const pixRatio = window.devicePixelRatio || 1;
    const rect = Hp.canvas.getBoundingClientRect();    // Getting size in CSS pixels
    Hp.canvas.width = rect.width * pixRatio;
    Hp.canvas.height = rect.height * pixRatio;

    Hp.render.c2d.scale(pixRatio, pixRatio);
    Hp.render.c2d.clearRect(0, 0, rect.width, rect.height);
};

Hp.render.BaseDrawing = class {
    _dbgDraw(tile, gridToPixScale, boxColor, lineWidth) {
        const c2d = Hp.render.c2d;
        const pixRect = {
            x: tile.rect.x * gridToPixScale.x,
            y: tile.rect.y * gridToPixScale.y,
            w: tile.rect.w * gridToPixScale.x,
            h: tile.rect.h * gridToPixScale.y
        };

        // Drawing the original image:
        this._draw(c2d, pixRect);

        c2d.globalAlpha = 1.0;

        // Drawing a boundary:
        c2d.strokeStyle = boxColor;
        c2d.lineWidth = lineWidth;
        c2d.strokeRect(pixRect.x, pixRect.y, pixRect.w, pixRect.h);

        // Drawing a label:
        c2d.fillStyle = boxColor;
        c2d.font = "1em Consolas";
        c2d.fillText(tile.name, pixRect.x + 6 + c2d.measureText(tile.name).width / 2, pixRect.y + 16);
    }

    _draw(pixRect) {}
};

Hp.render.BoxDrawing = class extends Hp.render.BaseDrawing {
    constructor(lineColor, fillColor, optLineWidth) {
        super();
        this.lineColor = lineColor;
        this.fillColor = fillColor;
        if (typeof optLineWidth === "undefined") {
            this.lineWidth = 1;
        } else {
            this.lineWidth = optLineWidth;
        }
    }

    _draw(pixRect) {
        super._draw(pixRect);
        const c2d = Hp.render.c2d;

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
    constructor(lineColor, fillColor) {
        super();
        this.lineColor = lineColor;
        this.fillColor = fillColor;
    }

    _draw(pixRect) {
        super._draw(pixRect);
        const c2d = Hp.render.c2d;

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
    constructor(imageAsset, alpha) {
        super();
        this.image = imageAsset;
        this.alpha = alpha;
    }

    _draw(pixRect) {
        super._draw(pixRect);
        const c2d = Hp.render.c2d;

        const drawRect = Hp.math.scaleRectToFitRect(
            {x: 0, y: 0, w: this.image.naturalWidth, h: this.image.naturalHeight},
            pixRect
        );
        c2d.globalAlpha = this.alpha;
        c2d.drawImage(this.image, drawRect.x, drawRect.y, drawRect.w, drawRect.h);
    }
};

Hp.render.MarqueeDrawing = class extends Hp.render.BaseDrawing {
    constructor(image, alpha) {
        super();
        this.image = image;
        this.alpha = alpha;
        this._xOffset = 0.0;
        this._xSpeedPxPerMs = 16 / 1000.0;

        let self = this;
        setInterval(function() { self._xOffset += self._xSpeedPxPerMs * 16.0; }, 16.0);
    }

    _draw(pixRect) {
        super._draw(pixRect);
        const c2d = Hp.render.c2d;

        const imgW = this.image.naturalWidth;
        const imgH = this.image.naturalHeight;

        // Scaling the image so it forms a 'pixRect.h'-height ream:
        const scaleFactor = pixRect.h / imgH;
        const outW = imgW * scaleFactor;
        const outH = imgH * scaleFactor;

        c2d.globalAlpha = this.alpha;

        let replicaOffset = this._xOffset;
        while (replicaOffset > 0) {
            replicaOffset -= imgW;
        }
        for (; replicaOffset < pixRect.x + pixRect.w; replicaOffset += outW) {
            c2d.drawImage(this.image, pixRect.x + replicaOffset, pixRect.y, outW, outH);
        }
    }
};

Hp.render.TextDrawing = class extends Hp.render.BaseDrawing {
    constructor(text, color, fontName, fontSizeEm, alpha) {
        super();
        this.text = text;
        this.color = color;
        this.fontName = fontName;
        this.fontSizeEm = fontSizeEm;
        this.alpha = alpha;
    }

    _draw(pixRect) {
        super._draw(pixRect);
        const c2d = Hp.render.c2d;

        c2d.globalAlpha = this.alpha;
        c2d.fillStyle = this.color;
        c2d.textAlign = "center";
        c2d.textBaseline = "middle";
        c2d.font = this.fontSizeEm.toString() + "em " + this.fontName;
        c2d.fillText(this.text, pixRect.x + (pixRect.w / 2), pixRect.y + (pixRect.h / 2));
    }
};

Hp.render._init = function (canvas) {
    Hp.render.c2d = canvas.getContext("2d");
    if (Hp.render.c2d === null) {
        throw new Hp.Error("Failed to acquire a valid canvas context!");
    }
    Hp.render.resize();
};

Hp.render._draw = function (page) {
    if (page === null) {
        return;
    }
    const canvasSize = Hp.render._canvasSizeDiPx();

    Hp.render.c2d.clearRect(0, 0, canvasSize.x, canvasSize.y);
    Hp.render.c2d.beginPath();

    Hp.render.c2d.fillStyle = page.bgColor;
    Hp.render.c2d.fillRect(0, 0, canvasSize.x, canvasSize.y);

    if (Hp.render.dbgView) {
        Hp.render._drawDbgImp(page);
    } else {
        Hp.render._drawImp(page);
    }
};

Hp.render._drawDbgImp = function (page) {
    const canvasSize = Hp.render._canvasSizeDiPx();
    const tileSize = Hp.render._currentPageTileSizeDiPx(page);

    // Grid
    this.c2d.strokeStyle = Hp.render.dbgGridColor;
    this.c2d.beginPath();
    for (let ix = 0; ix < page.gridSize.x; ix++) {
        this.c2d.moveTo(ix * tileSize.x, 0);
        this.c2d.lineTo(ix * tileSize.x, canvasSize.y);
    }
    for (let iy = 0; iy < page.gridSize.y; iy++) {
        this.c2d.moveTo(0, iy * tileSize.y);
        this.c2d.lineTo(canvasSize.x, iy * tileSize.y);
    }
    this.c2d.stroke();

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
        drawing._dbgDraw(this.c2d, tile, tileSize, boxColorArray[iTile % boxColorArray.length], 2);
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
        drawing._draw(pixRect);
    }
};

Hp.render._canvasSizeDiPx = function () {
    const boundingClientRect = Hp.canvas.getBoundingClientRect();
    return {
        x: boundingClientRect.width,
        y: boundingClientRect.height
    };
};
