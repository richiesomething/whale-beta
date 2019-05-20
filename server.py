import uuid
import flask
import flask_socketio
from enum import Enum, auto

from scheduler import Scheduler, Task

WhaleGameId = "whale"


class WhaleGameState(Enum):
    NotYetStarted = auto()
    Started = auto()
    Finished = auto()


class WhaleRoom(object):
    def __init__(self, socket_io, game_uuid, scheduler):
        super().__init__()
        self.socket_io = socket_io
        self.id = str(game_uuid).replace('-', '')
        self.scheduler = scheduler
        self.time_remaining_sec = 60

        self.state = WhaleGameState.NotYetStarted
        self.tick_task = None

    def start_game(self):
        if self.state != WhaleGameState.NotYetStarted:
            return

        def dec_time():
            if self.time_remaining_sec > 0:
                self.time_remaining_sec -= 1
                self.socket_io.emit(WhaleGameId + ".tick", {"t": self.time_remaining_sec}, room=self.id)
            else:
                self.socket_io.emit(WhaleGameId + ".time_up", room=self.id)
                self.state = WhaleGameState.Finished
                self.scheduler.un_schedule(self.tick_task)

        self.tick_task = Task(1.0, dec_time, run_once=False)    # Runs once per second.
        self.scheduler.schedule(self.tick_task)
        self.state = WhaleGameState.Started


class WhaleRoomManager(object):
    def __init__(self, socket_io):
        self.room_map = {}
        self.socket_io = socket_io
        self.scheduler = Scheduler()

    def add_game(self):
        # Creating and adding the game to the dictionary:
        uid = str(uuid.uuid1())
        while uid in self.room_map:
            uid = str(uuid.uuid1())

        game = WhaleRoom(self.socket_io, uid, self.scheduler)
        self.room_map[game.id] = game

        return game

    def start_game(self, room_id):
        self.room_map[room_id].start_game()


if __name__ == "__main__":
    def main():
        app = flask.Flask(__name__)
        socket_io = flask_socketio.SocketIO(app, async_mode="threading")
        whale_room_manager = WhaleRoomManager(socket_io)

        #
        # Assets:
        #

        @app.route("/")
        def index():
            room = whale_room_manager.add_game()
            return flask.render_template("whale.html", game_id=WhaleGameId, room_id=room.id)

        @app.route("/js/<path:sub_path>")
        def js(sub_path):
            print(sub_path)
            return flask.send_from_directory("js/", sub_path)

        @app.route("/css/<sub_path>")
        def css(sub_path):
            return flask.send_from_directory("css/", sub_path)

        @app.route("/img/<res>/<name>")
        def img(res, name):
            if res == "svg":
                return flask.send_from_directory("img/svg", f"{name}.svg")
            elif res == "x3":
                return flask.send_from_directory("img/x3", f"{name}.png")
            elif res == "x1":
                return flask.send_from_directory("img/x1", f"{name}.png")
            else:
                # Default to 2x resolution.
                return flask.send_from_directory("img/x2", f"{name}.png")

        @app.route("/font/<path:sub_path>")
        def font(sub_path):
            return flask.send_from_directory("font", sub_path)

        @app.route("/audio/<sub_path>")
        def audio(sub_path):
            return flask.send_from_directory("audio/", sub_path)

        #
        # Game (can be moved to a different server for load-balancing!
        #

        @socket_io.on("whale.start_game")
        def start_game(data):
            game_id = data["game_id"]
            room_id = data["room_id"]
            print(f"Connected a user playing '{game_id}' in room '{room_id}'")

            flask_socketio.join_room(room_id)

            if data["game_id"] == WhaleGameId:
                whale_room_manager.start_game(data["room_id"])

        socket_io.run(app)

    main()


# TODO:
#  - Add the speech bubble and text (extract the dialogue icon using InkScape)
#  - Get events (animations) working
#  - Write tickets for what needs to be done.
#  - Build a local timer and interpolate with the server.
#  - Select the right fonts
#  - FACTOR HARPOON INTO MULTIPLE MANAGERS. PLEASE. PLEASE PLEASE PLEASE.
#  - Round out server code based on what Chris has done.

# TODO: Figure out an event system (animation, input)
# TODO: Write a simple asset server.

# TODO: (minor) set fixed font sizes for font objects
# TODO: (minor) add mouse-over functionality, change buttons' colors.
# TODO: (minor) add suffices to denote whether position values are in grid, dip (device independent pixel), or pix form.

# TODO: Get from Aviv:
#  - The image for the speech bubble
