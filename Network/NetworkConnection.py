import json


class NetworkConnection:
    def __init__(self, weight, id1=None, id2=None, type_connection='duplex', satellite=False):
        real_weight = lambda x: weight*3 if x else weight
        self.__weight = real_weight(satellite)
        self.__type_connection = type_connection
        self.__source = id1
        self.__target = id2
        self.__satellite = satellite

    @property
    def source(self):
        return self.__source

    @property
    def target(self):
        return self.__target

    @property
    def weight(self):
        return self.__weight

    def to_json(self):
        return {'source_index': self.__source, 'target_index': self.__target, 'left': False, 'right': False,
                'type': self.__type_connection, 'weight': self.__weight}