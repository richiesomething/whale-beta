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
Whale.black = "#000";


Whale.newGamePage = function (gameDurationSec, choices) {
    const page = new Hp.Page("Whale.GamePage", "#fff", {x: 24, y: 24});
    const tile = {};

    page.gameDurationSec = gameDurationSec;
    page.choices = choices;

    // Water:
    tile.water = {};
    tile.water.body = page.pushTile(
        new Hp.BoxTile(
            "water.body", {x: 0, y: 18, w: 24, h: 6},
            {lineColor: Whale.skyBlue, fillColor: Whale.skyBlue, lineWidth: 5}
        )
    );
    tile.water.waves = page.pushTile(
        new Hp.MarqueeTile("water.waves", {x: 0, y: 17, w: 24, h: 1}, Hp.loadImg("water.waves"), {speed: 60})
    );

    return page;
};
