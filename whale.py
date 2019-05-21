import hp
from enum import Enum, auto

import time
import random


class Stock(object):
    def __init__(self, ticker, name, close_cents, open_cents):
        super().__init__()
        self.ticker = ticker
        self.name = name
        self.open_cents = open_cents
        self.close_cents = close_cents

    def json(self):
        return {
            "ticker": self.ticker,
            "name": self.name,
            "d_cents_pc": (self.close_cents - self.open_cents) / self.open_cents if self.open_cents != 0 else 0
        }


stocks = [
    Stock("SBUX", "Starbucks Corp.", 76_66, 78_30),
    Stock("NXPI", "NXP Semiconductors", 92_60, 92_80),
    Stock("FB", "Facebook", 187_72, 181_88),
    Stock("AMZN", "Amazon.com, Inc.", 1858_97, 1852_69),
    Stock("NFLX", "Netflix", 348_11, 351_23),
    Stock("CNK", "Cinemark", 39_23, 39_97),
    Stock("SFIX", "Stitch Fix", 23_34, 22_00),
    Stock("JNJ", "Johnson & Johnson", 138_42, 138_61),
    Stock("BRK.B", "Berkshire Hathaway Class B", 202_73, 202_64),
    Stock("CNC", "Centene Corp.", 55_51, 55_62),
    Stock("AAPL", "Apple", 183_09, 183_52),
    Stock("SFM", "Sprouts Farmers Market Inc.", 20_74, 20_89),
    Stock("DWDP", "DowDuPont", 31_03, 30_63),
    Stock("SNE", "Sony Corp.", 52_20, 52_54),
    Stock("ORCL", "Oracle Corp.", 53_66, 53_95),
    Stock("MSFT", "Microsoft Corp.", 126_22, 126_52),
    Stock("WMT", "Walmark Inc.", 101_52, 100_39),
    Stock("INTU", "Intuit Inc.", 243_69, 242_67),
    Stock("INTC", "Intel Corp.", 43_56, 44_00),
    Stock("HTZ", "Hertz Global Holdings, Inc.", 16_01, 16_11)
]


def gen_stock_data_for_player():
    shuffled_stocks = list(map(lambda stock: stock.json(), stocks))
    random.shuffle(shuffled_stocks)

    if len(shuffled_stocks) % 2 != 0:
        shuffled_stocks.pop()

    return list(zip(shuffled_stocks[:len(shuffled_stocks) // 2], shuffled_stocks[len(shuffled_stocks)//2:]))


class GameState(Enum):
    NotYetStarted = auto()
    Started = auto()
    Finished = auto()


class Room(hp.Room):
    def __init__(self, room_guid, game):
        super().__init__(Player, room_guid, game)

    def handle_event(self, player_id, event_name, client_mono_time_sec, event_data):
        return {
            "start": lambda: self.handle_start_event(player_id, client_mono_time_sec),
            "choice": lambda: self.handle_choice_event(player_id, client_mono_time_sec, event_data)
        }[event_name]()

    def handle_start_event(self, player_index, client_mono_time_sec):
        player = self.get_player(player_index)
        return player.start(client_mono_time_sec)

    def handle_choice_event(self, player_index, client_mono_time_sec, event_data):
        player = self.get_player(player_index)
        return player.choice(client_mono_time_sec, event_data)


class State(Enum):
    NotYetStarted = auto()
    Started = auto()
    Finished = auto()


class Player(hp.Player):
    def __init__(self, room, player_index):
        super().__init__(room, player_index)
        self.state = State.NotYetStarted
        self.start_client_mono_time_sec = None
        self.start_server_mono_time_sec = None
        self.game_duration_sec = None
        self.generated_choices = None

    def start(self, client_mono_time_sec):
        if self.state != State.NotYetStarted:
            return hp.result({"reason": "The game has already been started."}, ok=False)

        self.start_client_mono_time_sec = client_mono_time_sec
        self.start_server_mono_time_sec = time.monotonic()
        self.game_duration_sec = 100.0
        self.generated_choices = gen_stock_data_for_player()

        return hp.result({"game_duration_sec": self.game_duration_sec, "choices": self.generated_choices})

    def choice(self, client_mono_time_sec, event_data):
        pass


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

