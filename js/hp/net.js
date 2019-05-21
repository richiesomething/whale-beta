if (typeof Hp === "undefined") {
    Hp = {};
}

Hp.net = {
    serverUrl: null
};

Hp.net._init = function () {
    Hp.net.serverUrl = location.protocol + "//" + document.domain + ":" + location.port + "/hp/" + Hp.gameId;
};

Hp.net.send = function (event, optData, optCallback) {
    const eventName = Hp.gameId + "." + event;
    const xhr = new XMLHttpRequest();
    const message = {
        event: eventName,
        client_mono_time_sec: window.performance.now() / 1000.0,
        room_id: Hp.roomId,
        player_id: Hp.playerId
    };
    if (typeof optData !== "undefined" && Object.keys(optData).length > 0) {
        message.data = optData;
    }
    const dataStr = JSON.stringify(message);

    xhr.open("POST", Hp.net.serverUrl, true);    // Async!
    xhr.send(dataStr);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.ok) {
                optCallback(true, response.data);
            } else {
                optCallback(false, response.data);
            }
        } else {
            optCallback(false, {"reason": "Connection failed."});
        }
    }
};
