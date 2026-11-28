// ========================================
// TCP CONGESTION CONTROL QUIZ
// ========================================

// Number of questions per quiz
const QUESTIONS_PER_QUIZ = 5;

// Question bank
const questionBank = [

    {
        question: "What does CWND represent in TCP?",
        options: [
            "Receiver IP address",
            "Sender's congestion window",
            "Number of routers",
            "Physical link speed"
        ],
        answer: "Sender's congestion window"
    },

    {
        question: "How does CWND grow during Slow Start?",
        options: [
            "It halves every RTT",
            "It remains constant",
            "It approximately doubles every RTT",
            "It becomes zero"
        ],
        answer: "It approximately doubles every RTT"
    },

    {
        question: "What is the growth pattern during Congestion Avoidance?",
        options: [
            "Linear growth",
            "Exponential decrease",
            "No growth",
            "Immediate reset"
        ],
        answer: "Linear growth"
    },

    {
        question: "What can three duplicate ACKs trigger in TCP Reno?",
        options: [
            "Fast Retransmit and Fast Recovery",
            "Permanent shutdown",
            "DNS lookup",
            "New IP address"
        ],
        answer: "Fast Retransmit and Fast Recovery"
    },

    {
        question: "What happens to CWND after a timeout in this model?",
        options: [
            "It doubles",
            "It remains unchanged",
            "It returns to 1 MSS",
            "It becomes unlimited"
        ],
        answer: "It returns to 1 MSS"
    },

    {
        question: "What does RTT stand for?",
        options: [
            "Round Trip Time",
            "Real Transfer Technology",
            "Router Transmission Time",
            "Reliable Transfer Test"
        ],
        answer: "Round Trip Time"
    },

    {
        question: "What is the purpose of SSTHRESH?",
        options: [
            "To store IP addresses",
            "To define the threshold between TCP growth phases",
            "To measure cable length",
            "To calculate packet size"
        ],
        answer: "To define the threshold between TCP growth phases"
    },

    {
        question: "Which phase uses approximately linear CWND growth?",
        options: [
            "Slow Start",
            "Congestion Avoidance",
            "Connection Setup",
            "Connection Termination"
        ],
        answer: "Congestion Avoidance"
    },

    {
        question: "What does packet loss indicate?",
        options: [
            "All packets arrived successfully",
            "One or more packets failed to reach their destination",
            "The network speed increased",
            "The connection became wireless"
        ],
        answer: "One or more packets failed to reach their destination"
    },

    {
        question: "What is the main purpose of TCP congestion control?",
        options: [
            "To prevent network congestion",
            "To increase screen resolution",
            "To change IP addresses",
            "To reduce computer memory"
        ],
        answer: "To prevent network congestion"
    },

    {
        question: "Which protocol provides reliable data transmission?",
        options: [
            "UDP",
            "TCP",
            "IP only",
            "ARP"
        ],
        answer: "TCP"
    },

    {
        question: "What happens when CWND reaches SSTHRESH?",
        options: [
            "Congestion Avoidance begins",
            "The connection closes",
            "CWND becomes zero",
            "The IP address changes"
        ],
        answer: "Congestion Avoidance begins"
    },

    {
        question: "Which TCP mechanism detects loss using duplicate ACKs?",
        options: [
            "Fast Retransmit",
            "DNS",
            "ARP",
            "DHCP"
        ],
        answer: "Fast Retransmit"
    },

    {
        question: "What does MSS stand for?",
        options: [
            "Maximum Segment Size",
            "Minimum Server Speed",
            "Main Switching System",
            "Maximum Signal Strength"
        ],
        answer: "Maximum Segment Size"
    },

    {
        question: "Which TCP Reno phase follows Fast Recovery?",
        options: [
            "Congestion Avoidance",
            "Connection Setup",
            "Network Shutdown",
            "DNS Resolution"
        ],
        answer: "Congestion Avoidance"
    }

];

