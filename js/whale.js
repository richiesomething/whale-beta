Whale = {};

Whale.start = function () {
    try {
        let gameId = document.getElementById("game-id").innerHTML.trim();
        let roomId = document.getElementById("room-id").innerHTML.trim();

        const hp = new Harpoon(gameId, roomId, "whale-canvas", function (dt) {});
        hp.currentPage = new WhalePage(hp);
        hp.start(60.0);
    } catch (ex) {
        if (ex !== {}) {
            alert("Something went wrong with the 'Harpoon' game engine:\n" + ex.toString());
        }
        document.body.innerHTML = "<div id='errorMsg'>Something went wrong. Please try reloading this page.</div>";
        throw ex;
    }
};

Whale.Message = {};

let WhalePage = class extends Page {
    constructor(hp) {
        super(hp, "WhalePage", "#ffffff", {x: 24, y: 24});
        const self = this;

        let x = 0;

        function helpClickChoice(choiceID, tile) {
            hp.sendWebEvent("choice", {choice_id: choiceID});

            // Playing audio:
            hp.startAudio(self.dropAudio);

            // Changing the text to the next two stocks:
            // TODO: We need to write some backend events that pull new stocks and load them.
            self.choice1TitleTile.drawing.text = x.toString();
            self.choice2TitleTile.drawing.text = (x + 1).toString();
            x += 2;
        }

        function clickChoice1(tile) {
            helpClickChoice(1, tile);
        }

        function clickChoice2(tile) {
            helpClickChoice(2, tile);
        }

        // Drawing the mascot:  TODO: Improve asset loading! Currently, all assets are just embedded in the HTML file.
        const mascotDrawing = new hp.FrameDrawing(document.getElementById("mascot"), 1.0);
        this.mascotTile = new Tile("mascot", {x: 19, y: 18, w: 4, h: 5}, mascotDrawing);

        // Creating the water:
        const waterWavesDrawing = new hp.MarqueeDrawing(document.getElementById("water.waves"), 1.0);
        this.waterWavesTile = new Tile("water.waves", {x: 0, y: 17, w: 24, h: 1}, waterWavesDrawing);

        const waterBodyDrawing = new hp.BoxDrawing("#bddff6", "#bddff6", 5);  // FIXME: 5dip border
        this.waterBodyTile = new Tile("water.body", {x: 0, y: 18, w: 24, h: 6}, waterBodyDrawing);

        // Creating the logo in the top-left corner:
        const logoColor = "#3fa9f5";
        const logoHlColor = "#6fc9ff";
        const logoDrawing = new hp.TextDrawing("whale", logoColor, "Times New Roman", 3, 1.0);
        this.logoTile = new Tile(
            "whale", {x: 1, y: 1, w: 3, h: 2}, logoDrawing, {
                hover_on:  function (tile) { tile.drawing.color = logoHlColor; },
                hover_off: function (tile) { tile.drawing.color = logoColor; },
                click: function (tile) { document.getElementById("whale-link").click(); }
            }
        );

        // Creating the choice 1 button::
        const choice1BtnDrawing = new hp.CircleDrawing("#00000000", "#fafafa");
        this.choice1BtnTile = new Tile(
            "choice1.btn", {x: 5, y: 5, w: 6, h: 10}, choice1BtnDrawing, {click: clickChoice1}
        );

        const choice1TitleDrawing = new hp.TextDrawing("CNK", "#3fa9f5", "Times New Roman", 4, 1.0);
        this.choice1TitleTile = new Tile("choice1.text", {x: 5, y: 7, w: 6, h: 6}, choice1TitleDrawing);
        const choice1SubtitleDrawing = new hp.TextDrawing("Cinemark", "#2e3192", "Times New Roman", 1, 1.0);
        this.choice1SubtitleTile = new Tile("choice2.subtitle", {x: 5, y: 15, w: 6, h: 1}, choice1SubtitleDrawing);

        const choice2BtnDrawing = new hp.CircleDrawing("#00000000", "#b8dff640");
        this.choice2BtnTile = new Tile(
            "choice2.btn", {x: 14, y: 5, w: 6, h: 10}, choice2BtnDrawing, {click: clickChoice2}
        );

        const choice2TitleDrawing = new hp.TextDrawing("NFLX", "#3fa9f5", "Times New Roman", 4, 1.0);
        this.choice2TitleTile = new Tile("choice2.title", {x: 14, y: 7, w: 6, h: 6}, choice2TitleDrawing);
        const choice2SubtitleDrawing = new hp.TextDrawing("Netflix", "#2e3192", "Times New Roman", 1, 1.0);
        this.choice2SubtitleTile = new Tile("choice2.subtitle", {x: 14, y: 10, w: 6, h: 1}, choice2SubtitleDrawing);

        const timerDrawing = new hp.TextDrawing("60", "#3fa9f5", "Times New Roman", 4, 1.0);
        this.timerTile = new Tile("timer", {x: 11, y: 1, w: 2, h: 2}, timerDrawing);

        // Adding event handlers:
        hp.onWebEvent(
            "tick",
            function (data) {
                self.timerTile.drawing.text = data.t;
            }
        );

        // Loading audio files:
        self.dropAudio = hp.assets.audio("drop");
        self.oceanAudio = hp.assets.audio("ocean");
        self.tickTickAudio = hp.assets.audio("tick_tick");
    }

    load(harpoon) {
        super.load(harpoon);
        this.addTopTile(this.waterWavesTile);
        this.addTopTile(this.waterBodyTile);
        this.addTopTile(this.mascotTile);
        this.addTopTile(this.logoTile);
        this.addTopTile(this.choice1BtnTile);
        this.addTopTile(this.choice1TitleTile);
        this.addTopTile(this.choice2BtnTile);
        this.addTopTile(this.choice2TitleTile);
        this.addTopTile(this.timerTile);
        this.addTopTile(this.choice1SubtitleTile);
        this.addTopTile(this.choice2SubtitleTile);

        // Playing both background audio files:
        harpoon.startLoopedAudio(this.oceanAudio);
        harpoon.startLoopedAudio(this.tickTickAudio);
    }

    unload(harpoon) {
        super.unload(harpoon);

        this.remAllTiles();

        harpoon.stopAudio(self.oceanAudio);
        harpoon.stopAudio(self.tickTickAudio);
    }
};

document.addEventListener("DOMContentLoaded", Whale.start);
