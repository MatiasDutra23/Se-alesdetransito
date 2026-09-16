/*
  EDITAR PREGUNTAS:
  - type: "multiple" o "true-false"
  - En multiple, correct es el texto exacto de la respuesta correcta.
  - En true-false, correct es true o false.
  - image puede ser una URL o una imagen local, por ejemplo: "img/perro.png".
*/

const questions = [
  {
    type: "true-false",
    question: "Juan va caminando y encuentra una señal que le advierte que hay una curva peligrosa más adelante. Juan piensa: “La señal me está advirtiendo que tengo que prestar atención”.",
    correct: true
  },
  {
    type: "true-false",
    question: "Una señal preventiva puede prevenir sobre una situación que podemos encontrar más adelante en el camino.",
    correct: true
  },
  {
    type: "multiple",
    question: "Pedro observa una señal que advierte sobre una zona escolar. Como tiene apuro, decide no prestarle atención. ¿Qué debería hacer Pedro?",
    answers: ["Ignorar la señal y continuar rápidamente.", "Prestar atención a la señal y transitar con cuidado.", "Pasar por otro lugar para no ver la señal."],
    correct: "Prestar atención a la señal y transitar con cuidado."
  },
  {
    type: "multiple",
    question: "¿Qué nos puede ayudar a reconocer una señal preventiva?",
    answers: ["Su forma de rombo y sus colores amarillo y negro.", "Que siempre tiene dibujos de lugares para visitar.", "Que siempre indica el camino que debemos seguir."],
    correct: "Su forma de rombo y sus colores amarillo y negro."
  },
  {
    type: "multiple",
    question: "¿Para qué sirven las señales preventivas?",
    answers: ["Para advertirnos que debemos prestar atención y tener cuidado.", "Para indicarnos por dónde debemos ir.", "Para mostrarnos los lugares que podemos visitar."],
    correct: "Para advertirnos que debemos prestar atención y tener cuidado."
  },
  {
    type: "multiple",
    question: "¿Cuál de estas situaciones muestra a una persona actuando de manera responsable?",
    answers: ["Un niño ve una señal y decide ignorarla.", "Una persona observa una señal preventiva y presta atención a lo que está advirtiendo.", "Un conductor pasa rápidamente sin mirar las señales."],
    correct: "Una persona observa una señal preventiva y presta atención a lo que está advirtiendo."
  },
  {
    type: "multiple",
    question: "Un conductor encuentra una señal que le advierte que más adelante hay una curva peligrosa. ¿Qué debería hacer?",
    answers: ["Prestar atención y conducir con cuidado.", "Aumentar la velocidad.", "Ignorar la señal."],
    correct: "Prestar atención y conducir con cuidado."
  }
];

const STORAGE_KEY = "juegoPreguntasEstadoV2";
let currentQuestion = 0;
let score = 0;
let answered = false;
let selectedAnswer = null;
let shuffledQuestions = [];
let currentAnswers = [];
let soundEnabled = true;
let audioContext = null;

const $ = (id) => document.getElementById(id);
const questionText = $("question-text");
const questionHelp = $("question-help");
const answersContainer = $("answers");
const confirmButton = $("confirm-button");
const nextButton = $("next-button");
const feedback = $("feedback");
const progress = $("progress");
const progressFill = $("progress-fill");
const scoreElement = $("score");
const resetButton = $("reset-button");
const soundButton = $("sound-button");
const resultCard = $("result-card");
const resultText = $("result-text");
const playAgainButton = $("play-again-button");

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function prepareQuestions() {
  shuffledQuestions = shuffle(questions);
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentQuestion, score }));
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Number.isInteger(saved.currentQuestion) && saved.currentQuestion < questions.length) {
      currentQuestion = saved.currentQuestion;
      score = Number.isInteger(saved.score) ? saved.score : 0;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(frequency, start, duration, type = "sine", volume = 0.12) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + start);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(ctx.currentTime + start);
  oscillator.stop(ctx.currentTime + start + duration + 0.03);
}

function playCorrectSound() {
  playTone(523.25, 0, .13, "triangle", .16);
  playTone(659.25, .12, .13, "triangle", .16);
  playTone(783.99, .24, .22, "triangle", .18);
}

function playIncorrectSound() {
  playTone(220, 0, .18, "square", .10);
  playTone(165, .16, .25, "square", .09);
}

