from .player import Player


class Room(object):
    def __init__(self, room_id, game):
        super().__init__()
        self.id = room_id
        self.game = game
        self.player_list = []

    def add_player(self):
        player = Player(self, len(self.player_list))
        self.player_list.append(player)
