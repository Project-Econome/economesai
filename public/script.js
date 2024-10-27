document.addEventListener('DOMContentLoaded', () => {
    const messageHistory = [];
    const imageAliases = ["imagine", "visualize", "picture", "create", "generate", "draw"];

    // Generate a unique ID for the user if it doesn't exist
    if (!sessionStorage.getItem('userId')) {
        sessionStorage.setItem('userId', 'user_' + Date.now());
    }
    const userId = sessionStorage.getItem('userId');

    const welcomeMessage = "Hello! I Am Fiji. To get started, send me a message or ask me to create an image!";
    appendMessage("bot", welcomeMessage, true);
    updateMessageHistory('bot', welcomeMessage);

    document.getElementById("chat-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const userInput = document.getElementById("user-input").value.trim();
        if (!userInput) return;

        appendMessage("user", userInput);
        updateMessageHistory('user', userInput);

        const foundAlias = imageAliases.find(alias => userInput.toLowerCase().startsWith(alias));
        if (foundAlias) {
            await fetchImageResponse(userInput.slice(foundAlias.length).trim());
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
        messageContent.innerHTML = message.replace(/\n/g, '<br>');
        messageElement.appendChild(messageContent);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Save message to history
        messageHistory.push({ sender, message, timestamp: new Date() });
        saveChatHistory(userId, messageHistory);
    }

    function updateMessageHistory(sender, message) {
        console.log(`${sender}: ${message}`);
        // You can add more logic here if needed.
    }

    async function fetchBotResponse(userInput) {
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, message: userInput }) // Include userId
            });

            const data = await response.json();
            appendMessage("bot", data.response);
        } catch (error) {
            console.error("Error fetching the bot response:", error);
            appendMessage("bot", "Sorry, something went wrong. Please try again later.");
        }
    }

    async function fetchImageResponse(prompt) {
        try {
            const response = await fetch('/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, message: prompt }) // Include userId
            });

            const data = await response.json();
            if (data.images) {
                displayImages(data.images);
                data.images.forEach(image => appendMessage("bot", image));
            } else {
                appendMessage("bot", "Sorry, I could not generate images.");
            }
        } catch (error) {
            console.error("Error fetching images:", error);
            appendMessage("bot", "Sorry, something went wrong. Please try again later.");
        }
    }

    function saveChatHistory(userId, messages) {
        fetch('/save-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, messages })
        });
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
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
