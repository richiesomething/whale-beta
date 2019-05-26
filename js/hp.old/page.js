if (typeof Hp === "undefined") {
    Hp = {};
}

Hp.page = {};

Hp.page.Page = class {
    constructor(name, bgColorHexCode, gridSize) {
        this._name     = name;
        this._bgColor  = bgColorHexCode;
        this._tiles    = [];
        this._gridSize = gridSize;
    }

    get name()            { return this._name; }
    set name(value)       { return this._name = value; }
    get bgColor()         { return this._bgColor; }
    get orderedTileList() { return this._tiles; }
    get gridSize()        { return this._gridSize; }

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

    update() {}
    load() {}
    unload() {}
};

Hp.page.Tile = class {
    constructor(name, rect, drawing) {
        this.name    = name;
        this.rect    = rect;
        this.drawing = drawing;  // Can be null if unwanted.
        this.events = {
            click: function () {},
            hover_on: function () {},
            hover_off: function () {}
        }
    }
};
