function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

// Obter os parâmetros uID, vID, name e email
const userID = getURLParameter('uID');
const videoUrl = getURLParameter('vUrl');
const userName = getURLParameter('name');

// Log the results to verify
console.log("UserID:", userID);
console.log("videoUrl:", videoUrl);
console.log("UserName:", userName);

let xquizData = [];
let quizRank = [];

async function getData() {

    try {
        const response = await fetch(`https://n8nwebhook.iatom.site/webhook/getUrl?url=${videoUrl}`);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const data = await response.json();

        // Log the data to understand its structure
        console.log("Fetched data:", data);

        xquizData = data.jQuiz.questions; 
        quizRank = Array.isArray(data.quizRank.ranking) ? data.quizRank.ranking : [data.quizRank.ranking]; // Ensure quizRank is an array

        console.log("Quiz Data:", xquizData);
        console.log("Quiz Ranking:", quizRank);

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
    userResults.push({ videoUrl, userName, userID, score, timeTaken });

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

async function sendResults() {
    // Send only the latest result
    const currentResult = userResults[userResults.length - 1]; // Get the last result added

    console.log(currentResult)

    try {
        // First POST request
        const response1 = await fetch('https://n8nwebhook.iatom.site/webhook/setRanking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([currentResult]) // Send only the latest result
        });

        if (!response1.ok) {
            throw new Error('Network response was not ok ' + response1.statusText);
        }

        const result1 = await response1.json();
        console.log('Results successfully sent:', result1);

        // Check if the API response has updated ranking or "same"
        if (result1.ranking !== "same") {
            // Update the UI with the new ranking if it's different
            quizRank = result1.ranking; // Assign the new ranking to quizRank
            showRanking(); // Update the displayed ranking
        } else {
            console.log("Ranking is unchanged. Keeping the existing ranking.");
            showRanking(); // Display the fetched ranking
        }

        // Second POST request to quizProgressUpdate
        const response2 = await fetch('https://n8nwebhook.iatom.site/webhook/quizProgressUpdate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([currentResult]) // Send the same result to the second webhook
        });

        if (!response2.ok) {
            throw new Error('Network response was not ok ' + response2.statusText);
        }

        const result2 = await response2.json();
        console.log('Progress update successfully sent:', result2);

    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}


function formatName(fullName) {
    if (!fullName) {
        return 'Unknown'; // Return a placeholder if the name is null or undefined
    }
    
    const nameParts = fullName.split(' ');

    // Get the first name
    const firstName = nameParts[0];

    // Get the last name (if available) and its first letter
    const lastNameInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0].toUpperCase() : '';

    // Return the formatted name as "First L."
    return lastNameInitial ? `${firstName} ${lastNameInitial}.` : firstName;
}


function showRanking() {
    // Remove the old ranking if it exists
    const existingRankingElement = document.getElementById('ranking');
    if (existingRankingElement) {
        existingRankingElement.remove(); 
    }

    // Create a new ranking container
    const ranking = document.createElement('div');
    ranking.id = 'ranking';
    ranking.innerHTML = '<h2 class="ranking-title">Melhores Classificados</h2>';

    // Create a container for all ranking entries
    const rankingContainer = document.createElement('div');
    rankingContainer.className = 'ranking-container'; // Unique container for all ranking entries

    // Ensure quizRank is an array
    if (!Array.isArray(quizRank)) {
        quizRank = [quizRank];
    }

    // Add the top 3 users to the ranking container, but only if the userID is not null
    quizRank.slice(0, 3).forEach((result, index) => {
        if (result.userID) {  // Check if userID is valid
            console.log(result);
        
            // Format the name
            const formattedName = formatName(result.name);

            // Create a ranking entry div
            const entry = document.createElement('div');
            entry.className = `ranking-entry ranking-${index + 1}`; // Add a class for ranking position (1st, 2nd, 3rd)

            // HTML for the ranking entry
            entry.innerHTML = `
                <div class="ranking-position">#${index + 1}</div>
                <div class="ranking-name">${formattedName}</div>
                <div class="ranking-score">${result.score}/5</div>
                <div class="ranking-time">${parseFloat(result.time).toFixed(2)} seg</div>
            `;

            rankingContainer.appendChild(entry); // Append each entry to the container
        }
    });

    // Append the ranking container to the main ranking div
    ranking.appendChild(rankingContainer);

    // Append the ranking section to the quiz element
    const quiz = document.getElementById('quiz');
    quiz.appendChild(ranking);
}



// Utility function to shuffle array elements
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}