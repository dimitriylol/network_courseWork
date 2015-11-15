from flask import Flask
from flask import render_template


class CourceWork:
    def __init__(self):
        app = Flask(__name__, static_url_path='')
        network = GlobalNetwork()


@CourceWork.app.route('/')
def hello_world():
    return render_template('index.html')


if __name__ == '__main__':
    app.debug = True
    app.run()
