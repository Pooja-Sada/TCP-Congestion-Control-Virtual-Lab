
// SAMPLE SIMULATION DATA
// Replace this with shared simulation data later.

let simulationData = {
    rtt: [1, 2, 3, 4, 5, 6, 7, 8],
    cwnd: [1, 2, 4, 8, 16, 17, 18, 19],
    threshold: 16,
    packetLoss: 1
};

// DISPLAY STATISTICS

function displayStatistics() {
    const maxCWND = Math.max(...simulationData.cwnd);

    document.getElementById("totalRTT").textContent =
        simulationData.rtt.length;

    document.getElementById("maxCWND").textContent =
        maxCWND + " MSS";

    document.getElementById("threshold").textContent =
        simulationData.threshold + " MSS";

    document.getElementById("packetLoss").textContent =
        simulationData.packetLoss;
}

// CREATE CWND GRAPH

const ctx = document.getElementById("cwndChart");

const cwndChart = new Chart(ctx, {
    type: "line",

    data: {
        labels: simulationData.rtt,

        datasets: [{
            label: "Congestion Window (MSS)",
            data: simulationData.cwnd,
            borderWidth: 3,
            tension: 0.3,
            fill: false
        }]
    },

    options: {
        responsive: true,
        maintainAspectRatio: false,

        scales: {
            x: {
                title: {
                    display: true,
                    text: "Round Trip Time (RTT)"
                }
            },

            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Congestion Window (MSS)"
                }
            }
        }
    }
});

displayStatistics();


// QUIZ QUESTIONS

const questions = [
    {
        question: "What is TCP congestion control?",
        options: [
            "Managing network congestion",
            "Increasing file size",
            "Deleting packets",
            "Changing IP address"
        ],
        answer: 0
    },

    {
        question: "Which phase increases CWND exponentially?",
        options: [
            "Fast Recovery",
            "Slow Start",
            "Congestion Avoidance",
            "Timeout"
        ],
        answer: 1
    },

    {
        question: "Which phase increases CWND linearly?",
        options: [
            "Slow Start",
            "Fast Recovery",
            "Congestion Avoidance",
            "Connection Termination"
        ],
        answer: 2
    },

    {
        question: "What happens when packet loss occurs due to timeout?",
        options: [
            "CWND increases",
            "CWND is reset to 1 MSS in traditional TCP Reno",
            "Connection speed doubles",
            "RTT becomes zero"
        ],
        answer: 1
    },

    {
        question: "What does RTT stand for?",
        options: [
            "Real Time Transfer",
            "Round Trip Time",
            "Random Transfer Time",
            "Reliable Transmission Technique"
        ],
        answer: 1
    }
];

let currentQuestion = 0;
let userScore = 0;
let answered = false;


// DISPLAY QUESTION

function loadQuestion() {
    answered = false;

    const q = questions[currentQuestion];

    document.getElementById("questionNumber").textContent =
        "Question " + (currentQuestion + 1) +
        " of " + questions.length;

    document.getElementById("question").textContent = q.question;

    document.getElementById("feedback").textContent = "";

    document.getElementById("nextButton").disabled = true;

    const optionsDiv = document.getElementById("options");

    optionsDiv.innerHTML = "";

    q.options.forEach((option, index) => {
        const button = document.createElement("button");

        button.textContent = option;
        button.className = "option";

        button.onclick = () => checkAnswer(index, button);

        optionsDiv.appendChild(button);
    });
}


// CHECK ANSWER

function checkAnswer(selected, selectedButton) {
    if (answered) return;

    answered = true;

    const correctAnswer = questions[currentQuestion].answer;

    const allOptions = document.querySelectorAll(".option");

    allOptions.forEach((button, index) => {
        button.disabled = true;

        if (index === correctAnswer) {
            button.classList.add("correct");
        }
    });

    if (selected === correctAnswer) {
        userScore++;

        document.getElementById("feedback").textContent =
            "Correct Answer!";
    } else {
        selectedButton.classList.add("incorrect");

        document.getElementById("feedback").textContent =
            "Incorrect! The correct answer is highlighted.";
    }

    document.getElementById("nextButton").disabled = false;
}


// NEXT QUESTION

function nextQuestion() {
    if (!answered) return;

    currentQuestion++;

    if (currentQuestion < questions.length) {
        loadQuestion();
    } else {
        document.getElementById("question").textContent =
            "Quiz Completed!";

        document.getElementById("questionNumber").textContent =
            "You have completed all questions.";

        document.getElementById("options").innerHTML = "";

        document.getElementById("feedback").textContent = "";

        document.getElementById("nextButton").style.display = "none";

        document.getElementById("score").textContent =
            "Your Score: " + userScore + " / " + questions.length;
    }
}


// START QUIZ

loadQuestion();


// UPDATE RESULTS WHEN NEW SIMULATION DATA ARRIVES

function updateResults(newData) {
    simulationData = newData;

    displayStatistics();

    cwndChart.data.labels = simulationData.rtt;
    cwndChart.data.datasets[0].data = simulationData.cwnd;

    cwndChart.update();
}