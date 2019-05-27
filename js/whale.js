$(document).ready(
    function () {
        Hp.init($("#whale-canvas").get(0));
        Hp.sendMessage(
            "start", {},
            function (success, response) {
                if (success) {
                    Hp.page = new Whale.newGamePage(response["game_duration_sec"], response["choices"]);
                    Hp.start();
                } else {
                    throw new Hp.Error("A server error occurred: " + response.reason);
                }
            }
        );
    }
);

const Whale = {};

Whale.clearColor = "#00000000";
Whale.darkGray = "#aaa";
Whale.darkBlue = "#2e3192";
Whale.lowBlue = "#2e3192";
Whale.midBlue = "#3fa9f5";
Whale.highBlue = "#6fc9ff";
Whale.skyBlue = "#bddff6";
Whale.faintBlue = "#d0eeff";
Whale.warmPeach = "#fafafa";
Whale.white = "#fff";
Whale.happyGreen = "#a8cea8";
Whale.sadRed = "#e1bdbd";
Whale.black = "#000";

Whale.newGamePage = function (gameDurationSec, choices) {
    const page = new Hp.Page("Whale.GamePage", "#fff", {x: 24, y: 24});
    const tile = {};

    page.gameDurationSec = gameDurationSec;
    page.choices = choices;

    // Water:
    tile.water = {};
    tile.water.body = page.addBoxTile("water.body", {x: 0, y: 18, w: 24, h: 6},
                                      {lineColor: Whale.skyBlue, fillColor: Whale.skyBlue, lineWidth: 5});
    tile.water.body = page.addBoxTile("water.body", {x: 0, y: 18, w: 24, h: 6},
                                      {lineColor: Whale.skyBlue, fillColor: Whale.skyBlue, lineWidth: 5});
    tile.water.waves = page.addMarqueeTile("water.waves", {x: 0, y: 17, w: 24, h: 1}, Hp.loadImg("water.waves"),
                                           {speed: -30});

    // Mascot:
    tile.mascot = {};

    tile.mascot.whale = page.addBobTile("mascot.whale", {x: 20, y: 19, w: 3, h: 4}, Hp.loadImg("mascot"),
                                        {speed: Math.PI / 2, amplitude: 3});
    tile.mascot.bubble = page.addFrameTile("mascot.bubble", {x: 15, y: 15, w: 7, h: 5}, Hp.loadImg("speech-bubble"));
    tile.mascot.words = page.addTxtTile("mascot.words", {x: 15, y: 16, w: 7, h: 2}, "Which stock did better yesterday?",
                                        {color: Whale.darkBlue, fontSize: 1, lineHeight: 30, vPadding: 3, hPadding: 20});

    // Logo:
    tile.logo = {};
    tile.logo.btn = page.addBtnTile("logo.btn", {x: 1, y: 1, w: 3, h: 2}, {shape: "hidden-box"});
    tile.logo.txt = page.addTxtTile("logo.txt", {x: 1, y: 1, w: 3, h: 2}, "whale", {color: Whale.midBlue, fontSize: 2.5});

    // Timer:
    tile.timer = {};
    tile.timer.count = page.addTxtTile("timer.count", {x: 11, y: 1, w: 2, h: 2}, "60",
                                       {color: Whale.midBlue, fontSize: 4});
    tile.timer.secLeft = page.addTxtTile("timer.left", {x: 10, y: 3, w: 4, h: 1}, "seconds left",
                                         {color: Whale.skyBlue, fontSize: 1.5});

    // Scoreboard:
    tile.score = page.addTxtTile("score", {x: 20, y: 1, w: 3, h: 2}, "Score: 0", {color: Whale.darkBlue, fontSize: 2});

    // Buttons:
    tile.choices = [];

    function addChoice(i, rect, ticker, name, clickColor) {
        function clickCb(tile, clickPos) {
            const choiceIndex = i;
            console.log("Selected choice " + i.toString());
        }

        const namePrefix = "choices[" + i.toString() + "].";
        tile.choices[i] = {};
        tile.choices[i].btn = page.addBtnTile(namePrefix + "btn", rect,
                                              {shape: "orb", fillColor: Whale.skyBlue, lineColor: Whale.skyBlue,
                                               hover_fillColor: Whale.warmPeach, hover_lineColor: Whale.warmPeach,
                                               click_fillColor: clickColor, click_lineColor: clickColor,
                                               hover_fadeInDurationSec: 0.080, hover_fadeOutDurationSec: 0.080,
                                               click_fadeInDurationSec: 0.080, click_holdColorDurationSec: 10,
                                               click_fadeOutDurationSec: 1.0});
        tile.choices[i].ticker = page.addTxtTile(namePrefix + "ticker", {x: rect.x, y: rect.y + 2, w: rect.w, h: rect.h - 4},
                                              ticker, {color: Whale.midBlue, fontSize: 2});
        tile.choices[i].name = page.addTxtTile(namePrefix + "name", {x: rect.x, y: rect.y + 6, w: rect.w, h: 1},
                                              name, {color: Whale.lowBlue, fontSize: 1});

        tile.choices[i].btn.clickCb = clickCb;
    }

    addChoice(0, {x: 5,  y: 5, w: 6, h: 10}, "NFLX", "Netflix", Whale.happyGreen);
    addChoice(1, {x: 14, y: 5, w: 6, h: 10}, "CNK", "Cinemark", Whale.sadRed);

    return page;
};
