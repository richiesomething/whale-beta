Whale = {};

const clearColor = "#00000000";
const darkGray = "#aaa";
const darkBlue = "#2e3192";
const lowBlue = "#2e3192";
const midBlue = "#3fa9f5";
const highBlue = "#6fc9ff";
const skyBlue = "#bddff6";
const faintBlue = "#d0eeff";
const warmPeach = "#fafafa";
const white = "#fff";
const black = "#000";

Whale.start = function () {
    try {
        Hp.init(document.getElementById("whale-canvas"));
        Hp.net.send(
            "start", {},
            function (success, response) {
                if (!success) {
                    throw new Hp.Error("Failed to contact the server. Is your internet connection faulty?");
                }
                Hp.currentPage(new Whale.GamePage(response["game_duration_sec"], response["choices"]));
                Hp.start();
            }
        );
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

        const welcomeDrawing = new Hp.render.TextDrawing("Welcome to Whale!", {color: darkBlue, fontSize: 4});
        self.welcomeTile = new Hp.page.Tile("welcome", {x: 1, y: 1, w: 2, h: 1}, welcomeDrawing);

        const text = "Whale is a game about shares. When companies need to raise money, they may sell portions of " +
                     "themselves, or 'shares', to the public. These 'shareholders' are entitled to a share of the " +
                     "company's future earnings and a say in its important decisions. They are also entitled to " +
                     "sell their shares to others.\n" +
                     "Healthy companies' shares generate more money, so they are in higher demand, and thus " +
                     "command a higher price in the market. Shareholders around the world place careful bets every " +
                     "day, speculating about the prices of shares by tracking the news.\n" +
                     "Whale keeps you on the pulse of these companies' shares in a fun and engaging way.\n" +
                     "Ready?";
        const textDrawing = new Hp.render.TextBlockDrawing(text, {color: black, fontSize: 1.25, fontName: "Times New Roman", lineHeight: 40});
        self.textTile = new Hp.page.Tile("text", {x: 1, y: 3, w: 2, h: 6}, textDrawing);

        const startTextDrawing = new Hp.render.TextDrawing("Loading...", {color: white, fontSize: 2});
        const startBtnDrawing = new Hp.render.BoxDrawing({fillColor: darkGray});
        self.startTextTile = new Hp.page.Tile("start.text", {x: 1, y: 9, w: 2, h: 2}, startTextDrawing);
        self.startBtnTile = new Hp.page.Tile("start.btn", {x: 1, y: 9, w: 2, h: 2}, startBtnDrawing);
    }

    load() {
        super.load();
        this.addTopTile(this.welcomeTile);
        this.addTopTile(this.textTile);

        this.addTopTile(this.startBtnTile);
        this.addTopTile(this.startTextTile);
    }

    unload() {
        super.unload();
        this.remAllTiles();
    }
};

