if (typeof Hp === "undefined") {
    Hp = {};
}

Hp.gameId = null;   // Will be assigned by the server in HTML
Hp.roomId = null;   // Will be assigned by the server in HTML
Hp.playerId = null; // Will be assigned by the server in HTML

Hp.canvas = null;
Hp.stop = null;
Hp._currentPage = null;

Hp.init = function (canvasObj) {
    if (Hp.gameId === null || Hp.roomId === null) {
        throw new Hp.Error("A game ID and room ID was not supplied. This is a server error.");
    }
    Hp.canvas = canvasObj;
    Hp.render._init(canvasObj);
    Hp.net._init();
};

Hp.currentPage = function (optPage) {
    if (typeof optPage === "undefined") {
        return Hp._currentPage;
    } else {
        if (Hp._currentPage !== null) {
            Hp.events.disableListeners();
            Hp._currentPage.unload(this);
        }

        // Loading the new page:
        Hp._currentPage = optPage;
        Hp._currentPage.load(this);

        Hp.events.enableListeners();

        // Forcing the renderer to resize on loading:
        Hp.render.resize();
    }
};

Hp.start = function (updateRate) {
    const updateFrameTimeInMs = 1000.0 / updateRate;
    let accumDeltaTime = 0;
    let lastFrameTime = performance.now();
    let frameRequest = null;

    let drawFrame = function (thisFrameTime) {
        let delta = thisFrameTime - lastFrameTime;
        lastFrameTime = thisFrameTime;
        accumDeltaTime += delta;
        while (accumDeltaTime >= updateFrameTimeInMs) {
            Hp.currentPage().update(updateFrameTimeInMs);
            accumDeltaTime -= updateFrameTimeInMs;
        }

        Hp.render._draw(Hp.currentPage());

        if (Hp.stop) {
            window.cancelAnimationFrame(frameRequest);
        } else {
            frameRequest = window.requestAnimationFrame(drawFrame);
        }
    };

    drawFrame(lastFrameTime);
};

Hp._currentPageTileSizeDiPx = function () {
    const page = Hp.currentPage();
    if (page !== null) {
        const canvasSize = Hp.render._canvasSizeDiPx();
        const gridSize = page.gridSize;
        return {
            x: canvasSize.x / gridSize.x,
            y: canvasSize.y / gridSize.y
        };
    } else {
        return {x: 0, y: 0};
    }
};

Hp.Error = class {
    constructor(desc) {
        this.desc = desc;
    }
};

// NOTE: all colors are currently HTML5 hash-code strings
