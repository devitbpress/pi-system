from flask import Flask
from app.view import bp_view
from app.api import bp_api

app = Flask(__name__)

# Register blueprint
app.register_blueprint(bp_view)
app.register_blueprint(bp_api)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=False)
