from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from . import db


# def check_if_username_exists(connection, user_name):
#     with contextlib.closing(connection.cursor()) as cursor:
#         cursor.execute("select * from users where user_name=?", (user_name,))
#         return cursor.fetchone() is not None


# def create_user(connection, user_name, email_id, password):
#     password_hash = generate_password_hash(password)

#     with contextlib.closing(connection.cursor()) as cursor:
#         values = (user_name, email_id, password_hash)
#         cursor.execute(
#             "insert into users (user_name, email_id, password_hash) values (?,?,?)", values)

# def add_responses(connection, gender, age, stockq):
#     with contextlib.closing(connection.cursor()) as cursor:
#         values = (gender, age, stockq)
#         cursor.execute(
#             "insert into survey_responses (gender, age, stockq) values (?,?,?)", values)


# def try_login_user(connection, email_id, password):
#     with contextlib.closing(connection.cursor()) as cursor:
#         cursor.execute("select * from users where email_id=?", (email_id,))
#         user_row = cursor.fetchone()
#         if user_row:
#             user_id, user_name, user_email_id, user_password_hash = user_row
#             if check_password_hash(user_password_hash, password):
#                 user = User(user_id, user_name,
#                             user_email_id, user_password_hash)
#                 flask_login.login_user(user)
#                 return True, None
#             else:
#                 return False, f"The password provided was incorrect. Please try again."
#         else:
#             return False, f"No user with the email ID '{email_id}' exists. Consider creating an account instead?"


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    name = db.Column(db.String(200))

    # def get_id(self):
    #     return str(self.id)

    # @staticmethod
    # def get_from_id(user_id_str):
    #     user_id_int = int(user_id_str)
    #     with _db.db_connect() as connection:
    #         with contextlib.closing(connection.cursor()) as cursor:
    #             cursor.execute(
    #                 "select * from users where id=?", (user_id_int,))
    #             user_row = cursor.fetchone()
    #             if user_row:
    #                 user_id, user_name, user_email_id, user_password_hash = user_row
    #                 return User(user_id, user_name, user_email_id, user_password_hash)
    #             else:
    #                 return None
