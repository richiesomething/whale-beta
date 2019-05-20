let Harpoon = class {
    constructor (gameId, roomId, _canvasId, updateCb) {
        const self = this;

        function getCanvas(canvasId) {
            let canvas = document.getElementById(canvasId);
            if (canvas === null) {
                throw new HarpoonError("No canvas named '" + canvasId + "' could be found.")
            } else {
                return canvas;
            }
        }

        function getRenderer(canvas) {
            // let gl = canvas.getContext("webgl");
            // if (gl !== null) {
            //     console.log("Loading Harpoon with a WebGL context.");
            //     return new RenderGl(canvas, gl);     // TODO: Load a WebGL context
            // }
            let c2d = canvas.getContext("2d");
            if (c2d !== null) {
                console.log("Loading Harpoon with a canvas 2D context.");
                self.BaseDrawing = C2dBaseDrawing;
                self.BoxDrawing = C2dBoxDrawing;
                self.CircleDrawing = C2dCircleDrawing;
                self.FrameDrawing = C2dFrameDrawing;
                self.TextDrawing = C2dTextDrawing;
                self.MarqueeDrawing = C2dMarqueeDrawing;

                return new C2dRenderer(self, canvas, c2d);
            }
            throw new HarpoonError("Failed to acquire a valid 2D or WebGL context");
        }

        self._gameId = gameId;
        this._roomId = roomId;

        self._assetManager  = new HpAssetManager();
        self._canvas        = getCanvas(_canvasId);
        self._renderer      = getRenderer(self.canvas);
        self._stop          = false;
        self._currentPage   = null;
        self._updateCb      = updateCb;

        // Adding a 'click' listener:
        self._onClickListenerFunc = function (event) {
            // Computing the position of the click:
            const clickPosPx = {
                x: event.pageX - self.canvas.offsetLeft,
                y: event.pageY - self.canvas.offsetTop
            };
            const clickPosTile = {
                x: Math.floor(clickPosPx.x / self.tileSizePx.x),
                y: Math.floor(clickPosPx.y / self.tileSizePx.y)
            };

            // Iterating through each tile on the page and checking if it was clicked:
            for (let iTile = 0; iTile < self.currentPage.orderedTileList.length; iTile++) {
                const tile = self.currentPage.orderedTileList[iTile];
                if (collidePointInRect(tile.rect, clickPosTile)) {
                    if (tile.events.hasOwnProperty("click")) {
                        tile.events.click(tile);
                    }
                }
            }
        };
        self._onClickListenerHandle = null;

        // Adding a resize handler:
        self._onResizeListenerFunc = function (event) {
            self.renderer.resize();
        };
        self._onResizeListenerHandle = null;

        // Adding a mouse-move handler:
        self._prevMousePos = null;
        self._onMouseMoveListenerFunc = function (event) {
            const canvasRect = self.canvas.getBoundingClientRect();
            const mousePosPx = {
                x: canvasRect.left - event.clientX,
                y: canvasRect.top  - event.clientY
            };
            const mousePosTile = {
                x: Math.floor(mousePosPx.x / self.tileSizePx.x),
                y: Math.floor(mousePosPx.y / self.tileSizePx.y)
            };
            if (self._prevMousePos === null) {
                self._prevMousePos = mousePosTile;
            } else {
                // Triggering an 'off-hover' for all previous tiles:
                if (mousePosTile !== self._prevMousePos) {
                    for (let iTile = 0; iTile < self.currentPage.orderedTileList.length; iTile++) {
                        const tile = self.currentPage.orderedTileList[iTile];
                        if (collidePointInRect(tile.rect, self._prevMousePos)) {
                            if (tile.events.hasOwnProperty("hover_off")) {
                                tile.events.hover_off(tile);
                            }
                        }
                    }
                    self._prevMousePos = mousePosTile
                } else {
                    for (let iTile = 0; iTile < self.currentPage.orderedTileList.length; iTile++) {
                        const tile = self.currentPage.orderedTileList[iTile];
                        if (collidePointInRect(tile.rect, mousePosTile)) {
                            if (tile.events.hasOwnProperty("hover_on")) {
                                tile.events.hover_on(tile);
                            }
                        }
                    }
                }
            }
        };
        self._onMouseMoveListenerHandle = null;

        // Setting up sockets:
        self._socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
        self.sendWebEvent("start_game", {game_id: self._gameId, room_id: self._roomId});
    }

    get canvas() {
        return this._canvas;
    }

    get renderer() {
        return this._renderer;
    }

    get stop() {
        return this._stop;
    }

    set stop(value) {
        this._stop = value;
    }

    get currentPage() {
        return this._currentPage;
    }

    set currentPage(page) {
        // Unloading the previous page if necessary:
        if (this.currentPage !== null) {
            this.disableListeners();
            this.currentPage.unload(this);
        }

        // Loading the new page:
        this._currentPage = page;
        this.currentPage.load(this);
        this.enableListeners();

        // Forcing the renderer to resize on loading:
        this.renderer.resize();
    }

    get assets() {
        return this._assetManager;
    }

    get canvasSizePx() {
        const boundingClientRect = this.canvas.getBoundingClientRect();
        return {
            x: boundingClientRect.width,
            y: boundingClientRect.height
        };
    }

    get tileSizePx() {
        if (this.currentPage !== null) {
            const canvasSize = this.canvasSizePx;
            const gridSize = this.currentPage.gridSize;
            return {
                x: canvasSize.x / gridSize.x,
                y: canvasSize.y / gridSize.y
            };
        } else {
            return {x: 0, y: 0};
        }
    }

    enableListeners() {
        if (this._onClickListenerHandle === null) {
            this._onClickListenerHandle = this.canvas.addEventListener("click", this._onClickListenerFunc);
        }
        if (this._onResizeListenerHandle === null) {
            this._onResizeListenerHandle = window.addEventListener("resize", this._onResizeListenerFunc);
        }
        if (this._onMouseMoveListenerHandle === null) {
            this.canvas.onmousemove = this._onMouseMoveListenerFunc;
            this._onMouseMoveListenerHandle = true;
        }
    }

    disableListeners() {
        if (this._onClickListenerHandle !== null) {
            this.canvas.removeEventListener(this._onClickListenerHandle);
            this._onClickListenerHandle = null;
        }
        if (this._onResizeListenerHandle !== null) {
            this.canvas.removeEventListener(this._onResizeListenerHandle);
            this._onResizeListenerHandle = null;
        }
        if (this._onMouseMoveListenerHandle !== null) {
            this.canvas.onmousemove = function (e) {};
            this._onMouseMoveListenerHandle = null;
        }
    }

    start(updateRate) {
        let self = this;

        const updateFrameTimeInMs = 1000.0 / updateRate;
        let accumDeltaTime = 0;
        let lastFrameTime = performance.now();
        let frameRequest = null;

        let drawFrame = function (thisFrameTime) {
            let delta = thisFrameTime - lastFrameTime;
            lastFrameTime = thisFrameTime;

            accumDeltaTime += delta;
            while (accumDeltaTime >= updateFrameTimeInMs) {
                self._updateCb(updateFrameTimeInMs);
                accumDeltaTime -= updateFrameTimeInMs;
            }

            self._renderer.draw(self.currentPage);

            if (self.stop) {
                window.cancelAnimationFrame(frameRequest);
            } else {
                frameRequest = window.requestAnimationFrame(drawFrame);
            }
        };

        drawFrame(lastFrameTime);
    }

    //
    // Web events:
    //

    sendWebEvent(event, data) {
        const eventName = this._gameId + "." + event;
        this._socket.emit(eventName, {game_id: this._gameId, room_id: this._roomId, data: data})
    }

    onWebEvent(event, callback) {
        const eventName = this._gameId + "." + event;
        this._socket.on(eventName, callback);
    }

    //
    // Audio:
    //

    startAudio(audioObj) {
        audioObj.currentTime = 0;
        audioObj.play();
    }

    startLoopedAudio(audioObj) {
        this.startAudio(audioObj);
        audioObj.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        }, false);
    }

    stopAudio(audioObj) {
        audioObj.pause();
        audioObj.currentTime = 0;
    }
};

let Tile = class {
    constructor(name, rect, drawing, /* opt */ events) {
        this.name    = name;
        this.rect    = rect;
        this.drawing = drawing;  // Can be null if unwanted.
        if (typeof events !== "undefined")
            this.events = events;
        else
            this.events = {};
    }
};

let Page = class {
    constructor(harpoon, name, bgColorHexCode, gridSize) {
        this._name     = name;
        this._bgColor  = bgColorHexCode;
        this._tiles    = [];
        this._gridSize = gridSize;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get bgColor() {
        return this._bgColor;
    }

    get orderedTileList() {
        return this._tiles;
    }

    get gridSize() {
        return this._gridSize;
    }

    load(harpoon) {}

    unload(harpoon) {}

    addTopTile(tile) {
        this._tiles.push(tile);
    }

    remTile(tile) {
        for (let i = 0; i < this._tiles.length; i++) {
            if (this._tiles[i] === tile) {
                this._tiles.splice(i, 1);
                break;
            }
        }
    }

    remAllTiles() {
        this._tiles = [];
    }
};

let HarpoonError = class {
    constructor(desc) {
        this.desc = desc;
    }
};

// NOTE: all colors are currently HTML5 hash-code strings
