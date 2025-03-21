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
    if (reportDiv && typeof filename !== "undefined" && filename) {
        console.log("Streaming report for filename:", filename);
        const eventSource = new EventSource(`/stream-report?filename=${encodeURIComponent(filename)}`);
        
        let currentSection = "summary"; // Start with summary
        const summaryDiv = document.getElementById("summary");
        const patternsDiv = document.getElementById("patterns");
        const actionsDiv = document.getElementById("actions");

        eventSource.onmessage = function(event) {
            console.log("Received data:", event.data);
            const word = event.data.trim();

            // Switch sections based on keywords
            if (word === "Summary:") {
                currentSection = "summary";
                return; // Skip the label itself
            } else if (word === "Threat") {
                currentSection = "patterns";
                return; // Skip "Threat" (next word is "Patterns:")
            } else if (word === "Patterns:") {
                return; // Skip "Patterns:"
            } else if (word === "Recommended") {
                currentSection = "actions";
                return; // Skip "Recommended" (next word is "Actions:")
            } else if (word === "Actions:") {
                return; // Skip "Actions:"
            }

            // Append word to the correct section
            if (currentSection === "summary") {
                summaryDiv.innerHTML += ` ${word}`;
            } else if (currentSection === "patterns") {
                patternsDiv.innerHTML += ` ${word}`;
            } else if (currentSection === "actions") {
                actionsDiv.innerHTML += ` ${word}`;
            }

            reportDiv.scrollTop = reportDiv.scrollHeight; // Auto-scroll
        };

        eventSource.onerror = function() {
            console.log("Stream ended or error occurred");
            reportDiv.innerHTML += "<p>[Report generation complete]</p>";
            eventSource.close();
        };
    }
});