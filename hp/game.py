import uuid

from .room import Room


class Game(object):
    def __init__(self, game_id, room_ctor):
        super().__init__()
        self.id = game_id
        self.room_ctor = room_ctor
        self.room_dict = {}

        assert issubclass(room_ctor, Room)

    def add_room(self):
        # Getting a unique room ID:
        def gen_random_id_str():
            return str(uuid.uuid1()).replace('-', '')

        room_guid = gen_random_id_str()
        while room_guid in self.room_dict:
            room_guid = gen_random_id_str()

        # Adding the room to the game:
        self.room_dict[room_guid] = self.room_ctor(room_guid, self)

        # Returning the room's ID:
        return room_guid

    def get_room(self, room_id):
        return self.room_dict[room_id]

    def add_player(self, room_id):
        room = self.get_room(room_id)
        return room.add_player()

    def handle_event(self, room_id, player_id, event_name, client_mono_time_sec, event_data):
        room = self.get_room(room_id)
        return room.handle_event(player_id, event_name[len(self.id) + 1:], client_mono_time_sec, event_data)
