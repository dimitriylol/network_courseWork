import random
import json
from Network.NetworkConnection import NetworkConnection
from Network.NetworkElement import NetworkElement


class RegionalNetwork():
    def __init__(self, start_id, connections_number=0):
        self.elements_num = 7
        self.connections_weight = (1, 2, 3, 5, 7, 8, 12, 15, 21, 26)
        self.connections_number = connections_number
        self.connections = []
        self.elements = [NetworkElement(x) for x in xrange(start_id, start_id + self.elements_num)]

    def set_connection(self, id1, id2, satellite=False):
        self.connections.append(NetworkConnection(random.choice(self.connections_weight),
                                                  id1, id2, satellite=satellite))

    def get_random_element_id(self):
        return random.choice(self.elements).id_number

    def set_gateway(self, id_num):
        for element in self.elements:
            if element.id_number == id_num:
                element.gateway = True

    def set_all_connection(self):
        for x in xrange(self.elements_num):
            self.connections.append(NetworkConnection(random.choice(self.connections_weight),
                                                      self.elements[x - 1].id_number,
                                                      self.elements[x].id_number))
        while self.connections.__len__() < self.connections_number:
            id1 = self.get_random_element_id()
            id2 = self.get_random_element_id()
            while id1 == id2 or self.is_connected(id1, id2):
                id1 = self.get_random_element_id()
                id2 = self.get_random_element_id()
            self.set_connection(id1, id2)

    def is_connected(self, id1, id2):
        # tmp = filter(lambda connection: True if (connection.source == id1 and connection.target == id2 or
        #                                          connection.source == id2 and connection.target == id1) else None,
        #              self.connections)
        return filter(lambda connection: True if (connection.source == id1 and connection.target == id2 or
                                                  connection.source == id2 and connection.target == id1) else None,
                      self.connections).__len__() == 1

    def attr2json(self, attr):
        return map(lambda element: element.to_json(), getattr(self, attr))

    def elements2json(self):
        return self.attr2json('elements')

    def links2json(self):
        return self.attr2json('connections')

    def index_by_id(self, id_number):
        for index, element in enumerate(self.elements):
            if element.id_number == id_number:
                break
        else:
            index = -1
        return index

    # def id2index(self, connection_dict):
    #     connection_dict['source'] %= self.elements_num
    #     # self.index_by_id(id_number = connection_dict['source'])
    #     connection_dict['target'] %= self.elements_num
    #     # self.index_by_id(id_number = connection_dict['target'])
    #     return connection_dict