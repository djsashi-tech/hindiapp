from app import app, db, Word, Category

def populate_database():
    with app.app_context():
        # Create categories
        categories = [
            {'name': 'Numbers', 'description': 'Basic numbers in Hindi'},
            {'name': 'Animals', 'description': 'Common animal names'},
            {'name': 'Colors', 'description': 'Basic colors in Hindi'},
            {'name': 'Greetings', 'description': 'Common greetings and phrases'},
            {'name': 'Family', 'description': 'Family member names'}
        ]

        # Create category objects
        category_map = {}
        for cat_data in categories:
            category = Category(**cat_data)
            db.session.add(category)
            category_map[cat_data['name'].lower()] = category

        # Create words with more information
        words = [
            {
                'hindi_word': 'एक',
                'english_meaning': 'One',
                'category': 'numbers',
                'pronunciation': 'ek',
                'example_sentence': 'मेरे पास एक किताब है।',
                'image_url': 'https://example.com/numbers/one.jpg',
                'level': 1
            },
            {
                'hindi_word': 'दो',
                'english_meaning': 'Two',
                'category': 'numbers',
                'pronunciation': 'do',
                'example_sentence': 'मेरे पास दो सेब हैं।',
                'image_url': 'https://example.com/numbers/two.jpg',
                'level': 1
            },
            {
                'hindi_word': 'बिल्ली',
                'english_meaning': 'Cat',
                'category': 'animals',
                'pronunciation': 'billi',
                'example_sentence': 'बिल्ली दौड़ रही है।',
                'image_url': 'https://example.com/animals/cat.jpg',
                'level': 2
            },
            {
                'hindi_word': 'कुत्ता',
                'english_meaning': 'Dog',
                'category': 'animals',
                'pronunciation': 'kutta',
                'example_sentence': 'कुत्ता खाना खा रहा है।',
                'image_url': 'https://example.com/animals/dog.jpg',
                'level': 2
            },
            {
                'hindi_word': 'लाल',
                'english_meaning': 'Red',
                'category': 'colors',
                'pronunciation': 'laal',
                'example_sentence': 'यह लाल रंग का फूल है।',
                'image_url': 'https://example.com/colors/red.jpg',
                'level': 1
            },
            {
                'hindi_word': 'नीला',
                'english_meaning': 'Blue',
                'category': 'colors',
                'pronunciation': 'neela',
                'example_sentence': 'आसमान नीला है।',
                'image_url': 'https://example.com/colors/blue.jpg',
                'level': 1
            },
            {
                'hindi_word': 'नमस्ते',
                'english_meaning': 'Hello',
                'category': 'greetings',
                'pronunciation': 'namaste',
                'example_sentence': 'नमस्ते! मैं अच्छा हूं।',
                'level': 1
            }
        ]

        # Create word objects with categories
        for word_data in words:
            category = category_map[word_data.pop('category')]
            word = Word(**word_data, category=category)
            db.session.add(word)
        
        db.session.commit()

if __name__ == '__main__':
    populate_database()
