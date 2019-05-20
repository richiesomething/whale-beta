let C2dRenderer = class {
    constructor(harpoon, canvas, c2d) {
        this._harpoon = harpoon;
        this._canvas = canvas;
        this._c2d = c2d;

        this._dbgView = false;    // Debug setting only; set to 'true' to draw grids over the map.
        this._dbgGridColor = "#555";
    }

    resize() {
        const pixRatio = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();    // Getting size in CSS pixels
        this.canvas.width = rect.width * pixRatio;
        this.canvas.height = rect.height * pixRatio;
        this.c2d.scale(pixRatio, pixRatio);
        this.c2d.clearRect(0, 0, rect.width, rect.height);
    }

    get harpoon() {
        return this._harpoon;
    }

    get canvas() {
        return this._canvas;
    }

    get c2d() {
        return this._c2d;
    }

    draw(page) {
        // Computing the x and y scale per-grid:
        const canvasSize = this.harpoon.canvasSizePx;
        const tileSize = this.harpoon.tileSizePx;

        this.c2d.clearRect(0, 0, canvasSize.x, canvasSize.y);
        this.c2d.beginPath();

        this.c2d.fillStyle = page.bgColor;
        this.c2d.fillRect(0, 0, canvasSize.x, canvasSize.y);

        if (this._dbgView) {
            // Grid
            this.c2d.strokeStyle = this._dbgGridColor;
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
                drawing.dbgDraw(this.c2d, tile, tileSize, boxColorArray[iTile % boxColorArray.length], 2);
            }
        } else {
            for (let iTile = 0; iTile < page.orderedTileList.length; iTile++) {
                let tile = page.orderedTileList[iTile];
                let drawing = tile.drawing;

                let pixRect = {
                    x: tile.rect.x * tileSize.x,
                    y: tile.rect.y * tileSize.y,
                    w: tile.rect.w * tileSize.x,
                    h: tile.rect.h * tileSize.y
                };
                drawing.draw(this.c2d, pixRect);
            }
        }

    }
};

let C2dBaseDrawing = class {
    dbgDraw(c2d, tile, gridToPixScale, boxColor, lineWidth) {
        const pixRect = {
            x: tile.rect.x * gridToPixScale.x,
            y: tile.rect.y * gridToPixScale.y,
            w: tile.rect.w * gridToPixScale.x,
            h: tile.rect.h * gridToPixScale.y
        };

        // Drawing the original image:
        this.draw(c2d, pixRect);

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

    draw(c2d, pixRect) {}
};

let C2dBoxDrawing = class extends C2dBaseDrawing {
    constructor(lineColor, fillColor, /* opt */ lineWidth) {
        super();
        this.lineColor = lineColor;
        this.fillColor = fillColor;
        if (typeof lineWidth === "undefined") {
            this.lineWidth = 1;
        } else {
            this.lineWidth = lineWidth;
        }
    }

    draw(c2d, pixRect) {
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

let C2dCircleDrawing = class extends C2dBaseDrawing {
    constructor(lineColor, fillColor) {
        super();
        this.lineColor = lineColor;
        this.fillColor = fillColor;
    }

    draw(c2d, pixRect) {
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

let C2dFrameDrawing = class extends C2dBaseDrawing {
    constructor(image, alpha) {     // TODO: Swap out 'image' for a handle to an asset manager.
        super();
        this.image = image;
        this.alpha = alpha;
    }

    draw(c2d, pixRect) {
        super.draw(c2d, pixRect);

        // FIXME: This padding code does not work correctly. It instead stretches images.
        // TODO: Move this padding code somewhere else, where it can be shared with TextDrawing.
        const drawRect = scaleRectToFitRect(
            {x: 0, y: 0, w: this.image.naturalWidth, h: this.image.naturalHeight},
            pixRect
        );
        c2d.globalAlpha = this.alpha;
        c2d.drawImage(this.image, drawRect.x, drawRect.y, drawRect.w, drawRect.h);
    }
};

let C2dMarqueeDrawing = class extends C2dBaseDrawing {
    constructor(image, alpha) {
        super();
        this.image = image;
        this.alpha = alpha;
        this._xOffset = 0.0;
        this._xSpeedPxPerMs = 16 / 1000.0;

        let self = this;
        setInterval(function() { self._xOffset += self._xSpeedPxPerMs * 16.0; }, 16.0);
    }

    draw(c2d, pixRect) {
        super.draw(c2d, pixRect);

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

let C2dTextDrawing = class extends C2dBaseDrawing {
    constructor(text, color, fontName, fontSizeEm, alpha) {
        super();
        this.text = text;
        this.color = color;
        this.fontName = fontName;
        this.fontSizeEm = fontSizeEm;
        this.alpha = alpha;

        // TODO: Move gridWidth and gridHeight into the base drawing class, along with methods to manipulate them
        //       easily.
        // TODO: Change xScale, yScale to scale.x, scale.y and turn them into one parameter.
    }

    draw(c2d, pixRect) {
        super.draw(c2d, pixRect);
        c2d.globalAlpha = this.alpha;
        c2d.fillStyle = this.color;
        c2d.textAlign = "center";
        c2d.textBaseline = "middle";
        c2d.font = this.fontSizeEm.toString() + "em " + this.fontName;
        c2d.fillText(this.text, pixRect.x + (pixRect.w / 2), pixRect.y + (pixRect.h / 2));
    }
};
