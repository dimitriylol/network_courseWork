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
        self.fake_gateway_connections()
        for reg_network in self.elements:
            reg_network.set_all_connection()

    def get_random_element_id(self, reg_network_num):
        return self.elements[reg_network_num].get_random_element_id()

    def make_gateway(self):
        id_satellite_network = random.randint(0, 3)
        gateways_elements = [self.get_random_element_id(id_reg_network)
                             for id_reg_network in xrange(self.reg_network_num)]
        self.make_adjustment_connections(id_satellite_network, gateways_elements, satellite=True)
        self.make_adjustment_connections(id_satellite_network - 2, gateways_elements, satellite=False)

    def make_adjustment_connections(self, id_network, gateways_elements, satellite):
        for x in (id_network - 1, id_network):
            id1 = gateways_elements[x]
            id2 = gateways_elements[(x + 1) % self.reg_network_num]
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

    def table_way(self, id_number):
        return json.dumps(self.get_reg_network(id_number).table_of_ways(id_number))

    def fake_gateway_connections(self):
        """
        Add all gateway connections to each regional network.
        It's simplify building table of ways.
        :return: None
        """
        all_connections = reduce(lambda res, network: res + network.connections, self.elements, [])
        for reg_network in self.elements:
            reg_network.set_fake_gateway(all_connections)

    def sequence_sending(self, id_number):
        return json.dumps(self.get_reg_network(id_number).sequence_sending(id_number))

    def get_reg_network(self, id_number):
        for reg_network in self.elements:
            if reg_network.has_element_p(id_number):
                return reg_network

    def sending_message(self, id_number, message_len):
        return json.dumps(self.get_reg_network(id_number).send_message(id_number, message_len))

