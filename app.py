from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hindi_learning_v2.db'
db = SQLAlchemy(app)

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(200))
    order = db.Column(db.Integer, nullable=False, unique=True)
    words = db.relationship('Word', backref='lesson', lazy=True)

class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hindi_word = db.Column(db.String(50), nullable=False)
    english_meaning = db.Column(db.String(100), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    level = db.Column(db.Integer, nullable=False) # Assuming level is still relevant per word
    pronunciation = db.Column(db.String(100))
    example_sentence = db.Column(db.String(200))

def add_initial_data():
    # Check if Lesson 1 already exists
    lesson1 = Lesson.query.filter_by(name="Lesson 1: Single Words").first()
    if not lesson1:
        lesson1 = Lesson(name="Lesson 1: Single Words", description="Learn basic single Hindi words.", order=1)
        db.session.add(lesson1)
        db.session.commit() # Commit to get lesson1.id
    else: # Ensure lesson1.id is available if lesson already exists
        db.session.flush() # Ensure lesson1 object has its ID if it was just queried

    # Sample words for Lesson 1 (you can expand this list up to 100)
    sample_words_data = [
        {'hindi_word': 'नमस्ते', 'english_meaning': 'Hello', 'level': 1, 'pronunciation': 'na-mas-te', 'example_sentence': 'नमस्ते, आप कैसे हैं?'},
        {'hindi_word': 'धन्यवाद', 'english_meaning': 'Thank you', 'level': 1, 'pronunciation': 'dhan-ya-vaad', 'example_sentence': 'आपकी मदद के लिए धन्यवाद।'},
        {'hindi_word': 'पानी', 'english_meaning': 'Water', 'level': 1, 'pronunciation': 'paa-ni', 'example_sentence': 'मुझे पानी चाहिए।'},
        {'hindi_word': 'खाना', 'english_meaning': 'Food', 'level': 1, 'pronunciation': 'khaa-na', 'example_sentence': 'खाना स्वादिष्ट है।'},
        {'hindi_word': 'घर', 'english_meaning': 'House', 'level': 1, 'pronunciation': 'ghar', 'example_sentence': 'यह मेरा घर है।'}
        # Add more words here as needed
    ]

    # Add words to Lesson 1 if they don't exist
    # Taking care to associate with the fetched or created lesson1 object
    for word_data in sample_words_data:
        # Check if the word already exists in this lesson to avoid duplicates if script runs multiple times
        existing_word = Word.query.filter_by(hindi_word=word_data['hindi_word'], lesson_id=lesson1.id).first()
        if not existing_word:
            new_word = Word(
                hindi_word=word_data['hindi_word'],
                english_meaning=word_data['english_meaning'],
                lesson_id=lesson1.id,  # Assign to Lesson 1
                level=word_data['level'],
                pronunciation=word_data['pronunciation'],
                example_sentence=word_data['example_sentence']
            )
            db.session.add(new_word)
    db.session.commit()

with app.app_context():
    db.create_all()
    add_initial_data() # Call this function to populate initial data


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/lessons')
def get_lessons():
    lessons = Lesson.query.order_by(Lesson.order).all()
    return jsonify([{
        'id': lesson.id,
        'name': lesson.name,
        'description': lesson.description,
        'order': lesson.order
    } for lesson in lessons])

@app.route('/api/lessons/<int:lesson_id>/words')
def get_words_by_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    # You might want to add .limit(100) if a lesson should strictly have max 100 words displayed at once
    words = Word.query.filter_by(lesson_id=lesson.id).all()
    return jsonify([{
        'id': word.id,
        'hindi_word': word.hindi_word,
        'english_meaning': word.english_meaning,
        'level': word.level,
        'pronunciation': word.pronunciation,
        'example_sentence': word.example_sentence
    } for word in words])

# Optional: If you still want an endpoint to get words by level, independent of lesson
@app.route('/api/words/level/<int:level>')
def get_words_by_level(level):
    words = Word.query.filter_by(level=level).all()
    return jsonify([{
        'id': word.id,
        'hindi_word': word.hindi_word,
        'english_meaning': word.english_meaning,
        'lesson_name': word.lesson.name if word.lesson else None, # Include lesson name
        'pronunciation': word.pronunciation,
        'example_sentence': word.example_sentence
    } for word in words])

if __name__ == '__main__':
    app.run(debug=True)
