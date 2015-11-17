import json
import random
from Network.RegionalNetwork import RegionalNetwork


def get_all_connections_number(reg_network, average_level, element_in_network):
    res = []
    connections_number = reg_network * average_level * element_in_network
    max_connections = element_in_network * (element_in_network - 1) / 2
    while connections_number > max_connections:
        res = []
        connections_number = int(reg_network * average_level * element_in_network)
        for x in xrange(reg_network - 1):
            num_in_reg_network = random.randint(element_in_network, max_connections)
            res.append(num_in_reg_network)
            connections_number -= num_in_reg_network
        res.append(connections_number)
    return res


class GlobalNetwork():
    def __init__(self):
        self.reg_network_num = 4
        connections_number = get_all_connections_number(self.reg_network_num, average_level=2.5, element_in_network=7)
        self.elements = [RegionalNetwork(x * 7, connections_number[x]) for x in xrange(self.reg_network_num)]
        self.make_gateway()
        for reg_network in self.elements:
            reg_network.set_all_connection()

    def get_random_element_id(self, reg_network_num):
        return self.elements[reg_network_num].get_random_element_id()

    def make_gateway(self):
        id_satellite_network = random.randint(0, 3)
        self.make_adjustment_connections(id_satellite_network, satellite=True)
        self.make_adjustment_connections(id_satellite_network - 2, satellite=False)

    def make_adjustment_connections(self, id_network, satellite):
        for x in (id_network - 1, id_network):
            id1 = self.get_random_element_id(x)
            id2 = self.get_random_element_id((x + 1) % self.reg_network_num)
            self.elements[x].set_gateway(id1)
            self.elements[(x + 1) % self.reg_network_num].set_gateway(id2)
            self.elements[x].set_connection(id1, id2, satellite)

    def reduce_lst(self, func_getting_lst):
        return reduce(lambda lst1, lst2: lst1 + lst2,
                      map(lambda reg_network: getattr(reg_network, func_getting_lst)(), self.elements),
                      [])

    def to_json(self):
        return json.dumps({'nodes': self.reduce_lst('elements2json'),
                           'links': self.reduce_lst('links2json')})
