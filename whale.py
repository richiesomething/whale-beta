import hp
from enum import Enum, auto


class Game(hp.Game):
    def __init__(self):
        super().__init__("whale")
        self.state = GameState.NotYetStarted

    def handle_event(self, event_name, event_data):
        if event_name.endswith(".choice"):
            return hp.result(self._handle_choice(event_data))

        return hp.result({"reason": f"Illegal event name: {event_name}"}, ok=False)

    def _handle_choice(self, event_data):
        print("Choice made!")
        return {}


class GameState(Enum):
    NotYetStarted = auto()
    Started = auto()
    Finished = auto()
#
#
# class Room(object):
#     def __init__(self, socket_io, game_uuid, scheduler):
#         super().__init__()
#         self.socket_io = socket_io
#         self.id = str(game_uuid).replace('-', '')
#         self.scheduler = scheduler
#         self.time_remaining_sec = 60
#
#         self.state = GameState.NotYetStarted
#         self.tick_task = None
#
#     def start_game(self):
#         if self.state != GameState.NotYetStarted:
#             return
#
#         def dec_time():
#             if self.time_remaining_sec > 0:
#                 self.time_remaining_sec -= 1
#                 self.socket_io.emit(WhaleGameId + ".tick", {"t": self.time_remaining_sec}, room=self.id)
#             else:
#                 self.socket_io.emit(WhaleGameId + ".time_up", room=self.id)
#                 self.state = WhaleGameState.Finished
#                 self.scheduler.un_schedule(self.tick_task)
#
#         self.tick_task = Task(1.0, dec_time, run_once=False)    # Runs once per second.
#         self.scheduler.schedule(self.tick_task)
#         self.state = WhaleGameState.Started
#
#
# class WhaleRoomManager(object):
#     def __init__(self, socket_io):
#         self.room_map = {}
#         self.player_list = []
#         self.socket_io = socket_io
#         self.scheduler = Scheduler()
#
#     def add_game(self):
#         # Creating and adding the game to the dictionary:
#         uid = str(uuid.uuid1())
#         while uid in self.room_map:
#             uid = str(uuid.uuid1())
#
#         game = WhaleRoom(self.socket_io, uid, self.scheduler)
#         self.room_map[game.id] = game
#
#         return game
#
#     def add_player(self):
#         player_id = len(self.player_list)
#         self.player_list.append(WhalePlayer(player_id))
#         return player_id
#
#     def start_game(self, room_id):
#         self.room_map[room_id].start_game()
#
#
# class WhalePlayer(object):
#     def __init__(self, id):
#         super().__init__()
#         self.id = id

