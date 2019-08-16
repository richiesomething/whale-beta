from ._db import db_connect

import contextlib


#
# Game sessions-- measuring how long players play each of our games for at a stretch.
#

def post_game_session_info(game_id, start_datetime, duration_sec, user_id):
    # TODO: Procure user_ids so we can link against the 'users' table.
    # TODO: Add client time!
    # TODO: Ensure datetime is stored in UTC.
    with db_connect() as model_db_connection:
        with contextlib.closing(model_db_connection.cursor()) as cursor:
          cursor.execute(
                "insert into analytics_sessions (game_id, start_server_date_time, duration_sec, user_id) "
                "values (?,?,?,?)",
                (game_id, str(start_datetime), duration_sec, user_id)
          )


#
#
#
