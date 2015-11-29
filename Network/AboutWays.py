def connected_p(connection, id_num, sender_dict):
    if connection.source == id_num and connection.target not in sender_dict[id_num]:
        return connection.target
    if connection.target == id_num and connection.source not in sender_dict[id_num]:
        return connection.source
    return False


def connection_information(connection, id_num):
    result = [connected_p(connection, id_num)]
    if result[0]:
        result.append(connection.weight)
    return result


def get_sender_dict(prev_iteration):
    result = {}
    for sender in prev_iteration:
        for receiver in prev_iteration[sender]:
            if receiver in result:
                result[receiver].append(sender)
            else:
                result[receiver] = [sender]
    return result


class AboutWays(object):
    def __init__(self, id_num_start, id_num_end):
        self.set_id = set((x for x in xrange(id_num_start, id_num_end)))
        self.connections = []

    def sequence_sending(self, id_num):
        sequence = [{'init': {id_num: 0}}]
        passed_elements = set()
        while passed_elements.__len__() < self.set_id.__len__():   # maybe wrong
            sequence.append(self.dict_connected_elements(sequence[-1], passed_elements))
            passed_elements.update(set((elem for elem in sequence[-1])))
        return sequence[1:]

    def dict_connected_elements(self, prev_iteration, passed_elements):
        # result must be like this { id_source1: { id_target1: weight1,
        #                                           id_target2: weight2 },
        #                             id_source2: { id_target3: weight3,
        #                                           id_target4: weight4,
        #                                           id_target5: weight5 } }
        iteration = {}
        for prev_sender in prev_iteration:
            for id_num in prev_iteration[prev_sender]:
                if id_num not in passed_elements:
                    iteration[id_num] = self.connected_to(id_num, get_sender_dict(prev_iteration))
        return iteration

    def connected_to(self, id_num, forbidden_elements):
        connections = {}
        for connection in self.connections:
            is_connected = connected_p(connection, id_num, forbidden_elements)
            if is_connected: #and is_connected in self.set_id:
                connections[is_connected] = connection.weight
            # elif is_connected:
            #     connections[is_connected] = self.gateway_weight(id_num, is_connected)
        return connections


