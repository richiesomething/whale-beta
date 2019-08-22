import flask
import json

from .common import result


class Server(object):
    def __init__(self):
        super().__init__()
        self.game_map = {}

    def add_game(self, flask_app, game):
        # Adding the game to the game map:
        if game.id in self.game_map:
            return False
        self.game_map[game.id] = game

        # Registering a server hook for the client:
        game_url = "/hp/" + game.id
        game_endpoint = "_hp_endpoint_" + game.id

        def game_view_func():
            if flask.request.method == "POST":
                data = json.loads(flask.request.data.decode("utf-8"))
                return game.handle_event(
                    data["room_id"],
                    int(data["player_id"]),
                    data["event"],
                    float(data["client_mono_time_sec"]),
                    data.get("data", None)
                )
            else:
                return result({"reason": f"Invalid request HTTP method: '{flask.request.method}'"}, ok=False)

        flask_app.add_url_rule(game_url, endpoint=game_endpoint, methods=["POST"], view_func=game_view_func)
        return True

