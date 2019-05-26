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
    if (Hp.events._onClickListenerHandle === null) {
        Hp.events._onClickListenerHandle = Hp._canvas.addEventListener(
            "click",
            function (event) {
                const currentPageTileSizeDiPx = Hp._currentPageTileSizeDiPx();

                // Computing the position of the click:
                const clickPosPx = {
                    x: event.pageX - Hp._canvas.offsetLeft,
                    y: event.pageY - Hp._canvas.offsetTop
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
        Hp._canvas._onResizeListenerHandle = window.addEventListener(
            "resize",
            function (e) { Hp.render.resize(); }
        );
    }

    if (Hp.events._onMouseMoveListenerHandle === null) {
        Hp._canvas.onmousemove = function (event) {
            const canvasRect = Hp._canvas.getBoundingClientRect();
            const currentPageTileSizeDiPx = Hp._currentPageTileSizeDiPx();
            const mousePosPx = {
                x: event.clientX - canvasRect.left,
                y: event.clientY - canvasRect.top
            };
            const mousePosTile = {
                x: Math.floor(mousePosPx.x / currentPageTileSizeDiPx.x),
                y: Math.floor(mousePosPx.y / currentPageTileSizeDiPx.y)
            };
            if (Hp.events._prevMouseGridPos === null) {
                Hp.events._prevMouseGridPos = mousePosTile;
            } else if (mousePosTile !== Hp.events._prevMouseGridPos) {
                // Updating all tiles that just lost their hover:
                for (let iTile = 0; iTile < Hp.currentPage().orderedTileList.length; iTile++) {
                    const tile = Hp.currentPage().orderedTileList[iTile];
                    if (Hp.math.collidePointInRect(tile.rect, Hp.events._prevMouseGridPos)) {
                        if (tile.events.hasOwnProperty("hover_off")) {
                            tile.events.hover_off(tile);
                        }
                    }
                }
                Hp.events._prevMouseGridPos = mousePosTile;

                // Triggering a hover for all tiles under the new cursor grid position:
                for (let iTile = 0; iTile < Hp.currentPage().orderedTileList.length; iTile++) {
                    const tile = Hp.currentPage().orderedTileList[iTile];
                    if (Hp.math.collidePointInRect(tile.rect, mousePosTile)) {
                        if (tile.events.hasOwnProperty("hover_on")) {
                            console.log("Hover on: " + tile.name);
                            tile.events.hover_on(tile);
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
        Hp._canvas.removeEventListener(this._onClickListenerHandle);
        Hp.events._onClickListenerHandle = null;
    }
    if (this._onResizeListenerHandle !== null) {
        Hp._canvas.removeEventListener(this._onResizeListenerHandle);
        Hp.events._onResizeListenerHandle = null;
    }
    if (this._onMouseMoveListenerHandle !== null) {
        Hp._canvas.onmousemove = function (e) {};
        Hp.events._onMouseMoveListenerHandle = null;
    }
};
