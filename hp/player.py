class Player(object):
    def __init__(self, room, player_index):
        super().__init__()
        self.room = room
        self.index = player_index

    @property
    def game(self):
        return self.room.game
