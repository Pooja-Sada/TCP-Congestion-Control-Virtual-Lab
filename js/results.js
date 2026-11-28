

const questionBank = [

{
    question: "What is TCP congestion control?",
    options: [
        "Managing network congestion",
        "Increasing file size",
        "Deleting packets",
        "Changing IP address"
    ],
    answer: "Managing network congestion"
},

{
    question: "Which phase increases CWND exponentially?",
    options: [
        "Fast Recovery",
        "Slow Start",
        "Congestion Avoidance",
        "Timeout"
    ],
    answer: "Slow Start"
},

{
    question: "Which phase increases CWND linearly?",
    options: [
        "Slow Start",
        "Fast Recovery",
        "Congestion Avoidance",
        "Connection Termination"
    ],
    answer: "Congestion Avoidance"
},

{
    question: "What does RTT stand for?",
    options: [
        "Real Time Transfer",
        "Round Trip Time",
        "Random Transfer Time",
        "Reliable Transmission Technique"
    ],
    answer: "Round Trip Time"
},

{
    question: "What does CWND represent?",
    options: [
        "Congestion Window",
        "Connection Width",
        "Control Window Data",
        "Current Web Network"
    ],
    answer: "Congestion Window"
},

{
    question: "What is the full form of MSS?",
    options: [
        "Maximum Segment Size",
        "Minimum Signal Speed",
        "Maximum Server System",
        "Main Switching Signal"
    ],
    answer: "Maximum Segment Size"
},

{
    question: "What happens during Slow Start?",
    options: [
        "CWND increases exponentially",
        "CWND remains constant",
        "CWND becomes zero",
        "Packets are deleted"
    ],
    answer: "CWND increases exponentially"
},

{
    question: "What is the purpose of SSThresh?",
    options: [
        "To control the transition between TCP phases",
        "To increase packet size",
        "To calculate IP address",
        "To terminate a connection"
    ],
    answer: "To control the transition between TCP phases"
},

{
    question: "Which algorithm is used in Congestion Avoidance?",
    options: [
        "AIMD",
        "RSA",
        "DES",
        "AES"
    ],
    answer: "AIMD"
},

{
    question: "What does AIMD stand for?",
    options: [
        "Additive Increase Multiplicative Decrease",
        "Automatic Internet Management Data",
        "Advanced Input Multiple Design",
        "Additive Information Maximum Delivery"
    ],
    answer: "Additive Increase Multiplicative Decrease"
},

{
    question: "What indicates packet loss in TCP?",
    options: [
        "Duplicate ACKs or timeout",
        "Successful delivery",
        "Increased file size",
        "IP address change"
    ],
    answer: "Duplicate ACKs or timeout"
},

{
    question: "What is the function of ACK?",
    options: [
        "Acknowledges received data",
        "Deletes packets",
        "Changes network address",
        "Increases transmission delay"
    ],
    answer: "Acknowledges received data"
},

{
    question: "What happens when TCP detects congestion?",
    options: [
        "Transmission rate is reduced",
        "Transmission rate always doubles",
        "Connection becomes wireless",
        "All packets are removed"
    ],
    answer: "Transmission rate is reduced"
},

{
    question: "Which mechanism detects lost segments using duplicate ACKs?",
    options: [
        "Fast Retransmit",
        "Slow Start",
        "Flow Control",
        "DNS"
    ],
    answer: "Fast Retransmit"
},

{
    question: "What is the main purpose of Fast Recovery?",
    options: [
        "Recover from packet loss without restarting Slow Start",
        "Increase IP address size",
        "Stop all communication",
        "Remove acknowledgements"
    ],
    answer: "Recover from packet loss without restarting Slow Start"
},

{
    question: "Which protocol provides reliable data transmission?",
    options: [
        "TCP",
        "UDP",
        "IP",
        "ARP"
    ],
    answer: "TCP"
},

{
    question: "What does UDP stand for?",
    options: [
        "User Datagram Protocol",
        "Universal Data Process",
        "User Delivery Program",
        "Unified Datagram Process"
    ],
    answer: "User Datagram Protocol"
},

{
    question: "Which TCP mechanism controls the sender's transmission rate?",
    options: [
        "Congestion Control",
        "DNS",
        "ARP",
        "Address Resolution"
    ],
    answer: "Congestion Control"
},

{
    question: "What happens to CWND after a timeout in traditional TCP Reno?",
    options: [
        "It is reset to 1 MSS",
        "It doubles",
        "It remains unchanged",
        "It becomes infinite"
    ],
    answer: "It is reset to 1 MSS"
},

{
    question: "What is the main purpose of a sliding window?",
    options: [
        "Control the amount of unacknowledged data",
        "Change the destination address",
        "Increase packet loss",
        "Delete received data"
    ],
    answer: "Control the amount of unacknowledged data"
},

{
    question: "What does the congestion window limit?",
    options: [
        "Amount of data sent before receiving acknowledgements",
        "Number of IP addresses",
        "Size of the computer memory",
        "Number of network cables"
    ],
    answer: "Amount of data sent before receiving acknowledgements"
},

{
    question: "Which layer does TCP belong to?",
    options: [
        "Transport Layer",
        "Network Layer",
        "Physical Layer",
        "Application Layer"
    ],
    answer: "Transport Layer"
},

{
    question: "What is congestion in a network?",
    options: [
        "Excessive traffic in the network",
        "Absence of computers",
        "Increase in screen brightness",
        "Failure of a keyboard"
    ],
    answer: "Excessive traffic in the network"
},

{
    question: "What is the purpose of a retransmission timer?",
    options: [
        "Detect possible packet loss",
        "Increase packet size",
        "Assign IP addresses",
        "Calculate file names"
    ],
    answer: "Detect possible packet loss"
},

{
    question: "What does duplicate ACK indicate?",
    options: [
        "A segment may be missing",
        "All data is deleted",
        "The connection is encrypted",
        "The network is disconnected permanently"
    ],
    answer: "A segment may be missing"
},

{
    question: "What is the full form of TCP?",
    options: [
        "Transmission Control Protocol",
        "Transfer Communication Process",
        "Transmission Computer Program",
        "Transport Connection Process"
    ],
    answer: "Transmission Control Protocol"
},

{
    question: "Which TCP phase follows Slow Start when CWND reaches SSThresh?",
    options: [
        "Congestion Avoidance",
        "Connection Termination",
        "Fast Retransmit",
        "Timeout"
    ],
    answer: "Congestion Avoidance"
},

{
    question: "What is the purpose of flow control?",
    options: [
        "Prevent a sender from overwhelming the receiver",
        "Increase network congestion",
        "Change packet headers",
        "Remove TCP acknowledgements"
    ],
    answer: "Prevent a sender from overwhelming the receiver"
},

{
    question: "Which value is commonly used to measure network delay?",
    options: [
        "RTT",
        "MSS",
        "CWND",
        "IP address"
    ],
    answer: "RTT"
},

{
    question: "What does multiplicative decrease mean in AIMD?",
    options: [
        "Reducing CWND by a factor",
        "Increasing CWND by one",
        "Keeping CWND constant",
        "Removing all acknowledgements"
    ],
    answer: "Reducing CWND by a factor"
}

];


