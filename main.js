// Function to get the value of a URL parameter
function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

// Get the parameters uID and vID
const userID = getURLParameter('uID');
const videoID = getURLParameter('vID');

// Log the results to verify
console.log("UserID:", userID);
console.log("VideoID:", videoID);


const quizData = {
    "questions": [
        {
            "questionId": 1,
            "questionText": "What is a cryptocurrency?",
            "answers": [
                {
                    "answerId": 1,
                    "answerText": "A digital or virtual currency that uses cryptography for security.",
                    "isCorrect": true
                },
                {
                    "answerId": 2,
                    "answerText": "A physical coin made of precious metal.",
                    "isCorrect": false
                },
                {
                    "answerId": 3,
                    "answerText": "A traditional currency like the US dollar or Euro.",
                    "isCorrect": false
                },
                {
                    "answerId": 4,
                    "answerText": "A type of credit card used for online transactions.",
                    "isCorrect": false
                },
                {
                    "answerId": 5,
                    "answerText": "A security measure used in online banking.",
                    "isCorrect": false
                }
            ]
        },
        {
            "questionId": 2,
            "questionText": "Which technology is the backbone of cryptocurrency?",
            "answers": [
                {
                    "answerId": 1,
                    "answerText": "Blockchain",
                    "isCorrect": true
                },
                {
                    "answerId": 2,
                    "answerText": "Cloud computing",
                    "isCorrect": false
                },
                {
                    "answerId": 3,
                    "answerText": "Artificial Intelligence",
                    "isCorrect": false
                },
                {
                    "answerId": 4,
                    "answerText": "Quantum computing",
                    "isCorrect": false
                },
                {
                    "answerId": 5,
                    "answerText": "Machine learning",
                    "isCorrect": false
                }
            ]
        },
        {
            "questionId": 3,
            "questionText": "What is Bitcoin?",
            "answers": [
                {
                    "answerId": 1,
                    "answerText": "The first decentralized cryptocurrency, created in 2009.",
                    "isCorrect": true
                },
                {
                    "answerId": 2,
                    "answerText": "A type of computer virus.",
                    "isCorrect": false
                },
                {
                    "answerId": 3,
                    "answerText": "A new form of social media platform.",
                    "isCorrect": false
                },
                {
                    "answerId": 4,
                    "answerText": "A programming language for building websites.",
                    "isCorrect": false
                },
                {
                    "answerId": 5,
                    "answerText": "A new online payment gateway.",
                    "isCorrect": false
                }
            ]
        },
        {
            "questionId": 4,
            "questionText": "What is a 'block' in blockchain?",
            "answers": [
                {
                    "answerId": 1,
                    "answerText": "A record of transactions in the blockchain.",
                    "isCorrect": true
                },
                {
                    "answerId": 2,
                    "answerText": "A type of digital wallet used in cryptocurrency.",
                    "isCorrect": false
                },
                {
                    "answerId": 3,
                    "answerText": "A unit of cryptocurrency.",
                    "isCorrect": false
                },
                {
                    "answerId": 4,
                    "answerText": "A piece of code used to mine cryptocurrency.",
                    "isCorrect": false
                },
                {
                    "answerId": 5,
                    "answerText": "A specific algorithm used for encryption.",
                    "isCorrect": false
                }
            ]
        },
        {
            "questionId": 5,
            "questionText": "What does 'mining' mean in the context of cryptocurrency?",
            "answers": [
                {
                    "answerId": 1,
                    "answerText": "The process of validating and recording transactions on the blockchain.",
                    "isCorrect": true
                },
                {
                    "answerId": 2,
                    "answerText": "Extracting physical gold or other metals.",
                    "isCorrect": false
                },
                {
                    "answerId": 3,
                    "answerText": "Creating new types of cryptocurrency.",
                    "isCorrect": false
                },
                {
                    "answerId": 4,
                    "answerText": "A form of hacking into digital wallets.",
                    "isCorrect": false
                },
                {
                    "answerId": 5,
                    "answerText": "Setting up a new blockchain network.",
                    "isCorrect": false
                }
            ]
        }
    ]
};



let currentQuestionIndex = 0;
let score = 0;
let startTime;
let hasAnswered = false; // Flag to track if an answer has been selected

// Randomize the order of questions and their answers
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.addEventListener('DOMContentLoaded', () => {
    startQuiz();
});

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    hasAnswered = false; // Reset the flag when the quiz starts
    startTime = new Date();
    quizData.questions = shuffle(quizData.questions);
    quizData.questions.forEach(question => {
        question.answers = shuffle(question.answers);
    });
    loadQuestion();
}

function loadQuestion() {
    hasAnswered = false; // Reset the flag for the new question
    const quiz = document.getElementById('quiz');
    quiz.innerHTML = '';

    const questionData = quizData.questions[currentQuestionIndex];
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
    } else {
        selectedButton.classList.add('incorrect');
        highlightCorrectAnswer(questionData);
    }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.questions.length) {
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

function showScore() {
    const quiz = document.getElementById('quiz');
    quiz.innerHTML = '';

    const timeTaken = (new Date() - startTime) / 1000;

    const scoreText = document.createElement('div');
    scoreText.id = 'score';
    scoreText.innerHTML = `Você acertou <br><span class="highlight">${score}/${quizData.questions.length}</span> <br>em <br><span class="highlight"> ${timeTaken.toFixed(2)} </span> segundos`;
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
}
