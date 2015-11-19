import json
from flask import Flask, jsonify, request
from flask import render_template
from Network.GlobalNetwork import GlobalNetwork


class CourseWork:
    def __init__(self):
        self.app = Flask(__name__, static_url_path='')
        self.network = GlobalNetwork()


course_work = CourseWork()


@course_work.app.route('/globalNetwork', methods=['GET'])
def get_global_network():
    return course_work.network.to_json()


@course_work.app.route('/')
def hello_world():
    return render_template('index.html')


if __name__ == '__main__':
    course_work.app.debug = True
    course_work.app.run()
