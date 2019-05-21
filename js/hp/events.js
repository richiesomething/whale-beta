if (typeof Hp === "undefined") {
    Hp = {};
}

Hp.events = {
    _onClickListenerHandle: null,
    _onResizeListenerHandle: null,
    _onMouseMoveListenerHandle: null,
    _prevMouseGridPos: null
};

Hp.events.enableListeners = function () {

};

Hp.events.disableListeners = function () {

};

Hp.events.enableListeners = function () {
    if (Hp.events._onClickListenerHandle === null) {
        Hp.events._onClickListenerHandle = Hp.canvas.addEventListener(
            "click",
            function (event) {
                const currentPageTileSizeDiPx = Hp._currentPageTileSizeDiPx();

                // Computing the position of the click:
                const clickPosPx = {
                    x: event.pageX - Hp.canvas.offsetLeft,
                    y: event.pageY - Hp.canvas.offsetTop
                };
                const clickPosTile = {
                    x: Math.floor(clickPosPx.x / currentPageTileSizeDiPx.x),
                    y: Math.floor(clickPosPx.y / currentPageTileSizeDiPx.y)
                };

                // Iterating through each tile on the page and checking if it was clicked:
                for (let iTile = 0; iTile < Hp.currentPage().orderedTileList.length; iTile++) {
                    const tile = Hp.currentPage().orderedTileList[iTile];
                    if (Hp.math.collidePointInRect(tile.rect, clickPosTile)) {
                        if (tile.events.hasOwnProperty("click")) {
                            tile.events.click(tile);
                        }
                    }
                }
            }
        );
    }

    if (Hp.events._onResizeListenerHandle === null) {
        Hp.canvas._onResizeListenerHandle = window.addEventListener(
            "resize",
            function (event) { Hp.render.resize(); }
        );
    }

    if (Hp.events._onMouseMoveListenerHandle === null) {
        Hp.canvas.onmousemove = function (event) {
            const canvasRect = Hp.canvas.getBoundingClientRect();
            const currentPageTileSizeDiPx = Hp._currentPageTileSizeDiPx();
            const mousePosPx = {
                x: canvasRect.left - event.clientX,
                y: canvasRect.top  - event.clientY
            };
            const mousePosTile = {
                x: Math.floor(mousePosPx.x / currentPageTileSizeDiPx.x),
                y: Math.floor(mousePosPx.y / currentPageTileSizeDiPx.y)
            };
            if (Hp.events._prevMouseGridPos === null) {
                Hp.events._prevMouseGridPos = mousePosTile;
            } else {
                // Triggering an 'off-hover' for all previous tiles:
                if (mousePosTile !== Hp.events._prevMouseGridPos) {
                    for (let iTile = 0; iTile < Hp.currentPage().orderedTileList.length; iTile++) {
                        const tile = Hp.currentPage().orderedTileList[iTile];
                        if (Hp.math.collidePointInRect(tile.rect, Hp.events._prevMouseGridPos)) {
                            if (tile.events.hasOwnProperty("hover_off")) {
                                tile.events.hover_off(tile);
                            }
                        }
                    }
                    Hp.events._prevMouseGridPos = mousePosTile
                } else {
                    for (let iTile = 0; iTile < Hp.currentPage().orderedTileList.length; iTile++) {
                        const tile = Hp.currentPage().orderedTileList[iTile];
                        if (Hp.math.collidePointInRect(tile.rect, mousePosTile)) {
                            if (tile.events.hasOwnProperty("hover_on")) {
                                tile.events.hover_on(tile);
                            }
                        }
                    }
                }
            }
        };
        this._onMouseMoveListenerHandle = true;
    }
};

Hp.events.disableListeners = function () {
    if (Hp.events._onClickListenerHandle !== null) {
        Hp.canvas.removeEventListener(this._onClickListenerHandle);
        Hp.events._onClickListenerHandle = null;
    }
    if (this._onResizeListenerHandle !== null) {
        Hp.canvas.removeEventListener(this._onResizeListenerHandle);
        Hp.events._onResizeListenerHandle = null;
    }
    if (this._onMouseMoveListenerHandle !== null) {
        Hp.canvas.onmousemove = function (e) {};
        Hp.events._onMouseMoveListenerHandle = null;
    }
};
