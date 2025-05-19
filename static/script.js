document.addEventListener('DOMContentLoaded', () => {
    // Speech Recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false; // Process single utterance
        recognition.lang = 'hi-IN';      // Set language to Hindi
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
    } else {
        console.warn('Speech Recognition API not supported in this browser.');
    }

    const categoryTabsContainer = document.getElementById('categoryTabs');
    const currentCategoryNameEl = document.getElementById('currentCategoryName');
    const hindiWordEl = document.getElementById('hindiWord');
    const englishMeaningEl = document.getElementById('englishMeaning');
    const pronunciationBtn = document.getElementById('pronunciationBtn');

    const exampleSentenceEl = document.getElementById('exampleSentence');
    const prevWordBtn = document.getElementById('prevWordBtn');
    const nextWordBtn = document.getElementById('nextWordBtn');
    const speakWordBtn = document.getElementById('speakWordBtn');
    const speechFeedbackEl = document.getElementById('speechFeedback');

    // Login elements
    const loginSection = document.getElementById('loginSection');
    const learningContent = document.getElementById('learningContent');
    const loginForm = document.getElementById('loginForm');
    const userNameEl = document.getElementById('userName');
    const welcomeMessageEl = document.createElement('p'); // For displaying welcome message
    welcomeMessageEl.className = 'text-center lead my-3';

    let loggedInUser = null;
    let categories = [];
    let currentWordsList = [];
    let currentWordIndex = 0;
    let activeCategoryId = null;

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = userNameEl.value.trim();
        if (name) {
            loggedInUser = name;
            loginSection.style.display = 'none';
            learningContent.style.display = 'block';
            // Insert welcome message before category name or somewhere prominent
            const wordDisplayCardHeader = document.querySelector('#wordDisplayCard .card-header');
            if (wordDisplayCardHeader) {
                welcomeMessageEl.textContent = `Welcome, ${loggedInUser}! Select a category to start.`;
                wordDisplayCardHeader.parentNode.insertBefore(welcomeMessageEl, wordDisplayCardHeader);
            }
            await loadCategories();
        } else {
            // Optionally, show an error if name is empty
            alert('Please enter your name.');
        }
    });

    // Fetch and display categories
    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            let fetchedCategories = await response.json();

            // De-duplicate categories by name
            const uniqueCategoryNames = new Set();
            const uniqueCategoriesResult = []; // Use a new array to store unique categories
            fetchedCategories.forEach(category => { // Iterate through all fetched categories
                if (!uniqueCategoryNames.has(category.name)) { // Check if name is already seen
                    uniqueCategoryNames.add(category.name); // Add name to set
                    uniqueCategoriesResult.push(category); // Add the category object to our results
                }
            });
            categories = uniqueCategoriesResult; // Update the global 'categories' array

            renderCategoryTabs();
            if (categories.length > 0) {
                currentCategoryNameEl.textContent = 'Select a category to start.';
            } else {
                currentCategoryNameEl.textContent = 'No categories available.';
            }
        } catch (error) { // Corrected: removed space before catch
            console.error('Error loading categories:', error);
            currentCategoryNameEl.textContent = 'Error loading categories.';
        }
    }

    function renderCategoryTabs() {
        categoryTabsContainer.innerHTML = ''; // Clear existing tabs
        if (categories.length === 0 && loggedInUser) { // Check if loggedInUser to avoid message before login
            categoryTabsContainer.innerHTML = '<li class="nav-item"><span class="nav-link text-muted">No categories found.</span></li>';
            return;
        }
        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            const a = document.createElement('a');
            a.className = 'nav-link';
            a.href = '#';
            a.textContent = category.name;
            a.setAttribute('data-category-id', category.id);
            a.setAttribute('data-category-name', category.name);
            if (category.id === activeCategoryId) {
                a.classList.add('active');
            }
            a.addEventListener('click', (e) => {
                e.preventDefault();
                selectCategory(category.id, category.name);
            });
            li.appendChild(a);
            categoryTabsContainer.appendChild(li);
        });
    }

    async function selectCategory(categoryId, categoryName) {
        activeCategoryId = categoryId;
        currentCategoryNameEl.textContent = categoryName;
        if(welcomeMessageEl && welcomeMessageEl.parentNode) {
            welcomeMessageEl.style.display = 'none'; // Hide welcome message once a category is selected
        }
        hindiWordEl.textContent = '';
        englishMeaningEl.textContent = 'Loading words...';
        exampleSentenceEl.textContent = '';
        pronunciationBtn.disabled = true;
        if (speakWordBtn) speakWordBtn.disabled = true;
        prevWordBtn.disabled = true;
        nextWordBtn.disabled = true;
        if (speechFeedbackEl) speechFeedbackEl.textContent = '';
        currentWordsList = [];
        currentWordIndex = 0;
        renderCategoryTabs(); // Re-render to update active tab

        try {
            const response = await fetch(`/api/words/category/${categoryId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            currentWordsList = await response.json();
            if (currentWordsList.length > 0) {
                displayCurrentWord();
            } else {
                englishMeaningEl.textContent = 'No words found in this category.';
            }
        } catch (error) {
            console.error(`Error loading words for category ${categoryName}:`, error);
            englishMeaningEl.textContent = 'Error loading words.';
        }
    }

    function displayCurrentWord() {
        if (currentWordsList.length === 0) {
            // Clear display if no words
            hindiWordEl.textContent = '';
            englishMeaningEl.textContent = 'No words to display.';
            exampleSentenceEl.textContent = '';
            pronunciationBtn.disabled = true;
            if (speakWordBtn) speakWordBtn.disabled = true;
            prevWordBtn.disabled = true;
            nextWordBtn.disabled = true;
            if (speechFeedbackEl) speechFeedbackEl.textContent = '';
            return;
        }

        const word = currentWordsList[currentWordIndex];
        hindiWordEl.textContent = word.hindi_word || '';
        englishMeaningEl.textContent = word.english_meaning || '';
        exampleSentenceEl.textContent = word.example_sentence || '';

        pronunciationBtn.disabled = !word.hindi_word;
        if (speakWordBtn) speakWordBtn.disabled = !word.hindi_word || !SpeechRecognition;
        prevWordBtn.disabled = currentWordIndex === 0;

        // Default next button state
        nextWordBtn.disabled = currentWordIndex === currentWordsList.length - 1;
        
        // If speech recognition is available and active for this word, disable 'Next' until correct speech
        if (SpeechRecognition && speakWordBtn && !speakWordBtn.disabled) {
            nextWordBtn.disabled = true;
        }

        if (speechFeedbackEl) speechFeedbackEl.textContent = ''; // Clear previous feedback
    }

    function playPronunciation() {
        if (currentWordsList.length === 0 || !currentWordsList[currentWordIndex].hindi_word) return;
        const textToSpeak = currentWordsList[currentWordIndex].hindi_word;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'hi-IN';
        speechSynthesis.speak(utterance);
    }

    prevWordBtn.addEventListener('click', () => {
        if (currentWordIndex > 0) {
            currentWordIndex--;
            displayCurrentWord();
        }
    });

    nextWordBtn.addEventListener('click', () => {
        if (currentWordIndex < currentWordsList.length - 1) {
            currentWordIndex++;
            displayCurrentWord();
        }
    });

    pronunciationBtn.addEventListener('click', playPronunciation);

    // Initial load is now handled after login
    // loadCategories(); 

    // Speech Recognition Logic
    if (SpeechRecognition && speakWordBtn) {
        speakWordBtn.addEventListener('click', () => {
            if (!currentWordsList[currentWordIndex] || !currentWordsList[currentWordIndex].hindi_word) return;

            try {
                recognition.start();
                speechFeedbackEl.textContent = 'Listening...';
                speakWordBtn.disabled = true; // Disable while listening
            } catch (e) {
                // This can happen if recognition is already started
                console.error('Error starting speech recognition:', e);
                speechFeedbackEl.textContent = 'Mic error. Try again.';
                speakWordBtn.disabled = false;
            }
        });

    recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript.trim();
        const currentHindiWord = currentWordsList[currentWordIndex].hindi_word;

        if (spokenText.toLowerCase() === currentHindiWord.toLowerCase()) {
            speechFeedbackEl.textContent = `Correct! You said: "${spokenText}"`;
            speechFeedbackEl.style.color = 'green';
            
            // Enable next button if it's not the last word
            nextWordBtn.disabled = currentWordIndex === currentWordsList.length - 1;

                if (!nextWordBtn.disabled) { // If it can be enabled and clicked
                    setTimeout(() => {
                        nextWordBtn.click(); 
                        // speechFeedbackEl.textContent = ''; // Optionally clear feedback after moving
                    }, 1000); // Delay to show feedback
                }
            } else {
                speechFeedbackEl.textContent = `Try again. You said: "${spokenText}" (Expected: "${currentHindiWord}")`;
                speechFeedbackEl.style.color = 'red';
                nextWordBtn.disabled = true; // Keep next button disabled on incorrect answer
            }
        };

        recognition.onspeechend = () => {
            recognition.stop();
            // Re-enable button after speech ends IF there wasn't a match that auto-advances
            // The displayCurrentWord function will re-evaluate its state after nextWordBtn.click()
            if (speechFeedbackEl.textContent === 'Listening...') { // if no result processed yet
                 speechFeedbackEl.textContent = 'Did not catch that. Try again.';
            }
            // Enable button unless it's been disabled by displayCurrentWord (e.g. no words)
             if (currentWordsList.length > 0 && currentWordsList[currentWordIndex].hindi_word) {
                speakWordBtn.disabled = false;
            }
        };

        recognition.onerror = (event) => {
            speechFeedbackEl.textContent = `Error: ${event.error}. Please try again.`;
            speechFeedbackEl.style.color = 'red';
             if (currentWordsList.length > 0 && currentWordsList[currentWordIndex].hindi_word) {
                speakWordBtn.disabled = false;
            }
            console.error('Speech recognition error:', event);
        };
    } else if (speakWordBtn) {
        speakWordBtn.title = "Speech recognition not supported in your browser.";
        speakWordBtn.disabled = true; // Disable if API not supported
    }

});
