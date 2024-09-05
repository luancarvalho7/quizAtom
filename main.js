// Function to get the value of a URL parameter
function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

// Get the parameters uID and vID
const userID = getURLParameter('uID');
const videoUrl = getURLParameter('vUrl');

// Log the results to verify
console.log("UserID:", userID);
console.log("videoUrl:", videoUrl);

let xquizData = [];

async function getData() {
    try {
        const response = await fetch(`https://webhook.workez.online/webhook/findQuiz?url=${videoUrl}`);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const data = await response.json();

        // Log the data to understand its structure
        console.log("Fetched data:", data);

            xquizData = data[0].jQuiz.questions; 

        console.log("Quiz Data:", xquizData);

        // Start the quiz only after data is loaded
        startQuiz();
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    getData(); // Fetch data and start quiz
});

function startQuiz() {
    if (!xquizData || xquizData.length === 0) {
        console.error('Quiz data is empty or not defined. Cannot start quiz.');
        return;
    }

    currentQuestionIndex = 0;
    score = 0;
    hasAnswered = false; // Reset the flag when the quiz starts
    startTime = new Date();
    xquizData = shuffle(xquizData); // Shuffle the questions
    xquizData.forEach(question => {
        question.answers = shuffle(question.answers); // Shuffle the answers within each question
    });
    loadQuestion();
}

function loadQuestion() {
    if (!xquizData || xquizData.length === 0) return; // Prevent loading if there's no data
    hasAnswered = false; // Reset the flag for the new question
    const quiz = document.getElementById('quiz');
    quiz.innerHTML = '';

    const questionData = xquizData[currentQuestionIndex];
    const questionText = document.createElement('div');
    questionText.className = 'question';
    questionText.textContent = questionData.questionText;
    quiz.appendChild(questionText);

    questionData.answers.forEach((answer, index) => {
        const answerContainer = document.createElement('div');
        answerContainer.className = 'answer-container';
        
        const answerButton = document.createElement('div');
        answerButton.className = 'answer';
        
        const answerNumber = document.createElement('div');
        answerNumber.className = 'answer-number';
        answerNumber.textContent = index + 1;

        const answerText = document.createElement('div');
        answerText.className = 'answer-text';
        answerText.textContent = answer.answerText;

        answerButton.appendChild(answerNumber);
        answerButton.appendChild(answerText);

        answerContainer.appendChild(answerButton);

        answerButton.addEventListener('click', () => checkAnswer(answer, answerButton, questionData));

        quiz.appendChild(answerContainer);
    });
}

function checkAnswer(selectedAnswer, selectedButton, questionData) {
    if (hasAnswered) return; // Exit the function if an answer has already been selected

    hasAnswered = true; // Set the flag to true to prevent further clicks

    // Disable all buttons after an answer is selected
    const buttons = document.querySelectorAll('.answer');
    buttons.forEach(button => button.classList.add('disabled'));

    if (selectedAnswer.isCorrect) {
        selectedButton.classList.add('correct');
        score++;
    }
     else {
        selectedButton.classList.add('incorrect');
        highlightCorrectAnswer(questionData);
    }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < xquizData.length) {
            loadQuestion();
        } else {
            showScore();
        }
    }, 1000);
}

function highlightCorrectAnswer(questionData) {
    const buttons = document.querySelectorAll('.answer');
    buttons.forEach((button, index) => {
        if (questionData.answers[index].isCorrect) {
            button.classList.add('correct');
        }
    });
}
let userResults = [];

function showScore() {
    const quiz = document.getElementById('quiz');
    quiz.innerHTML = '';

    const timeTaken = (new Date() - startTime) / 1000;

    // Save the current user's result
    userResults.push({ userID, score, timeTaken });

    const scoreText = document.createElement('div');
    scoreText.id = 'score';
    scoreText.innerHTML = `Você acertou <br><span class="highlight">${score}/${xquizData.length}</span> <br>em <br><span class="highlight"> ${timeTaken.toFixed(2)} </span> segundos`;
    quiz.appendChild(scoreText);

    // Add a restart button
    const restartButton = document.createElement('button');
    restartButton.textContent = 'REINICIAR QUIZ';
    restartButton.className = 'restart';
    restartButton.addEventListener('click', startQuiz);
    quiz.appendChild(restartButton);

    // Add a continue button if the score is at least 4/5
    if (score >= 4) {
        const continueButton = document.createElement('button');
        continueButton.textContent = 'PROXIMA AULA ';
        continueButton.className = 'continue';
        continueButton.addEventListener('click', () => {
            const message = { type: 'FROM_IFRAME', content: 'Hello, Parent!' };
            window.parent.postMessage(message, '*');
        });
        quiz.appendChild(continueButton);
    }

    // Show the top 3 ranking
    showRanking();

    // Send the results to the server
    sendResults();
}

function showRanking() {
    // Sort the results by score and time taken
    userResults.sort((a, b) => {
        if (b.score === a.score) {
            return a.timeTaken - b.timeTaken;
        }
        return b.score - a.score;
    });

    const ranking = document.createElement('div');
    ranking.id = 'ranking';
    ranking.innerHTML = '<h2>Top 3 Ranking</h2>';

    // Display the top 3 users
    userResults.slice(0, 3).forEach((result, index) => {
        const resultText = document.createElement('div');
        resultText.className = 'ranking-entry';
        resultText.innerHTML = `${index + 1}. ${result.userID} - ${result.score} pontos em ${result.timeTaken.toFixed(2)} segundos`;
        ranking.appendChild(resultText);
    });

    const quiz = document.getElementById('quiz');
    quiz.appendChild(ranking);
}

async function sendResults() {
    try {
        const response = await fetch('https://n8n.workez.online/webhook-test/204f4428-ce8f-48b1-89c1-e9b916246d91', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userResults)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const result = await response.json();
        console.log('Results successfully sent:', result);
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

// Utility function to shuffle array elements
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