function createAnswerButton(text, value, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "answer";
  button.textContent = text;
  button.dataset.value = String(value);
  button.dataset.letter = String.fromCharCode(65 + index);
  button.addEventListener("click", () => {
    if (answered) return;
    selectedAnswer = value;
    document.querySelectorAll(".answer").forEach((btn) => btn.classList.remove("selected"));
    button.classList.add("selected");
    confirmButton.disabled = false;
  });
  answersContainer.appendChild(button);
}

function loadQuestion() {
  const question = shuffledQuestions[currentQuestion];
  if (!question) return;

  resultCard.classList.add("hidden");
  confirmButton.classList.remove("hidden");
  nextButton.classList.add("hidden");
  feedback.textContent = "";
  feedback.className = "feedback";
  selectedAnswer = null;
  answered = false;
  confirmButton.disabled = true;
  questionText.textContent = question.question;
  questionHelp.textContent = question.type === "true-false"
    ? "¿La afirmación es verdadera o falsa?"
    : "Elegí una opción y luego confirmá.";
  progress.textContent = `Pregunta ${currentQuestion + 1} de ${shuffledQuestions.length}`;
  progressFill.style.width = `${((currentQuestion + 1) / shuffledQuestions.length) * 100}%`;
  scoreElement.textContent = score;

  answersContainer.innerHTML = "";
  currentAnswers = question.type === "multiple"
    ? shuffle(question.answers)
    : shuffle([true, false]);

  currentAnswers.forEach((answer, index) => {
    const label = question.type === "true-false"
      ? (answer ? "Verdadero" : "Falso")
      : answer;
    createAnswerButton(label, answer, index);
  });
}

function checkAnswer() {
  if (answered || selectedAnswer === null) return;
  answered = true;

  const question = shuffledQuestions[currentQuestion];
  const buttons = [...document.querySelectorAll(".answer")];
  const isCorrect = selectedAnswer === question.correct;

  buttons.forEach((button) => {
    button.disabled = true;
    if (String(button.dataset.value) === String(question.correct)) button.classList.add("correct");
    if (String(button.dataset.value) === String(selectedAnswer) && !isCorrect) button.classList.add("incorrect");
  });

  if (isCorrect) {
    score++;
    feedback.textContent = "🎉 ¡Muy bien! ¡Respuesta correcta!";
    feedback.classList.add("correct");
    playCorrectSound();
  } else {
    feedback.textContent = "💪 ¡Casi! Mirá la respuesta correcta en verde.";
    feedback.classList.add("incorrect");
    playIncorrectSound();
  }

  scoreElement.textContent = score;
  confirmButton.disabled = true;
  nextButton.classList.remove("hidden");
  nextButton.textContent = currentQuestion === shuffledQuestions.length - 1
    ? "Ver resultado 🏆"
    : "Siguiente pregunta →";
  saveGame();
}

function showFinalResult() {
  questionText.textContent = "¡Juego terminado!";
  questionHelp.textContent = "¡Gracias por jugar y aprender!";
  answersContainer.innerHTML = "";
  feedback.textContent = "";
  confirmButton.classList.add("hidden");
  nextButton.classList.add("hidden");
  resultCard.classList.remove("hidden");
  progress.textContent = "Resultado final";
  progressFill.style.width = "100%";
  resultText.textContent = `Obtuviste ${score} de ${shuffledQuestions.length} respuestas correctas.`;
  localStorage.removeItem(STORAGE_KEY);
}

function startNewGame() {
  currentQuestion = 0;
  score = 0;
  answered = false;
  selectedAnswer = null;
  prepareQuestions();
  loadQuestion();
}

confirmButton.addEventListener("click", checkAnswer);

nextButton.addEventListener("click", () => {
  if (currentQuestion === shuffledQuestions.length - 1) {
    showFinalResult();
  } else {
    currentQuestion++;
    loadQuestion();
  }
});

playAgainButton.addEventListener("click", startNewGame);

resetButton.addEventListener("click", () => {
  if (confirm("¿Querés reiniciar el juego y comenzar desde cero?")) {
    localStorage.removeItem(STORAGE_KEY);
    startNewGame();
  }
});

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "🔊" : "🔇";
  soundButton.setAttribute("aria-pressed", String(!soundEnabled));
  soundButton.title = soundEnabled ? "Desactivar sonidos" : "Activar sonidos";
  if (soundEnabled) playTone(660, 0, .12, "triangle", .1);
});

loadGame();
prepareQuestions();
loadQuestion();
