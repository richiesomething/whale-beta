import json


def result(data_dict, ok=True):
    return json.dumps({"ok": ok, "data": data_dict})