Whale.GamePage = class extends Hp.page.Page {
    constructor(gameDurationSec, choices) {
        super("Whale.GamePage", "#ffffff", {x: 24, y: 24});
        const self = this;

        self.gameDurationSec = gameDurationSec;
        self.timeRemainingSec = self.gameDurationSec;
        self.choices = choices;
        self.iChoice = 0;

        self.ended = false;
        self.score = 0;
        self.awardPerCorrect = 100;

        self.iDialogue = 0;
        self.correctDialogueChoices = [
            "Well done! Here's another.",
            "Nice. Here's one more!"
        ];
        self.incorrectDialogueChoices = [
            "Oops! Try another one.",
            "Nope. Don't sweat it! Keep going!"
        ];

        function helpClickChoice(selectedChoiceIndex) {
            if (self.ended) {
                return
            }

            Hp.net.send("choice", {choice_index: self.iChoice, selected_choice: selectedChoiceIndex});

            // Checking if the choice was correct, and updating the score accordingly:
            self.iDialogue++;
            console.log(self.choices);
            const choicePair = self.choices[self.iChoice];
            const otherChoiceIndex = (selectedChoiceIndex + 1) % 2;
            if (choicePair[selectedChoiceIndex]["d_cents_pc"] > choicePair[otherChoiceIndex]["d_cents_pc"]) {
                // Correct!
                const dialogueIx = self.iDialogue % self.correctDialogueChoices.length;
                self.speechTextTile.drawing.text = self.correctDialogueChoices[dialogueIx];

                self.score += self.awardPerCorrect;
                self.scoreTile.drawing.text = "Score: " + self.score.toString();
            } else {
                const dialogueIx = self.iDialogue % self.incorrectDialogueChoices.length;
                self.speechTextTile.drawing.text = self.incorrectDialogueChoices[dialogueIx];
            }

            // Playing audio:
            Hp.audio.start(self.dropAudio);

            // Changing the text to the next two stocks:
            self.loadNextChoice();
        }
        function clickChoice1(selectedChoiceIndex) { helpClickChoice(0, selectedChoiceIndex); }
        function clickChoice2(selectedChoiceIndex) { helpClickChoice(1, selectedChoiceIndex); }

        // Drawing the mascot:
        const mascotImg = Hp.assets.image("mascot");
        const mascotDrawing = new Hp.render.FrameDrawing(mascotImg);
        this.mascotTile = new Hp.page.Tile("mascot", {x: 19, y: 18, w: 4, h: 5}, mascotDrawing);

        const speechBubbleImg = Hp.assets.image("speech-bubble");
        const speechBubbleDrawing = new Hp.render.FrameDrawing(speechBubbleImg);
        this.speechBubbleTile = new Hp.page.Tile("speechBubble", {x: 15, y: 15, w: 7, h: 5}, speechBubbleDrawing);

        const speechTextDrawing = new Hp.render.TextBlockDrawing(
            "Which stock do you think did better yesterday?",
            {color: darkBlue, fontSize: 1, lineHeight: 30, vPadding: 3, hPadding: 20}
        );
        this.speechTextTile = new Hp.page.Tile("speechBubble.text.l1", {x: 15, y: 16, w: 7, h: 2}, speechTextDrawing);

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
        const choice1TitleDrawing = new Hp.render.TextDrawing("CNK", {color: midBlue, fontSize: 2});
        const choice1SubtitleDrawing = new Hp.render.TextDrawing("Cinemark", {color: lowBlue, fontSize: 1});
        this.choice1BtnTile = new Hp.page.Tile("choice1.btn", {x: 5, y: 5, w: 6, h: 10}, choice1BtnDrawing);
        this.choice1TitleTile = new Hp.page.Tile("choice1.text", {x: 5, y: 7, w: 6, h: 6}, choice1TitleDrawing);
        this.choice1SubtitleTile = new Hp.page.Tile("choice2.subtitle", {x: 5, y: 11, w: 6, h: 1}, choice1SubtitleDrawing);

        const choice2BtnDrawing = new Hp.render.CircleDrawing({lineColor: clearColor, fillColor: faintBlue});
        const choice2TitleDrawing = new Hp.render.TextDrawing("NFLX", {color: midBlue, fontSize: 2});
        const choice2SubtitleDrawing = new Hp.render.TextDrawing("Netflix", {color: darkBlue, fontSize: 1});
        this.choice2BtnTile = new Hp.page.Tile("choice2.btn", {x: 14, y: 5, w: 6, h: 10}, choice2BtnDrawing);
        this.choice2TitleTile = new Hp.page.Tile("choice2.title", {x: 14, y: 7, w: 6, h: 6}, choice2TitleDrawing);
        this.choice2SubtitleTile = new Hp.page.Tile("choice2.subtitle", {x: 14, y: 11, w: 6, h: 1}, choice2SubtitleDrawing);

        // Adding the timer:
        const timerDrawing = new Hp.render.TextDrawing(self.timeRemainingSec.toString(), {color: midBlue, fontSize: 4});
        this.timerTile = new Hp.page.Tile("timer", {x: 11, y: 1, w: 2, h: 2}, timerDrawing);
        const secLeftDrawing = new Hp.render.TextDrawing("seconds left", {color: skyBlue, fontSize: 2});
        this.secLeftTile = new Hp.page.Tile("secLeft", {x: 10, y: 3, w: 4, h: 1}, secLeftDrawing);

        // Adding a scoreboard:
        const scoreboardDrawing = new Hp.render.TextDrawing("Score: 0", {color: darkBlue, fontSize: 2});
        this.scoreTile = new Hp.page.Tile("score", {x: 20, y: 1, w: 3, h: 2}, scoreboardDrawing);

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

        // Adding handles for events for game simulation:
        self.timerHandler = null;
    }

    load() {
        super.load();
        this.addTopTile(this.waterWavesTile);
        this.addTopTile(this.waterBodyTile);
        this.addTopTile(this.mascotTile);
        this.addTopTile(this.speechBubbleTile);
        this.addTopTile(this.speechTextTile);

        this.addTopTile(this.logoTile);

        this.addTopTile(this.choice1BtnTile);
        this.addTopTile(this.choice1TitleTile);
        this.addTopTile(this.choice1SubtitleTile);

        this.addTopTile(this.choice2BtnTile);
        this.addTopTile(this.choice2TitleTile);
        this.addTopTile(this.choice2SubtitleTile);

        this.addTopTile(this.timerTile);
        this.addTopTile(this.secLeftTile);

        this.addTopTile(this.scoreTile);

        // Playing both background audio files:
        Hp.audio.startLooped(this.oceanAudio);
        Hp.audio.startLooped(this.tickTickAudio);

        // Starting the timer:
        const self = this;
        const timerUpdateIntervalSec = 1;
        self.timerHandler = setInterval(
            function () {
                if (self.timeRemainingSec === 0) {
                    self.gameOver("time-up")
                } else {
                    self.timeRemainingSec -= timerUpdateIntervalSec;
                    self.timerTile.drawing.text = self.timeRemainingSec.toString()
                }
            },

            // We aren't evil, we're just sure each frame-time is at least 1ms of work. 3:)
            1000.0 * timerUpdateIntervalSec - 1
        );
    }

    unload() {
        super.unload();

        gameOver("interrupted");

        this.remAllTiles();

        Hp.audio.stop(self.oceanAudio);
        Hp.audio.stop(self.tickTickAudio);
    }

    loadNextChoice() {
        const self = this;
        self.iChoice++;
        if (self.iChoice < self.choices.length) {
            const choicePair = self.choices[self.iChoice];
            const c1 = choicePair[0];
            const c2 = choicePair[1];

            self.choice1TitleTile.drawing.text = c1.ticker;
            self.choice1SubtitleTile.drawing.text = c1.name;
            self.choice2TitleTile.drawing.text = c2.ticker;
            self.choice2SubtitleTile.drawing.text = c2.name;
        } else {
            self.gameOver("out-of-stocks");
        }
    }

    gameOver(reason) {
        const self = this;
        console.log("Game over!");

        self.ended = true;

        self.timerTile.drawing.text = "Done!";
        self.secLeftTile.drawing.text = "";

        self.speechTextTile.drawing.text = "All done! You got " + Math.floor(self.score / self.awardPerCorrect) +
                                           " questions right of " + self.choices.length.toString() + ".";

        Hp.audio.stop(self.tickTickAudio);

        if (self.timerHandler !== null) {
            clearInterval(self.timerHandler);
            self.timerHandler = null;
        }
    }
};

document.addEventListener("DOMContentLoaded", Whale.start);
