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
        console.log("Streaming report for filename:", filename); // Debug
        const eventSource = new EventSource(`/stream-report?filename=${encodeURIComponent(filename)}`);
        reportDiv.innerHTML = ""; // Clear previous content

        eventSource.onmessage = function(event) {
            console.log("Received data:", event.data); // Debug
            reportDiv.innerHTML += event.data + " "; // Append word with space
            reportDiv.scrollTop = reportDiv.scrollHeight; // Auto-scroll
        };

        eventSource.onerror = function() {
            console.log("Stream ended or error occurred"); // Debug
            reportDiv.innerHTML += "\n[Report generation complete]";
            eventSource.close();
        };
    }
});