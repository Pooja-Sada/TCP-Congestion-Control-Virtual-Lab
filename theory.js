
document.addEventListener("DOMContentLoaded", function () {

    // TCP terminology information
    const terms = {
        cwnd: {
            title: "Congestion Window (cwnd)",
            description: "The congestion window controls how much data a sender can transmit into the network before receiving acknowledgements. TCP adjusts this value according to network conditions."
        },
        ssthresh: {
            title: "Slow Start Threshold (ssthresh)",
            description: "The slow start threshold determines when TCP changes from the Slow Start phase to the Congestion Avoidance phase."
        },
        rtt: {
            title: "Round Trip Time (RTT)",
            description: "RTT is the time taken for a data packet to travel to the receiver and for its acknowledgement to return to the sender."
        },
        ack: {
            title: "Acknowledgement (ACK)",
            description: "An ACK is a response sent by the receiver to confirm that data has been received successfully."
        }
    };

    const cards = document.querySelectorAll(".term-card");
    const explanation = document.getElementById("termExplanation");

    cards.forEach(function (card) {
        card.addEventListener("click", function () {
            const term = card.getAttribute("data-term");

            if (terms[term] && explanation) {
                explanation.innerHTML = `
                    <h3>${terms[term].title}</h3>
                    <p>${terms[term].description}</p>
                `;

                cards.forEach(c => c.classList.remove("selected"));
                card.classList.add("selected");
            }
        });
    });

    // Quiz interaction
    const options = document.querySelectorAll(".quiz-option");
    const feedback = document.getElementById("quizFeedback");

    options.forEach(function (option) {
        option.addEventListener("click", function () {

            if (option.dataset.answer === "correct") {
                feedback.textContent = "Correct! You understand the TCP concept.";
                option.classList.add("correct-choice");
            } else {
                feedback.textContent = "Not quite! Try revising the TCP fundamentals.";
                option.classList.add("wrong-choice");
            }

            options.forEach(o => o.disabled = true);
        });
    });

});
