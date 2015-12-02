import random
from collections import OrderedDict

import math

from Network.NetworkConnection import NetworkConnection
from Network.NetworkElement import NetworkElement
from Network.AboutWays import AboutWays


def shortest_ways_from_sequence(sequence_sending):
    table_shortest_ways = {}
    for sender_dict in sequence_sending:  # I'm typing this nested loops and crying
        for sender_id in sender_dict:
            for receiver_id in sender_dict[sender_id]:
                if receiver_id not in table_shortest_ways:
                    way = sender_dict[sender_id][receiver_id]
                    if sender_id in table_shortest_ways:
                        way += table_shortest_ways[sender_id]
                    table_shortest_ways[receiver_id] = way
                else:
                    way = table_shortest_ways[sender_id] + sender_dict[sender_id][receiver_id]
                    if way < table_shortest_ways[receiver_id]:
                        table_shortest_ways[receiver_id] = way
    return map(lambda key: (key, table_shortest_ways[key]), table_shortest_ways)


# TODO: refactor this, extract common code from this function and shortest_ways_from_sequence
def min_transit_from_sequence(sequence_sending):
    table_min_transit = {}
    for iteration, sender_dict in enumerate(sequence_sending):
        for sender_id in sender_dict:
            for receiver_id in sender_dict[sender_id]:
                if receiver_id not in table_min_transit:
                    table_min_transit[receiver_id] = iteration + 1
    return map(lambda key: (key, table_min_transit[key]), table_min_transit)


def time_sending(shortest_weight, information_length, message_len, delay=0):
    """
    3000 is max length of packet, that can receive element of network
    :param information_length:
    :param shortest_weight:
    :param message_len:
    :param delay:
    :return:
    """
    print "shortest_weight {0} inf_len {1} mess_len {2}".format(shortest_weight, information_length, message_len)
    package_num = math.ceil(float(message_len) / float(information_length))
    result = package_num * shortest_weight
    print "package_num {0} result {1}".format(package_num, result)
    return result + delay*package_num


class RegionalNetwork:
    def __init__(self, start_id, connections_number=0):
        self.elements_num = 7
        self.about_ways = AboutWays()
        self.fake_gateway_connections = None
        self.connections_weight = (1, 2, 3, 5, 7, 8, 12, 15, 21, 26)
        self.connections_number = connections_number
        self.connections = []
        self.elements = [NetworkElement(x) for x in xrange(start_id, start_id + self.elements_num)]

    def set_connection(self, id1, id2, satellite=False):
        self.connections.append(NetworkConnection(random.choice(self.connections_weight),
                                                  id1, id2, satellite=satellite))
        print "add connection"
        for connect in self.connections:
            print connect.to_json()
        return {'weight': self.connections[-1].weight, 'power': self.connections[-1].power ,
                'type': self.connections[-1].get_type_connection()}

    def get_random_element_id(self):
        return random.choice(self.elements).id_number

    def set_gateway(self, id_num):
        for element in self.elements:
            if element.id_number == id_num:
                element.gateway = True

    def set_all_connection(self):
        # for x in xrange(self.elements_num):
        #     self.connections.append(NetworkConnection(random.choice(self.connections_weight),
        #                                               self.elements[x - 1].id_number,
        #                                               self.elements[x].id_number))
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

    def has_element_p(self, id_number):
        for network_element in self.elements:
            if network_element.id_number == id_number:
                return True
        return False

    def table_of_ways(self, id_start):
        print "table ways, connections"
        for connect in self.connections:
            print connect.to_json()
        sequence_sending = self.sequence_sending(id_start)
        return {'shortest': shortest_ways_from_sequence(sequence_sending),
                'min_transit': min_transit_from_sequence(sequence_sending)}

    def set_fake_gateway(self, connections):
        self.fake_gateway_connections = connections

    def sequence_sending(self, id_start):
        self.about_ways.num_elements = self.elements_num + 3    # because 3 more gateway elements
        self.about_ways.connections = filter(lambda connection: connection.power, self.connections) + \
                                      filter(lambda connection: connection.power, self.fake_gateway_connections)
        return self.about_ways.sequence_sending(id_start)

    def send_message(self, id_number, message_len):
        header_length = 100
        package_length_lst = (1600, 2100, 3100)

        send_table_result = []
        shortest_table = shortest_ways_from_sequence(self.sequence_sending(id_number))

        for pair in shortest_table:
            send_table_result.append({'id': pair[0],
                                      'logical_connection': map(lambda package_length: (package_length,
                                                                                        time_sending(
                                                                                            pair[1],
                                                                                            package_length - header_length,
                                                                                            message_len,
                                                                                            delay=4)),
                                                                package_length_lst),
                                      'datagram_method': map(lambda package_length: (package_length,
                                                                                     time_sending(
                                                                                         pair[1],
                                                                                         package_length - header_length,
                                                                                         message_len)),
                                                             package_length_lst)})
        return {'send_table': send_table_result, 'max_length_packet': 3500}

    def delete_element(self, id_number):
        self.elements = filter(lambda element: not element.is_element_p(id_number), self.elements)
        self.connections = filter(lambda connection: connection.not_connect_id_p(id_number), self.connections)
        self.fake_gateway_connections = filter(lambda connection: connection.not_connect_id_p(id_number),
                                               self.connections)

    def delete_connection(self, source, target):
        self.connections = filter(lambda connection: connection.is_connection_p(source, target), self.connections)

    def add_element(self, id_number):
        self.elements.append(NetworkElement(id_number))
        return {'power': self.elements[-1].power}

    def change_type(self, source, target, connection_type):
        for connection in self.connections:
            if connection.source == source and connection.target == target:
                if connection.type_connection == connection_type:
                    pass
                elif connection_type == 1:
                    connection.type_connection = connection_type
                    connection.weight /= 1.5
                elif connection_type == 1.5:
                    connection.type_connection = connection_type
                    connection.weight *= 1.5
                return {'weight': connection.weight}
        return False

    def power_element(self, id_number, power):
        for element in self.elements:
            if element.id_number == id_number:
                element.power = power
        for connection in self.connections:
            if connection.source == id_number:
                connection.power = power

    def power_connection(self, source, target, power):
        for connection in self.connections:
            if connection.is_connection_p(source, target):
                connection.power = power

