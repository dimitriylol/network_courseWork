import json


class NetworkElement:
    def __init__(self, ident_number):
        self.__id_number = ident_number
        self.__gateway = False

    @property
    def id_number(self):
        return self.__id_number

    @property
    def gateway(self):
        return self.__gateway

    @gateway.setter
    def set_gateway(self, value=True):
        self.__gateway = value

    def to_json(self):
        return json.dumps({'id': self.__id_number, 'reflexive': self.__gateway})
