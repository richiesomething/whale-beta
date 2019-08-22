import contextlib

import flask_login
from werkzeug.security import generate_password_hash, check_password_hash

from . import _db


def check_if_username_exists(connection, user_name):
    with contextlib.closing(connection.cursor()) as cursor:
        cursor.execute("select * from users where user_name=?", (user_name,))
        return cursor.fetchone() is not None


def create_user(connection, user_name, email_id, password):
    password_hash = generate_password_hash(password)

    with contextlib.closing(connection.cursor()) as cursor:
        values = (user_name, email_id, password_hash)
        cursor.execute(
            "insert into users (user_name, email_id, password_hash) values (?,?,?)", values)


def try_login_user(connection, email_id, password):
    with contextlib.closing(connection.cursor()) as cursor:
        cursor.execute("select * from users where email_id=?", (email_id,))
        user_row = cursor.fetchone()
        if user_row:
            user_id, user_name, user_email_id, user_password_hash = user_row
            if check_password_hash(user_password_hash, password):
                user = User(user_id, user_name,
                            user_email_id, user_password_hash)
                flask_login.login_user(user)
                return True, None
            else:
                return False, f"The password provided was incorrect. Please try again."
        else:
            return False, f"No user with the email ID '{email_id}' exists. Consider creating an account instead?"


class User(flask_login.UserMixin):
    def __init__(self, user_id, user_name, user_email_id, user_password_hash):
        super().__init__()
        self.id = user_id
        self.user_name = user_name
        self.user_email_id = user_email_id
        self.user_password_hash = user_password_hash

    def get_id(self):
        return str(self.id)

    @staticmethod
    def get_from_id(user_id_str):
        user_id_int = int(user_id_str)
        with _db.db_connect() as connection:
            with contextlib.closing(connection.cursor()) as cursor:
                cursor.execute(
                    "select * from users where user_id=?", (user_id_int,))
                user_row = cursor.fetchone()
                if user_row:
                    user_id, user_name, user_email_id, user_password_hash = user_row
                    return User(user_id, user_name, user_email_id, user_password_hash)
                else:
                    return None
