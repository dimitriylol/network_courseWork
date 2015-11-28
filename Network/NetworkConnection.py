import json


class NetworkConnection:
    def __init__(self, weight, id1=None, id2=None, type_connection='duplex', satellite=False):
        real_weight = lambda x: weight * 3 if x else weight
        self.weight = real_weight(satellite)
        self.type_connection = 1  # 1 is duplex, 1.5 is half-duplex
        self.source = id1
        self.target = id2
        self.satellite = satellite
        self.power = True

    def not_connect_id_p(self, id_number):
        return self.source != id_number and self.target != id_number

    def connect_id_p(self, id_number):
        return self.source == id_number or self.target == id_number

    def is_connection_p(self, source, target):
        return self.source == source and self.target == target or \
               self.source == target and self.target == source

    def get_type_connection(self):
        if self.type_connection == 1:
            return 'duplex'
        return 'half-duplex'

    def to_json(self):
        return json.dumps({'source': self.source, 'target': self.target, 'left': False, 'right': False,
                           'type': self.get_type_connection(), 'weight': self.weight, 'power': self.power})
