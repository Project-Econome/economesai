document.addEventListener('DOMContentLoaded', () => {
    const messageHistory = []; // Array to keep track of the last 15 messages

    document.getElementById("chat-form").addEventListener("submit", async function(event) {
        event.preventDefault();

        const userInput = document.getElementById("user-input").value.trim();
        if (!userInput) return;

        // Display user's message and update history
        appendMessage("user", userInput);
        updateMessageHistory('user', userInput);

        // Check if the message starts with "imagine"
        if (userInput.toLowerCase().startsWith("imagine")) {
            await fetchImageResponse(userInput.slice(8)); // Remove "imagine " from the prompt
        } else {
            await fetchBotResponse(userInput);
        }

        document.getElementById("user-input").value = "";
    });

    function appendMessage(sender, message, isInitial = false) {
        const chatBox = document.getElementById("chat-box");

        const messageElement = document.createElement("div");
        messageElement.classList.add("chat-message", `${sender}-message`);
        if (isInitial) messageElement.id = 'initial-message';

        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.textContent = message;

        messageElement.appendChild(messageContent);
        chatBox.appendChild(messageElement);

        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function updateMessageHistory(sender, message) {
        messageHistory.push({ sender, message });
        if (messageHistory.length > 15) messageHistory.shift(); // Keep only the last 15 messages
    }

    async function fetchBotResponse(userInput) {
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userInput })
            });

            const data = await response.json();
            appendMessage("bot", data.response);
            updateMessageHistory('bot', data.response);
        } catch (error) {
            console.error("Error fetching the bot response:", error);
            appendMessage("bot", "Sorry, something went wrong. Please try again later.");
        }
    }

    async function fetchImageResponse(prompt) {
        try {
            const response = await fetch('/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: prompt })
            });

            const data = await response.json();
            if (data.images) {
                displayImages(data.images); // Handle multiple images
            } else {
                appendMessage("bot", "Sorry, I could not generate images.");
            }
        } catch (error) {
            console.error("Error fetching images:", error);
            appendMessage("bot", "Sorry, something went wrong. Please try again later.");
        }
    }

    function displayImages(imageUrls) {
        const chatBox = document.getElementById("chat-box");
        const imagesContainer = document.createElement("div");
        imagesContainer.classList.add("images-grid");

        imageUrls.forEach(url => {
            const imgElement = document.createElement("img");
            imgElement.src = url;
            imgElement.alt = "Generated Image";
            imagesContainer.appendChild(imgElement);
        });

        chatBox.appendChild(imagesContainer);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
    }
});