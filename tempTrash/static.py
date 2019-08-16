# TODO: This module's functionality should be shifted to nginx.

import flask


def route(flask_app):

    @flask_app.route("/js/<path:sub_path>")
    def js(sub_path):
        return flask.send_from_directory("js/", sub_path)

    @flask_app.route("/css/<path:sub_path>")
    def css(sub_path):
        return flask.send_from_directory("css/", sub_path)

    @flask_app.route("/img/<res>/<path:name>")
    def img(res, name):
        if res == "svg":
            return flask.send_from_directory("img/svg", f"{name}.svg")
        elif res == "x1":
            return flask.send_from_directory("img/x1", f"{name}.png")
        elif res == "x2":
            return flask.send_from_directory("img/x2", f"{name}.png")
        else:
            # Default to 3x resolution for unknown 'res' strings:
            return flask.send_from_directory("img/x3", f"{name}.png")

    @flask_app.route("/font/<path:sub_path>")
    def font(sub_path):
        return flask.send_from_directory("font", sub_path)

    @flask_app.route("/audio/<path:sub_path>")
    def audio(sub_path):
        return flask.send_from_directory("audio", sub_path + ".ogg")
