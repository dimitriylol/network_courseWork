from flask import Flask
from flask import render_template


class CourseWork:
    def __init__(self):
        self.app = Flask(__name__, static_url_path='')
        # network = GlobalNetwork()

course_work = CourseWork()

@course_work.app.route('/')
def hello_world():
    return render_template('index.html')


if __name__ == '__main__':
    course_work.app.debug = True
    course_work.app.run()
