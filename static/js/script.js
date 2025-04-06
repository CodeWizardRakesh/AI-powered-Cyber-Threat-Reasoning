document.addEventListener("DOMContentLoaded", function() {
    let commandInput = document.getElementById("command");
    let outputDiv = document.getElementById("output");

    if (commandInput) {
        commandInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                let command = commandInput.value.trim();
                if (command) {
                    outputDiv.innerHTML += `<p>> ${command}</p>`;
                    processCommand(command);
                }
                commandInput.value = "";
                outputDiv.scrollTop = outputDiv.scrollHeight;
            }
        });
    }

    function processCommand(command) {
        let response = "";
        if (command.toLowerCase() === "status") {
            response = "System Operational. Threat Level: LOW.";
        } else if (command.toLowerCase() === "scan") {
            response = "Scanning network for anomalies...";
        } else if (command.toLowerCase() === "exit") {
            response = "Terminating session...";
        } else {
            response = "Unknown command.";
        }
        outputDiv.innerHTML += `<p>${response}</p>`;
    }

    // Stream the threat report if filename is available
    const reportDiv = document.getElementById("threat-report");
    const downloadBtn = document.getElementById("download-btn");
    if (reportDiv && typeof filename !== "undefined" && filename) {
        console.log("Streaming report for filename:", filename);
        const eventSource = new EventSource(`/stream-report?filename=${encodeURIComponent(filename)}`);
        
        let currentSection = null;
        const summaryDiv = document.getElementById("summary");
        const patternsDiv = document.getElementById("patterns");
        const actionsDiv = document.getElementById("actions");

        eventSource.onmessage = function(event) {
            const word = event.data.trim();
            console.log("Received data:", word);

            // Switch sections based on delimiters
            if (word === "SUMMARY_START") {
                currentSection = "summary";
            } else if (word === "SUMMARY_END") {
                currentSection = null;
            } else if (word === "PATTERNS_START") {
                currentSection = "patterns";
            } else if (word === "PATTERNS_END") {
                currentSection = null;
            } else if (word === "ACTIONS_START") {
                currentSection = "actions";
            } else if (word === "ACTIONS_END") {
                currentSection = null;
            } else if (currentSection) {
                // Append word to the current section
                if (currentSection === "summary") {
                    summaryDiv.innerHTML += ` ${word}`;
                } else if (currentSection === "patterns") {
                    patternsDiv.innerHTML += ` ${word}`;
                } else if (currentSection === "actions") {
                    actionsDiv.innerHTML += ` ${word}`;
                }
            }

            reportDiv.scrollTop = reportDiv.scrollHeight; // Auto-scroll
        };

        eventSource.onerror = function() {
            console.log("Stream ended or error occurred");
            reportDiv.innerHTML += "\n[Report generation complete]";
            downloadBtn.style.display = "block"; // Show download button
            eventSource.close();
        };
    }
});