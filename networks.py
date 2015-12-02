from flask import Flask, request
from flask import render_template
from Network.GlobalNetwork import GlobalNetwork


class CourseWork:
    def __init__(self):
        self.app = Flask(__name__, static_url_path='')
        self.network = GlobalNetwork()


course_work = CourseWork()


# print course_work.network.sequence_sending(13)
# print course_work.network.change_type(0, 1, 'half-duplex')


@course_work.app.route('/globalNetwork', methods=['GET'])
def get_global_network():
    return course_work.network.to_json()


@course_work.app.route('/tableOfWay', methods=['POST'])
def get_table_network_element():
    id_number = int(request.get_json()['id'])
    return course_work.network.table_way(id_number)


@course_work.app.route('/sequenceSending', methods=['POST'])
def get_sending_sequence():
    id_number = int(request.get_json()['id'])
    return course_work.network.sequence_sending(id_number)


@course_work.app.route('/sendMessage', methods=['POST'])
def get_table_sending_message():
    request_result = request.get_json()
    return course_work.network.sending_message(int(request_result['id']),
                                               int(request_result['message_len']))


@course_work.app.route('/propertyElement', methods=['POST'])
def power_element():
    """
    :return: JSON {'result': 'OK'}
    """
    request_result = request.get_json()
    return course_work.network.power_element(int(request_result['id1']), request_result['power'])


@course_work.app.route('/propertiesConnection', methods=['POST'])
def power_connection():
    """
    :return: JSON {'result': 'OK'}
    """
    json_request = request.get_json()
    return course_work.network.properties_connection(json_request)


@course_work.app.route('/addElement', methods=['POST'])
def add_element():
    """
    :return: JSON {'result': 'OK'}
    """
    print "addElement {0}".format(request.get_json())
    return course_work.network.add_element(int(request.get_json()['id']))


@course_work.app.route('/addConnection', methods=['POST'])
def add_connection():
    """
    :return: JSON {'result': 'OK'}
    """
    print "addConnection {0}".format(request.get_json())
    print "source {0} target {1}".format(int(request.get_json()['source']), int(request.get_json()['target']))
    return course_work.network.add_connection(int(request.get_json()['source']), int(request.get_json()['target']))


@course_work.app.route('/')
def hello_world():
    return render_template('index.html')


if __name__ == '__main__':
    course_work.app.debug = True
    course_work.app.run()
