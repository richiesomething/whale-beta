Whale = {};

Whale.start = function () {
    try {
        Hp.init(document.getElementById("whale-canvas"));
        Hp.currentPage(new Whale.GamePage());
        Hp.start(60.0);
    } catch (ex) {
        if (ex !== {}) {
            alert("Something went wrong with the 'Harpoon' game engine:\n" + ex.toString());
        }
        document.body.innerHTML = "<div id='errorMsg'>Something went wrong. Please try reloading this page.</div>" +
                                  document.body.innerHTML;
        throw ex;
    }
};

Whale.Message = {};

Whale.GamePage = class extends Hp.page.Page {
    constructor() {
        super("WhalePage", "#ffffff", {x: 24, y: 24});
        const self = this;

        let x = 0;
        function helpClickChoice(choiceID) {
            Hp.net.send("choice", {choice_id: choiceID});

            // Playing audio:
            Hp.audio.start(self.dropAudio);

            // Changing the text to the next two stocks:
            // TODO: We need to write some backend events that pull new stocks and load them.
            self.choice1TitleTile.drawing.text = x.toString();
            self.choice1SubtitleTile.drawing.text = (x * x).toString();
            self.choice2TitleTile.drawing.text = (x + 1).toString();
            self.choice2SubtitleTile.drawing.text = (x*x + 2*x + 1).toString();
            x += 2;
        }
        function clickChoice1() { helpClickChoice(1); }
        function clickChoice2() { helpClickChoice(2); }

        // Drawing the mascot:  TODO: Improve asset loading! Currently, all assets are just embedded in the HTML file.
        const mascotDrawing = new Hp.render.FrameDrawing(document.getElementById("mascot"), 1.0);
        this.mascotTile = new Hp.page.Tile("mascot", {x: 19, y: 18, w: 4, h: 5}, mascotDrawing);

        const speechBubbleDrawing = new Hp.render.FrameDrawing(document.getElementById("speech-bubble"), 1.0);
        this.speechBubbleTile = new Hp.page.Tile("speechBubble", {x: 15, y: 15, w: 7, h: 5}, speechBubbleDrawing);

        const speechTextL1Drawing = new Hp.render.TextDrawing("Which stock do you think did better", "#2e3192", "ObjectSans-Regular", 1, 1.0);
        const speechTextL2Drawing = new Hp.render.TextDrawing("today?", "#2e3192", "ObjectSans-Regular", 1, 1.0);
        this.speechTextL1Tile = new Hp.page.Tile("speechBubble.text.l1", {x: 15, y: 16, w: 7, h: 1}, speechTextL1Drawing);
        this.speechTextL2Tile = new Hp.page.Tile("speechBubble.text.l2", {x: 15, y: 17, w: 7, h: 1}, speechTextL2Drawing);

        // Creating the water:
        const waterWavesDrawing = new Hp.render.MarqueeDrawing(document.getElementById("water.waves"), 1.0);
        this.waterWavesTile = new Hp.page.Tile("water.waves", {x: 0, y: 17, w: 24, h: 1}, waterWavesDrawing);

        const waterBodyDrawing = new Hp.render.BoxDrawing("#bddff6", "#bddff6", 5);  // FIXME: 5dip border
        this.waterBodyTile = new Hp.page.Tile("water.body", {x: 0, y: 18, w: 24, h: 6}, waterBodyDrawing);

        // Creating the logo in the top-left corner:
        const logoColor = "#3fa9f5";
        const logoHlColor = "#6fc9ff";
        const logoDrawing = new Hp.render.TextDrawing("whale", logoColor, "ObjectSans-Regular", 3, 1.0);
        this.logoTile = new Hp.page.Tile("whale", {x: 1, y: 1, w: 3, h: 2}, logoDrawing);

        // Creating the choice buttons:
        const choice1BtnDrawing = new Hp.render.CircleDrawing("#00000000", "#fafafa");
        const choice1TitleDrawing = new Hp.render.TextDrawing("CNK", "#3fa9f5", "ObjectSans-Regular", 4, 1.0);
        const choice1SubtitleDrawing = new Hp.render.TextDrawing("Cinemark", "#2e3192", "ObjectSans-Regular", 2, 1.0);
        this.choice1BtnTile = new Hp.page.Tile("choice1.btn", {x: 5, y: 5, w: 6, h: 10}, choice1BtnDrawing);
        this.choice1TitleTile = new Hp.page.Tile("choice1.text", {x: 5, y: 7, w: 6, h: 6}, choice1TitleDrawing);
        this.choice1SubtitleTile = new Hp.page.Tile("choice2.subtitle", {x: 5, y: 11, w: 6, h: 1}, choice1SubtitleDrawing);

        const choice2BtnDrawing = new Hp.render.CircleDrawing("#00000000", "#b8dff640");
        const choice2TitleDrawing = new Hp.render.TextDrawing("NFLX", "#3fa9f5", "ObjectSans-Regular", 4, 1.0);
        const choice2SubtitleDrawing = new Hp.render.TextDrawing("Netflix", "#2e3192", "ObjectSans-Regular", 2, 1.0);
        this.choice2BtnTile = new Hp.page.Tile("choice2.btn", {x: 14, y: 5, w: 6, h: 10}, choice2BtnDrawing);
        this.choice2TitleTile = new Hp.page.Tile("choice2.title", {x: 14, y: 7, w: 6, h: 6}, choice2TitleDrawing);
        this.choice2SubtitleTile = new Hp.page.Tile("choice2.subtitle", {x: 14, y: 11, w: 6, h: 1}, choice2SubtitleDrawing);

        // Adding the timer:
        const timerDrawing = new Hp.render.TextDrawing("60", "#3fa9f5", "ObjectSans-Regular", 4, 1.0);
        this.timerTile = new Hp.page.Tile("timer", {x: 11, y: 1, w: 2, h: 2}, timerDrawing);
        const secLeftDrawing = new Hp.render.TextDrawing("seconds left", "#b8dff6", "ObjectSans-Regular", 2, 1.0);
        this.secLeftTile = new Hp.page.Tile("secLeft", {x: 10, y: 3, w: 4, h: 1}, secLeftDrawing);

        // Adding event handlers:
        self.logoTile.events.click     = function () { document.getElementById("whale-link").click(); };
        self.logoTile.events.hover_on  = function () { self.logoTile.drawing.color = logoHlColor; };
        self.logoTile.events.hover_off = function () { self.logoTile.drawing.color = logoColor; };

        self.choice1BtnTile.events.click = clickChoice1;
        self.choice2BtnTile.events.click = clickChoice2;

        // Loading audio files:
        self.dropAudio = Hp.assets.audio("drop");
        self.oceanAudio = Hp.assets.audio("ocean");
        self.tickTickAudio = Hp.assets.audio("tick_tick");
    }

    load() {
        super.load();
        this.addTopTile(this.waterWavesTile);
        this.addTopTile(this.waterBodyTile);
        this.addTopTile(this.mascotTile);
        this.addTopTile(this.speechBubbleTile);
        this.addTopTile(this.speechTextL1Tile);
        this.addTopTile(this.speechTextL2Tile);

        this.addTopTile(this.logoTile);

        this.addTopTile(this.choice1BtnTile);
        this.addTopTile(this.choice1TitleTile);
        this.addTopTile(this.choice1SubtitleTile);

        this.addTopTile(this.choice2BtnTile);
        this.addTopTile(this.choice2TitleTile);
        this.addTopTile(this.choice2SubtitleTile);

        this.addTopTile(this.timerTile);
        this.addTopTile(this.secLeftTile);

        // Playing both background audio files:
        Hp.audio.startLooped(this.oceanAudio);
        Hp.audio.startLooped(this.tickTickAudio);
    }

    unload() {
        super.unload();

        this.remAllTiles();

        Hp.audio.stop(self.oceanAudio);
        Hp.audio.stop(self.tickTickAudio);
    }
};

document.addEventListener("DOMContentLoaded", Whale.start);