// ========================================
// QUIZ VARIABLES
// ========================================

let remainingQuestions = [];
let currentQuiz = [];
let currentQuestion = 0;
let userAnswers = [];

// ========================================
// SHUFFLE FUNCTION
// ========================================

function shuffleArray(array) {

    let shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {

        let j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
        [shuffled[j], shuffled[i]];

    }

    return shuffled;
}

// ========================================
// START NEW QUIZ
// ========================================

function startNewQuiz() {

    if (remainingQuestions.length < QUESTIONS_PER_QUIZ) {

        remainingQuestions = shuffleArray(questionBank);

    }

    currentQuiz = remainingQuestions.splice(
        0,
        QUESTIONS_PER_QUIZ
    );

    currentQuestion = 0;
    userAnswers = [];

    document.getElementById("resultBox").style.display = "none";

    document.getElementById("nextButton").style.display = "inline-block";

    document.getElementById("submitButton").style.display = "none";

    loadQuestion();
}

// ========================================
// LOAD QUESTION
// ========================================

function loadQuestion() {

    const q = currentQuiz[currentQuestion];

    document.getElementById("questionNumber").textContent =
        `Question ${currentQuestion + 1} of ${QUESTIONS_PER_QUIZ}`;

    document.getElementById("question").textContent = q.question;

    const optionsDiv = document.getElementById("options");

    optionsDiv.innerHTML = "";

    const shuffledOptions = shuffleArray(q.options);

    shuffledOptions.forEach(option => {

        const button = document.createElement("button");

        button.className = "option";

        button.textContent = option;

        button.onclick = function () {

            document.querySelectorAll(".option").forEach(btn => {
                btn.classList.remove("selected");
            });

            button.classList.add("selected");

            userAnswers[currentQuestion] = option;

        };

        optionsDiv.appendChild(button);

    });

    if (currentQuestion === QUESTIONS_PER_QUIZ - 1) {

        document.getElementById("nextButton").style.display = "none";

        document.getElementById("submitButton").style.display = "inline-block";

    } else {

        document.getElementById("nextButton").style.display = "inline-block";

        document.getElementById("submitButton").style.display = "none";

    }
}

// ========================================
// NEXT QUESTION
// ========================================

function nextQuestion() {

    if (userAnswers[currentQuestion] === undefined) {

        alert("Please select an answer!");

        return;

    }

    currentQuestion++;

    loadQuestion();
}

// ========================================
// SUBMIT QUIZ
// ========================================

function submitQuiz() {

    if (userAnswers[currentQuestion] === undefined) {

        alert("Please select an answer!");

        return;

    }

    let score = 0;

    let reviewHTML = "";

    currentQuiz.forEach((q, index) => {

        const userAnswer = userAnswers[index];

        const correctAnswer = q.answer;

        const isCorrect = userAnswer === correctAnswer;

        if (isCorrect) {

            score++;

        }

        reviewHTML += `
            <div class="answer-review">

                <h4>Question ${index + 1}: ${q.question}</h4>

                <p>Your answer: ${userAnswer}</p>

                <p>Correct answer: ${correctAnswer}</p>

                <strong>
                    ${isCorrect ? "Correct!" : "Incorrect!"}
                </strong>

            </div>
        `;

    });

    document.getElementById("score").textContent =
        `Your Score: ${score} / ${QUESTIONS_PER_QUIZ}`;

    document.getElementById("answerReview").innerHTML = reviewHTML;

    document.getElementById("resultBox").style.display = "block";

    document.getElementById("question").textContent = "Quiz Completed!";

    document.getElementById("questionNumber").textContent = "Completed";

    document.getElementById("options").innerHTML = "";

    document.getElementById("nextButton").style.display = "none";

    document.getElementById("submitButton").style.display = "none";

}

// ========================================
// INITIALIZE QUIZ
// ========================================

remainingQuestions = shuffleArray(questionBank);

startNewQuiz();