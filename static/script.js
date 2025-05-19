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

    const lessonTabsContainer = document.getElementById('lessonTabs');
    const currentLessonNameEl = document.getElementById('currentLessonName');
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
    let lessons = [];
    let currentWordsList = [];
    let currentWordIndex = 0;
    let activeLessonId = null;
    let currentUser = null;

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = userNameEl.value.trim();
        if (name) {
            currentUser = {
                name: name,
                progress: JSON.parse(localStorage.getItem(name + '_progress')) || {},
                pronunciationCount: parseInt(localStorage.getItem(name + '_pronunciationCount')) || 0
            };
            document.getElementById('viewReportBtn').classList.remove('disabled'); // Enable report button
            loggedInUser = name;
            loginSection.style.display = 'none';
            learningContent.style.display = 'block';
            // Insert welcome message before category name or somewhere prominent
            const wordDisplayCardHeader = document.querySelector('#wordDisplayCard .card-header');
            if (wordDisplayCardHeader) {
                welcomeMessageEl.textContent = `Welcome, ${loggedInUser}! Select a lesson to start.`;
                wordDisplayCardHeader.parentNode.insertBefore(welcomeMessageEl, wordDisplayCardHeader);
            }
            loadLessons();
        } else {
            // Optionally, show an error if name is empty
            alert('Please enter your name.');
        }
    });

    // Fetch and display lessons
    async function loadLessons() {
        try {
            const response = await fetch('/api/lessons');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            let fetchedLessons = await response.json();

            // De-duplicate lessons by name
            const uniqueLessonNames = new Set();
            const uniqueLessonsResult = []; // Use a new array to store unique lessons
            fetchedLessons.forEach(lesson => { // Iterate through all fetched lessons
                if (!uniqueLessonNames.has(lesson.name)) { // Check if name is already seen
                    uniqueLessonNames.add(lesson.name); // Add name to set
                    uniqueLessonsResult.push(lesson); // Add the lesson object to our results
                }
            });
            lessons = uniqueLessonsResult; // Update the global 'lessons' array

            renderLessonTabs();
            if (lessons.length > 0) {
                currentLessonNameEl.textContent = 'Select a lesson to start.';
            } else {
                currentLessonNameEl.textContent = 'No lessons available.';
            }
        } catch (error) { // Corrected: removed space before catch
            console.error('Error loading lessons:', error);
            currentLessonNameEl.textContent = 'Error loading lessons.';
        }
    }

    function renderLessonTabs() {
        lessonTabsContainer.innerHTML = ''; // Clear existing tabs
        if (lessons.length === 0 && loggedInUser) { // Check if loggedInUser to avoid message before login
            lessonTabsContainer.innerHTML = '<li class="nav-item"><span class="nav-link text-muted">No lessons found.</span></li>';
            return;
        }
        lessons.forEach(lesson => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            const a = document.createElement('a');
            a.className = 'nav-link';
            a.href = '#';
            a.textContent = lesson.name;
            a.setAttribute('data-lesson-id', lesson.id);
            a.setAttribute('data-lesson-name', lesson.name);
            if (lesson.id === activeLessonId) {
                a.classList.add('active');
            }
            a.addEventListener('click', (e) => {
                e.preventDefault();
                selectLesson(lesson.id, lesson.name);
            });
            li.appendChild(a);
            lessonTabsContainer.appendChild(li);
        });
    }

    async function selectLesson(lessonId, lessonName) {
        activeLessonId = lessonId;
        currentLessonNameEl.textContent = lessonName;
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
        renderLessonTabs(); // Re-render to update active tab

        try {
            const response = await fetch(`/api/lessons/${lessonId}/words`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            currentWordsList = await response.json();
            if (currentWordsList.length > 0) {
                displayCurrentWord();
            } else {
                englishMeaningEl.textContent = 'No words found in this lesson.';
            }
        } catch (error) {
            console.error(`Error loading words for lesson ${lessonName}:`, error); // This line was correct, ensuring it stays as is or is contextually updated if params change.
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

        // Increment and save pronunciation count
        if (currentUser && typeof currentUser.pronunciationCount !== 'undefined') {
            currentUser.pronunciationCount++;
            localStorage.setItem(currentUser.name + '_pronunciationCount', currentUser.pronunciationCount);
        }
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
    // loadLessons(); 

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

    // Handle Report Modal display
    const reportModalElement = document.getElementById('reportModal');
    if (reportModalElement) {
        reportModalElement.addEventListener('show.bs.modal', function (event) {
            if (currentUser) {
                document.getElementById('reportUserName').textContent = currentUser.name;
                document.getElementById('pronunciationClickCount').textContent = currentUser.pronunciationCount;
            } else {
                // This case should ideally not happen if button is disabled before login
                document.getElementById('reportUserName').textContent = 'Guest';
                document.getElementById('pronunciationClickCount').textContent = 'N/A (Please log in)';
            }
        });
    }

    // Initialize Report Button State (disabled by default)
    // This ensures the button is disabled before any login attempt.
    const viewReportBtn = document.getElementById('viewReportBtn');
    if (viewReportBtn) {
        viewReportBtn.classList.add('disabled');
    }

});
