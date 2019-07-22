import hp
from enum import Enum, auto

import time
import datetime
import random

import model
import contextlib


server = None
game = None


def init():
    global game, server

    server = hp.Server()
    game = hp.Game("whale", Room)


def route(flask_app):
    server.add_game(flask_app, game)


class Stock(object):
    def __init__(self, ticker, name, close_cents, open_cents):
        super().__init__()
        self.ticker = ticker
        self.name = name
        self.open_cents = open_cents
        self.close_cents = close_cents

    def get_d_cents_pc(self):
        return (self.close_cents - self.open_cents) / self.open_cents if self.open_cents != 0 else 0

    def json(self):
        return {
            "ticker": self.ticker,
            "name": self.name,
            "d_cents_pc": self.get_d_cents_pc()
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
        self.start_server_date_time = None
        self.game_duration_sec = None
        self.generated_questions = None
        self.score = 0

        self.latency_epsilon_sec = 1.0  # The amount of extra time to wait after a game ends for packets.

    def start(self, client_mono_time_sec):
        if self.state != State.NotYetStarted:
            return hp.result({"reason": "The game has already been started."}, ok=False)

        self.state = State.Started

        self.start_client_mono_time_sec = client_mono_time_sec
        self.start_server_mono_time_sec = time.monotonic()
        self.start_server_date_time = datetime.datetime.now()
        self.game_duration_sec = 30.0
        self.generated_questions = gen_stock_data_for_player()

        return hp.result({"game_duration_sec": self.game_duration_sec, "question_list": self.generated_questions})

    def choice(self, client_mono_time_sec, event_data):
        if self.state != State.Started:
            return hp.result({"reason": "The game has not yet been started."}, ok=False)

        if client_mono_time_sec - self.start_client_mono_time_sec >= self.game_duration_sec + self.latency_epsilon_sec:
            self.state = State.Finished
            return hp.result({"reason": "This game has expired"}, ok=False)

        question_index = int(event_data["question_index"])
        if question_index + 1 == len(self.generated_questions):
            self.state = State.Finished

        answer_index = int(event_data["answer_index"])
        choices = self.generated_questions[question_index]
        if choices[answer_index]["d_cents_pc"] > choices[(answer_index + 1) % 2]["d_cents_pc"]:
            score_reward = 100
        else:
            score_reward = 0

        self.score += score_reward
        return hp.result({"score_reward": score_reward})

    def stop(self):
        duration_sec = time.monotonic() - self.start_server_mono_time_sec

        # TODO: Add information about which user this is:
        session_data = {
            "start_datetime": self.start_server_date_time,
            "duration_sec": float(duration_sec),
            "game_id": str(self.game.id)
        }

        with model.db_connect() as model_db_connection:
            with contextlib.closing(model_db_connection.cursor()) as cursor:
                pass
