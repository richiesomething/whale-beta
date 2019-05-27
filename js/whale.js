$(document).ready(
    function () {
        Hp.init($("#whale-canvas").get(0));
        Hp.sendMessage(
            "start", {},
            function (success, response) {
                if (success) {
                    const game = new Whale.Game(response["game_duration_sec"], response["question_list"]);
                    Hp.page = game.page;

                    game.startGame();
                    Hp.start();
                } else {
                    throw new Hp.Error("A server error occurred: " + response.reason);
                }
            }
        );
    }
);

const Whale = {};

Whale.clearBlack = "#00000000";
Whale.clearWhite = "#ffffff00";
Whale.darkGray = "#aaa";
Whale.darkBlue = "#2e3192";
Whale.lowBlue = "#2e3192";
Whale.midBlue = "#3fa9f5";
Whale.highBlue = "#6fc9ff";
Whale.skyBlue = "#bddff6";
Whale.faintBlue = "#d0eeff";
Whale.warmPeach = "#fafafa";
Whale.white = "#fff";
Whale.happyGreen = "#c2e9c2";
Whale.sadRed = "#f8d4d4";
Whale.black = "#000";

Whale.Game = class {
    constructor(gameDurationSec, questionList) {
        const self = this;

        self.page = new Hp.Page("Whale.GamePage", "#fff", {x: 24, y: 24});
        self.tiles = {};

        self.questionList = questionList;
        console.log(self.questionList);

        // Preparing the timer:
        self.gameDurationSec = gameDurationSec;
        self.timeRemainingSec = gameDurationSec;
        self.timerHandler = null;

        // Choice buttons come at the bottom:
        self.tiles.choices = [];

        function addChoice(rect, ticker, name, clickColor) {
            const ci = self.tiles.choices.push({}) - 1;
            const namePrefix = "questionList[" + ci.toString() + "].";

            self.tiles.choices[ci].btn = self.page.addBtnTile(
                namePrefix + "btn",
                rect, {
                    shape: "orb", fillColor: Whale.warmPeach, lineColor: Whale.warmPeach,
                    hover_fillColor: Whale.faintBlue, hover_lineColor: Whale.faintBlue,
                    click_fillColor: clickColor, click_lineColor: clickColor,
                    hover_fadeInDurationSec: 0.096, hover_fadeOutDurationSec: 0.096,
                    click_fadeInDurationSec: 0.080, click_holdColorDurationSec: 0.5,
                    click_fadeOutDurationSec: 0.1
                }
            );
            self.tiles.choices[ci].ticker = self.page.addTxtTile(
                namePrefix + "ticker",
                {x: rect.x, y: rect.y + 2, w: rect.w, h: rect.h - 4},
                ticker,
                {color: Whale.midBlue, fontSize: 2}
            );
            self.tiles.choices[ci].name = self.page.addTxtTile(
                namePrefix + "name",
                {x: rect.x, y: rect.y + 6, w: rect.w, h: 1},
                name,
                {color: Whale.lowBlue, fontSize: 1}
            );

            // Adding a callback for what should be done on 'clicks':
            self.tiles.choices[ci].btn.clickCb = function (tile, clickPos) {
                // Disabling all buttons:
                for (let j = 0; j < self.tiles.choices.length; j++) {
                    self.tiles.choices[j].btn.disabled = true;
                }

                // Playing the sound:
                // TODO: Select a better sound for when the answer is correct.
                const dropSound = Hp.loadAudio("drop");
                Hp.playAudio(dropSound);

                // Sending a message to the server:
                Hp.sendMessage("choice", {question_index: 0, answer_index: ci});

                // Fading the changeChoicesMask in after a delay:
                const delaySec = 0.60;
                setTimeout(
                    function () {
                        self.tiles.changeChoicesMask.fadeIn()
                    }, delaySec * 1000.0
                );
            };
        }

        // FIXME: Load and space out options as required, setting the color accordingly
        addChoice({x: 5, y: 5, w: 6, h: 10}, "", "", Whale.happyGreen);
        addChoice({x: 14, y: 5, w: 6, h: 10}, "", "", Whale.sadRed);

        // The choice tiles are covered by a mask. When the mask is completely active, we load in two new choices and
        // de-activate the mask:
        self.tiles.changeChoicesMask = self.page.addMaskTile(
            "changeChoicesMask",
            {x: 0, y: 0, w: 24, h: 24},
            {fadeInDurationSec: 0.1, fadeOutDurationSec: 0.1}
        );
        self.tiles.changeChoicesMask.onFadeInCompleteCb = function () {
            // Changing the button text according to the questionList we have:
            if (!self.loadNextQuestion()) {
                self.gameOver("qn-over");
            } else {
                // Enabling all buttons:
                for (let j = 0; j < self.tiles.choices.length; j++) {
                    self.tiles.choices[j].btn.disabled = false;
                }
                // Disabling the mask:
                self.tiles.changeChoicesMask.fadeOut();
            }
        };

        // Water:
        self.tiles.water = {};
        self.tiles.water.body = self.page.addBoxTile(
            "water.body",
            {x: 0, y: 18, w: 24, h: 6},
            {lineColor: Whale.skyBlue, fillColor: Whale.skyBlue, lineWidth: 5}
        );
        self.tiles.water.body = self.page.addBoxTile(
            "water.body",
            {x: 0, y: 18, w: 24, h: 6},
            {lineColor: Whale.skyBlue, fillColor: Whale.skyBlue, lineWidth: 5}
        );
        self.tiles.water.waves = self.page.addMarqueeTile(
            "water.waves",
            {x: 0, y: 17, w: 24, h: 1},
            Hp.loadImg("water.waves"),
            {speed: -30}
        );

        // Mascot:
        self.tiles.mascot = {};

        self.tiles.mascot.whale = self.page.addBobTile(
            "mascot.whale",
            {x: 20, y: 19, w: 3, h: 4},
            Hp.loadImg("mascot"),
            {speed: Math.PI / 2, amplitude: 3}
        );
        self.tiles.mascot.bubble = self.page.addFrameTile(
            "mascot.bubble",
            {x: 15, y: 15, w: 7, h: 5},
            Hp.loadImg("speech-bubble")
        );
        self.tiles.mascot.words = self.page.addTxtTile(
            "mascot.words",
            {x: 15, y: 16, w: 7, h: 2},
            "Which stock did better yesterday?",
            {color: Whale.darkBlue, fontSize: 1, lineHeight: 30, vPadding: 3, hPadding: 20}
        );

        // Logo:
        self.tiles.logo = {};
        self.tiles.logo.btn = self.page.addBtnTile(
            "logo.btn",
            {x: 1, y: 1, w: 3, h: 2},
            {shape: "hidden-box"}
        );
        self.tiles.logo.txt = self.page.addTxtTile(
            "logo.txt",
            {x: 1, y: 1, w: 3, h: 2},
            "whale",
            {color: Whale.midBlue, fontSize: 2.5}
        );

        // Timer:
        self.tiles.timer = {};
        self.tiles.timer.count = self.page.addTxtTile(
            "timer.count",
            {x: 11, y: 1, w: 2, h: 2},
            self.timeRemainingSec.toString(),
            {color: Whale.midBlue, fontSize: 4}
        );
        self.tiles.timer.secLeft = self.page.addTxtTile(
            "timer.left",
            {x: 10, y: 3, w: 4, h: 1},
            "seconds left",
            {color: Whale.skyBlue, fontSize: 1.5}
        );

        // Scoreboard:
        self.tiles.score = self.page.addTxtTile(
            "score",
            {x: 20, y: 1, w: 3, h: 2},
            "Score: 0",
            {color: Whale.darkBlue, fontSize: 2}
        );

        // Adding a cover mask for when the game is over:
        self.tiles.gameOverMask = self.page.addMaskTile(
            "gameOverMask",
            {x: 0, y: 0, w: 24, h: 24},
            {fadeInDurationSec: 0.5}
        );

        // Loading in the next question:
        self.currentQuestionIx = -1;
        self.loadNextQuestion();
    }

    loadNextQuestion() {
        const self = this;

        self.currentQuestionIx += 1;
        if (self.currentQuestionIx !== self.questionList.length) {
            const choicePair = self.questionList[self.currentQuestionIx];
            for (let i = 0; i < choicePair.length; i++) {
                self.tiles.choices[i].ticker.text = choicePair[i].ticker;
                self.tiles.choices[i].name.text = choicePair[i].name;

                // TODO: set click-color based on correctness
            }
            return true;
        }
    }

    startGame() {
        // Starting the timer:
        const self = this;
        const timerUpdateIntervalSec = 1;
        self.timerHandler = setInterval(
            function () {
                if (self.timeRemainingSec === 0) {
                    self.gameOver("time-up")
                } else {
                    self.timeRemainingSec -= timerUpdateIntervalSec;
                    self.tiles.timer.count.text = self.timeRemainingSec.toString()
                }
            },

            // We aren't evil, we're just sure each function call is at least 1ms of work. 3:)
            1000.0 * timerUpdateIntervalSec - 1
        );

        // Playing audio:
        self.timerAudio = Hp.loadAudio("tick_tick");
        Hp.playAudioLoop(self.timerAudio);
        const oceanAudio = Hp.loadAudio("ocean");
        Hp.playAudioLoop(oceanAudio);
    }

    gameOver(reason) {
        const self = this;
        console.log("Game over: " + reason);

        Hp.stopAudio(self.timerAudio);

        clearInterval(self.timerHandler);
        self.tiles.timer.count.text = "Done!";
        self.tiles.timer.secLeft.text = "";

        self.tiles.changeChoicesMask.onFadeInCompleteCb = null;
        self.tiles.changeChoicesMask.fadeIn();

        // Fading in the final mask after 2 seconds of waiting
        setTimeout(
            function () {
                self.tiles.gameOverMask.fadeIn()
            }, 500.0
        );
    }
};
