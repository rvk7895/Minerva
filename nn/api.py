from flask import Flask, request
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.text import tokenizer_from_json
from tensorflow.keras.preprocessing.sequence import pad_sequences
import json

app = Flask(__name__)

with open('tokenizer.json') as f:
    data = json.load(f)
    tokenizer = tokenizer_from_json(data)

ann = load_model('model.h5')

MAX_LEN = 118


def hello_world():
    X = [request.json['text']]
    X = tokenizer.texts_to_sequences(X)
    X = pad_sequences(X, maxlen=MAX_LEN)
    score = (1 - ann.predict(X)[0])[0]
    return str(score)
