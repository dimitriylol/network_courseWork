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
        self.fake_gateway_connections = None
        self.set_fake_gateway_connections()
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

    def set_fake_gateway_connections(self):
        """
        Add all gateway connections to each regional network.
        It's simplify building table of ways.
        :return: None
        """
        self.fake_gateway_connections = reduce(lambda res, network: res + network.connections, self.elements, [])
        for reg_network in self.elements:
            reg_network.set_fake_gateway(self.fake_gateway_connections)

    def sequence_sending(self, id_number):
        return json.dumps(self.get_reg_network(id_number).sequence_sending(id_number))

    def get_reg_network(self, id_number):
        for reg_network in self.elements:
            if reg_network.has_element_p(id_number):
                return reg_network

    def sending_message(self, id_number, message_len):
        return json.dumps(self.get_reg_network(id_number).send_message(id_number, message_len))

    def power_element(self, id_number, power):
        for reg_network in self.elements:
            reg_network.power_element(id_number, power)
        return json.dumps({'result': 'OK'})

    def power_connection(self, source, target, power):
        for reg_network in self.elements:
            reg_network.power_connection(source, target, power)
        return {'connection_changed': 'OK'}

    def add_connection(self, source, target):
        print "source {0}".format(source)
        print "target {0}".format(target)
        number_source = self.elements.index(self.get_reg_network(source))
        number_target = self.elements.index(self.get_reg_network(target))
        print "source {0} target {0}".format(number_source, number_target)
        add_to_network = self.choose_not_last(number_source, number_target)
        if isinstance(add_to_network, bool):
            if number_source == number_target:
                add_to_network = number_source
            else:
                result = json.dumps(self.elements[source].set_connection(source, target))       # instead source could be target
                self.fake_gateway_connections.append(self.elements[source].connections[-1])
                return result
        print "add_to_network {0}".format(add_to_network)
        return json.dumps(self.elements[add_to_network].set_connection(source, target))

    def add_element(self, id_number):
        self.elements[-1].add_element(id_number)
        return json.dumps({'result': 'OK'})

    def change_type(self, source, target, connection_type):
        connect_type = connection_type == 'duplex' and 1 or 1.5
        for reg_network in self.elements:
            tmp = reg_network.change_type(source, target, connect_type)
            if tmp:
                return tmp

    def properties_connection(self, json_request):
        return json.dumps(dict(self.power_connection(int(json_request['id1']), int(json_request['id2']),
                                                     json_request['power']),
                               **self.change_type(int(json_request['id1']), int(json_request['id2']),
                                                  json_request['type'])))

    def choose_not_last(self, number_source, number_target):
        return number_target == self.reg_network_num - 1 and number_source or \
               number_source == self.reg_network_num - 1 and number_target
