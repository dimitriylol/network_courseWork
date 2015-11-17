import json


class NetworkElement:
    def __init__(self, ident_number):
        self.id_number = ident_number
        self.gateway = False

    def to_json(self):
        return json.dumps({'id': self.id_number, 'reflexive': self.gateway})