from flask import Flask, request
from flask import render_template
from Network.GlobalNetwork import GlobalNetwork


class CourseWork:
    def __init__(self):
        self.app = Flask(__name__, static_url_path='')
        self.network = GlobalNetwork()


course_work = CourseWork()

tmp = course_work.network.sequence_sending(0)
print tmp
tmp = course_work.network.table_way(0)
print tmp


@course_work.app.route('/globalNetwork', methods=['GET'])
def get_global_network():
    return course_work.network.to_json()


@course_work.app.route('/tableOfWay', methods=['POST'])
def get_table_network_element():
    id_number = int(request.get_json()['id'])
    return course_work.network.table_way(id_number)


@course_work.app.route('/sequence_sengind', methods=['POST'])
def get_sending_sequence():
    id_number = int(request.get_json()['id'])
    return course_work.network.sequence_sending(id_number)


@course_work.app.route('/')
def hello_world():
    return render_template('index.html')


if __name__ == '__main__':
    course_work.app.debug = True
    course_work.app.run()
