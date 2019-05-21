import uuid

from .room import Room


class Game(object):
    def __init__(self, game_id):
        super().__init__()
        self.id = game_id
        self.room_dict = {}

    def add_room(self):
        # Getting a unique room ID:
        def gen_random_id_str():
            return str(uuid.uuid1()).replace('-', '')

        room_guid = gen_random_id_str()
        while room_guid in self.room_dict:
            room_guid = gen_random_id_str()

        # Adding the room to the game:
        self.room_dict[room_guid] = Room(room_guid, self)

        # Returning the room's ID:
        return room_guid

    def add_player(self, room_id):
        room = self.room_dict[room_id]
        return room.add_player()
