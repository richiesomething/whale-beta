from .player import Player
from .common import result


class Room(object):
    def __init__(self, player_ctor, room_id, game):
        super().__init__()
        self.player_ctor = player_ctor
        self.id = room_id
        self.game = game
        self.player_list = []

        assert issubclass(self.player_ctor, Player)

    def add_player(self):
        player = self.player_ctor(self, len(self.player_list))
        self.player_list.append(player)
        return player.index

    def get_player(self, player_index):
        return self.player_list[player_index]

    def handle_event(self, player_id, event_name, client_mono_time_sec, event_data):
        return result({"reason": f"No handler exists for an event '{event_name}'. This is a server error."}, ok=False)
