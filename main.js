const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://mugpnilbgwfuzhtyizfh.supabase.co'; // Substitua pela sua URL do Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Z3BuaWxiZ3dmdXpodHlpemZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM2NTY1MTYsImV4cCI6MjAzOTIzMjUxNn0.4_xLeNZKLXItRQt9vz4JOuxljPUL20AJESehddUZyuE'; // Substitua pela sua chave de API do Supabase
const TABLE_NAME = 'atm-quiz';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchData() {
    console.log('Iniciando a consulta ao Supabase...');
    let { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .limit(1); // Pegando apenas o primeiro vídeo
  
    console.log('Resposta completa:', { data, error });
  
    if (error) {
      console.error('Erro ao consultar o Supabase:', error);
    } else if (data.length === 0) {
      console.warn('Nenhum dado encontrado na tabela workez.');
    } else {
      console.log('Dados recebidos do Supabase:', data);
      const videoData = data[0];
      const quizRanking = videoData.quizRanking;
      const quisRankingGlobal = videoData.quisRankingGlobal;

      console.log('quizRanking:', quizRanking);
      console.log('quisRankingGlobal:', quisRankingGlobal);

      // Atualizar o ranking global e top 3
      updateRanking(quizRanking);
    }
}
fetchData();

function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

// Obter os parâmetros uID, vID, name e email
const userID = getURLParameter('uID');
const videoUrl = getURLParameter('vUrl');
const userName = getURLParameter('name');
const userEmail = getURLParameter('email');

// Log the results to verify
console.log("UserID:", userID);
console.log("videoUrl:", videoUrl);
console.log("UserName:", userName);
console.log("UserEmail:", userEmail);

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
    userResults.push({ userName, userEmail, score, timeTaken });

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
        resultText.innerHTML = `${index + 1}. ${result.userName} (${result.userEmail}) - ${result.score} pontos em ${result.timeTaken.toFixed(2)} segundos`;
        ranking.appendChild(resultText);
    });

    const quiz = document.getElementById('quiz');
    quiz.appendChild(ranking);
}

async function sendResults() {
    try {
        const response = await fetch('https://n8n.workez.online/webhook-test/19e1fff5-d262-4735-ba5e-34cf8c553b70', {
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

async function fetchFromSupabase() {
    // Substitua pelo nome da sua tabela

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_API_KEY,
                'Authorization': `Bearer ${SUPABASE_API_KEY}`
            }
        });
        console.log(response)

        
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();
        console.log('Data fetched from Supabase:', data);
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

// Chamar a função para buscar dados do Supabase
fetchFromSupabase();

// Utility function to shuffle array elements
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Função para atualizar o ranking global e top 3
function updateRanking(quizRanking) {
    // Atualizar o ranking global
    userResults = quizRanking;

    // Atualizar o top 3
    showRanking();
}