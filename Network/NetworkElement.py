import json


class NetworkElement:
    def __init__(self, ident_number):
        self.id_number = ident_number
        self.gateway = False
        self.power = True

    def is_element_p(self, id_number):
        return self.id_number == id_number

    def to_json(self):
        return json.dumps({'id': self.id_number, 'reflexive': self.gateway, 'power': self.power})