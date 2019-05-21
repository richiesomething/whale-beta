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

Whale.StartPage = class extends Hp.page.Page {
    constructor() {
        super("Whale.StartPage", "#ffffff", {x: 4, y: 12});
        const self = this;

        const welcomeDrawing = new Hp.render.TextDrawing("Welcome to Whale!", "#2e3192", "ObjectSans-Regular", 2, 1.0);
        self.welcomeTile = new Hp.page.Tile("welcome", {x: 1, y: 1, w: 2, h: 1}, welcomeDrawing);

        const para1 = "\tWhale is a game about shares. When companies need to raise money, they may sell portions of " +
                      "themselves, or 'shares', to the public. These 'shareholders' are entitled to a share of the " +
                      "company's future earnings and a say in its important decisions. They are also entitled to " +
                      "sell their shares to others.";
        const para2 = "\tHealthy companies' shares generate more money, so they are in higher demand, and thus " +
                      "command a higher price in the market. Shareholders around the world place careful bets every " +
                      "day, speculating about the prices of shares by tracking the news.";
        const para3 = "\tWhale keeps you on the pulse of these companies' shares in a fun and engaging way. Ready?";
        const textLine1 = new Hp.render.TextDrawing()
    }

    load() {
        super.unload();
        this.addTopTile(this.welcomeTile);
    }

    unload() {
        super.unload();
        this.remAllTiles();
    }
};

Whale.GamePage = class extends Hp.page.Page {
    constructor() {
        super("Whale.GamePage", "#ffffff", {x: 24, y: 24});
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

        const clearColor = "#00000000";
        const darkBlue = "#2e3192";
        const lowBlue = "#2e3192";
        const midBlue = "#3fa9f5";
        const highBlue = "#6fc9ff";
        const skyBlue = "#bddff6";
        const faintBlue = "#d0eeff";
        const warmPeach = "#fafafa";

        // Drawing the mascot:  TODO: Improve asset loading! Currently, all assets are just embedded in the HTML file.
        const mascotImg = Hp.assets.image("mascot");
        const mascotDrawing = new Hp.render.FrameDrawing(mascotImg);
        this.mascotTile = new Hp.page.Tile("mascot", {x: 19, y: 18, w: 4, h: 5}, mascotDrawing);

        const speechBubbleImg = Hp.assets.image("speech-bubble");
        const speechBubbleDrawing = new Hp.render.FrameDrawing(speechBubbleImg);
        this.speechBubbleTile = new Hp.page.Tile("speechBubble", {x: 15, y: 15, w: 7, h: 5}, speechBubbleDrawing);

        const speechTextL1Drawing = new Hp.render.TextDrawing("Which stock do you think did better?", {color: darkBlue, fontSize: 2});
        this.speechTextL1Tile = new Hp.page.Tile("speechBubble.text.l1", {x: 15, y: 16, w: 7, h: 2}, speechTextL1Drawing);

        // Creating the water:
        const waterWavesImg = Hp.assets.image("water.waves");
        const waterWavesDrawing = new Hp.render.MarqueeDrawing(waterWavesImg, {speed: 15});
        this.waterWavesTile = new Hp.page.Tile("water.waves", {x: 0, y: 17, w: 24, h: 1}, waterWavesDrawing);

        const waterBodyDrawing = new Hp.render.BoxDrawing({lineColor: skyBlue, fillColor: skyBlue, lineWidth: 5});
        this.waterBodyTile = new Hp.page.Tile("water.body", {x: 0, y: 18, w: 24, h: 6}, waterBodyDrawing);

        // Creating the logo in the top-left corner:
        const logoDrawing = new Hp.render.TextDrawing("whale", {color: midBlue, fontSize: 3});
        this.logoTile = new Hp.page.Tile("whale", {x: 1, y: 1, w: 3, h: 2}, logoDrawing);

        // Creating the choice buttons:
        const choice1BtnDrawing = new Hp.render.CircleDrawing({lineColor: clearColor, fillColor: warmPeach});
        const choice1TitleDrawing = new Hp.render.TextDrawing("CNK", {color: midBlue, fontSize: 4});
        const choice1SubtitleDrawing = new Hp.render.TextDrawing("Cinemark", {color: lowBlue, fontSize: 2});
        this.choice1BtnTile = new Hp.page.Tile("choice1.btn", {x: 5, y: 5, w: 6, h: 10}, choice1BtnDrawing);
        this.choice1TitleTile = new Hp.page.Tile("choice1.text", {x: 5, y: 7, w: 6, h: 6}, choice1TitleDrawing);
        this.choice1SubtitleTile = new Hp.page.Tile("choice2.subtitle", {x: 5, y: 11, w: 6, h: 1}, choice1SubtitleDrawing);

        const choice2BtnDrawing = new Hp.render.CircleDrawing({lineColor: clearColor, fillColor: faintBlue});
        const choice2TitleDrawing = new Hp.render.TextDrawing("NFLX", {color: midBlue, fontSize: 4});
        const choice2SubtitleDrawing = new Hp.render.TextDrawing("Netflix", {color: darkBlue, fontSize: 2});
        this.choice2BtnTile = new Hp.page.Tile("choice2.btn", {x: 14, y: 5, w: 6, h: 10}, choice2BtnDrawing);
        this.choice2TitleTile = new Hp.page.Tile("choice2.title", {x: 14, y: 7, w: 6, h: 6}, choice2TitleDrawing);
        this.choice2SubtitleTile = new Hp.page.Tile("choice2.subtitle", {x: 14, y: 11, w: 6, h: 1}, choice2SubtitleDrawing);

        // Adding the timer:
        const timerDrawing = new Hp.render.TextDrawing("60", {color: midBlue, fontSize: 4});
        this.timerTile = new Hp.page.Tile("timer", {x: 11, y: 1, w: 2, h: 2}, timerDrawing);
        const secLeftDrawing = new Hp.render.TextDrawing("seconds left", {color: skyBlue, fontSize: 2});
        this.secLeftTile = new Hp.page.Tile("secLeft", {x: 10, y: 3, w: 4, h: 1}, secLeftDrawing);

        // Adding event handlers:
        self.logoTile.events.click     = function () { document.getElementById("whale-link").click(); };
        self.logoTile.events.hover_on  = function () { self.logoTile.drawing.color = highBlue; };
        self.logoTile.events.hover_off = function () { self.logoTile.drawing.color = midBlue; };

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
