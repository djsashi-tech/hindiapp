from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/hindi_learning.db'
db = SQLAlchemy(app)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    words = db.relationship('Word', backref='category', lazy=True)

class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hindi_word = db.Column(db.String(50), nullable=False)
    english_meaning = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(200))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    level = db.Column(db.Integer, nullable=False)
    pronunciation = db.Column(db.String(100))
    example_sentence = db.Column(db.String(200))

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/categories')
def get_categories():
    categories = Category.query.all()
    return jsonify([{
        'id': category.id,
        'name': category.name,
        'description': category.description
    } for category in categories])

@app.route('/api/words/<int:level>')
def get_words(level):
    words = Word.query.filter_by(level=level).all()
    return jsonify([{
        'id': word.id,
        'hindi_word': word.hindi_word,
        'english_meaning': word.english_meaning,
        'image_url': word.image_url,
        'category': word.category.name,
        'pronunciation': word.pronunciation,
        'example_sentence': word.example_sentence
    } for word in words])

@app.route('/api/words/category/<int:category_id>')
def get_words_by_category(category_id):
    words = Word.query.filter_by(category_id=category_id).all()
    return jsonify([{
        'id': word.id,
        'hindi_word': word.hindi_word,
        'english_meaning': word.english_meaning,
        'image_url': word.image_url,
        'level': word.level,
        'pronunciation': word.pronunciation,
        'example_sentence': word.example_sentence
    } for word in words])

if __name__ == '__main__':
    app.run(debug=True)
