if (typeof Hp === "undefined") {
    Hp = {};
}

Hp.net = {
    serverUrl: null
};

Hp.net._init = function () {
    Hp.net.serverUrl = location.protocol + "//" + document.domain + ":" + location.port + "/hp/" + Hp.gameId;
};

Hp.net.send = function (event, data) {
    const eventName = Hp.gameId + "." + event;
    const xhr = new XMLHttpRequest();
    const dataStr = JSON.stringify({event: eventName, data: data});
    xhr.open("POST", Hp.net.serverUrl, true);    // Async!
    xhr.send(dataStr);
};