// QUIZ VARIABLES

let remainingQuestions = [];
let currentQuiz = [];
let currentQuestion = 0;
let userAnswers = [];

const QUESTIONS_PER_QUIZ = 10;


// SHUFFLE FUNCTION

function shuffleArray(array) {

    let shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {

        let j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
        [shuffled[j], shuffled[i]];

    }

    return shuffled;
}


// START NEW QUIZ

function startNewQuiz() {

    if (remainingQuestions.length < QUESTIONS_PER_QUIZ) {

        remainingQuestions = shuffleArray(questionBank);

    }

    currentQuiz = remainingQuestions.splice(0, QUESTIONS_PER_QUIZ);

    currentQuestion = 0;

    userAnswers = [];

    document.getElementById("resultBox").style.display = "none";

    document.getElementById("nextButton").style.display = "inline-block";

    document.getElementById("submitButton").style.display = "none";

    loadQuestion();

}


// DISPLAY QUESTION

function loadQuestion() {

    let q = currentQuiz[currentQuestion];

    // Shuffle alternatives

    let shuffledOptions = shuffleArray(q.options);

    q.displayOptions = shuffledOptions;

    document.getElementById("questionNumber").textContent =
        "Question " + (currentQuestion + 1) + " of 10";

    document.getElementById("question").textContent = q.question;

    let optionsDiv = document.getElementById("options");

    optionsDiv.innerHTML = "";

    shuffledOptions.forEach((option, index) => {

        let button = document.createElement("button");

        button.textContent = option;

        button.className = "option";

        button.onclick = function() {

            document.querySelectorAll(".option").forEach(btn => {

                btn.classList.remove("selected");

            });

            button.classList.add("selected");

            userAnswers[currentQuestion] = option;

        };

        optionsDiv.appendChild(button);

    });


    if (currentQuestion === 9) {

        document.getElementById("nextButton").style.display = "none";

        document.getElementById("submitButton").style.display = "inline-block";

    } else {

        document.getElementById("nextButton").style.display = "inline-block";

        document.getElementById("submitButton").style.display = "none";

    }

}


// NEXT QUESTION

function nextQuestion() {

    if (userAnswers[currentQuestion] === undefined) {

        alert("Please select an answer!");

        return;

    }

    currentQuestion++;

    loadQuestion();

}


// SUBMIT QUIZ AND SHOW ANSWERS

function submitQuiz() {

    if (userAnswers[currentQuestion] === undefined) {

        alert("Please select an answer!");

        return;

    }

    let score = 0;

    let review = "";

    currentQuiz.forEach((q, index) => {

        let userAnswer = userAnswers[index];

        let correct = userAnswer === q.answer;

        if (correct) {

            score++;

        }

        review += `

            <div class="answer-review">

                <p><b>Q${index + 1}. ${q.question}</b></p>

                <p>Your Answer: ${userAnswer}</p>

                <p>Correct Answer: ${q.answer}</p>

                <p>${correct ? "Correct!" : "Incorrect!"}</p>

                <hr>

            </div>

        `;

    });


    document.getElementById("score").textContent =
        "Your Score: " + score + " / 10";

    document.getElementById("answerReview").innerHTML = review;

    document.getElementById("resultBox").style.display = "block";

    document.getElementById("question").textContent = "Quiz Completed!";

    document.getElementById("questionNumber").textContent = "Your answers and results are shown below.";

    document.getElementById("options").innerHTML = "";

    document.getElementById("nextButton").style.display = "none";

    document.getElementById("submitButton").style.display = "none";

}


// START FIRST QUIZ

remainingQuestions = shuffleArray(questionBank);

startNewQuiz();