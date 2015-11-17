import json


class NetworkConnection:
    def __init__(self, weight, id1=None, id2=None, type_connection='duplex', satellite=False):
        real_weight = lambda x: weight * 3 if x else weight
        self.weight = real_weight(satellite)
        self.type_connection = type_connection
        self.source = id1
        self.target = id2
        self.satellite = satellite

    def to_json(self):
        return json.dumps({'source': self.source, 'target': self.target, 'left': False, 'right': False,
                           'type': self.type_connection, 'weight': self.weight})
