const express = require('express');
const router = express.Router();
const axios = require('axios');
const marked = require('marked'); // Marked library for Markdown
const fs = require('fs'); // File system module
const path = require('path'); // Module to handle file paths

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config;
try {
    config = JSON.parse(fs.readFileSync(configPath));
} catch (error) {
    console.error("Error loading config file:", error);
    config = {
        personality: { name: "AI", description: "A helpful assistant" },
        nsfw: { enabled: true, message: "Content not allowed." }
    };
}

// Function to convert markdown-like links to HTML links
function convertMarkdownToHtml(text) {
    try {
        return marked.parse(text); // Use marked to convert the full Markdown content to HTML
    } catch (error) {
        console.error("Error converting Markdown to HTML:", error);
        return text; // Return the original text in case of an error
    }
}

// Function to replace '/n' with nothing and '\n' with HTML line breaks
function sanitizeResponse(text) {
    return text.replace(/\/n/g, '').replace(/\n/g, '<br>'); // Remove '/n' and replace '\n' with <br>
}

// Render the chat page
router.get('/', (req, res) => {
    res.render('index'); // Renders your EJS template
});

// Function to get or create a chat history file
function getChatFile(userId) {
    const chatHistoryDir = path.join(__dirname, 'chat_history'); // Directory to save chat history
    const filePath = path.join(chatHistoryDir, `${userId}_chat_history.json`); // Use userId for file naming

    // Create the directory if it doesn't exist
    if (!fs.existsSync(chatHistoryDir)) {
        fs.mkdirSync(chatHistoryDir, { recursive: true }); // Create directory recursively
    }

    return filePath;
}

// Function to save chat history (appends new message to existing file)
function saveChatHistory(filePath, userInput, botResponse) {
    const newEntry = {
        timestamp: new Date().toISOString(),
        userInput: userInput,
        botResponse: botResponse
    };

    try {
        // Check if file already exists
        if (fs.existsSync(filePath)) {
            // Read existing entries and append the new one
            const existingData = JSON.parse(fs.readFileSync(filePath));
            existingData.push(newEntry);
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2)); // Append new entry
        } else {
            // Create a new file with the first entry
            fs.writeFileSync(filePath, JSON.stringify([newEntry], null, 2)); // Create new file with first entry
        }
    } catch (error) {
        console.error("Error saving chat history:", error);
    }
}

// Handle chat message submission
router.post('/chat', async (req, res) => {
    const userId = req.body.userId;
    const userInput = req.body.message;

    console.log("Received message:", userInput);

    try {
        const filePath = getChatFile(userId); // Get or create chat history file
        const existingHistory = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath)) : [];

        const contextMessages = existingHistory.map(entry => `User: ${entry.userInput}\nAI: ${entry.botResponse}`).join('\n');
        const personalityPrompt = `- Your role: ${config.personality.name}. ${config.personality.description}\n- Previous Messages:\n${contextMessages}\n- User Message: ${userInput}`;

        const response = await axios.get(`https://api.kastg.xyz/api/ai/chatgptV4?prompt=${encodeURIComponent(personalityPrompt)}&key=Kastg_WFWhKBt93k6sobHi6uTC_free`);
        let botResponse = response.data.result[0]?.response || "Sorry, I could not get a response from the AI.";

        if (config.nsfw.enabled && /nsfw|sexual|violence/i.test(botResponse)) {
            botResponse = config.nsfw.message;
        }

        botResponse = convertMarkdownToHtml(botResponse);
        botResponse = sanitizeResponse(botResponse);

        saveChatHistory(filePath, userInput, botResponse);

        console.log("Chat history updated in:", filePath);
        res.json({ response: botResponse });
    } catch (error) {
        console.error("Error fetching AI response:", error);
        res.status(500).json({ response: "Sorry, something went wrong. Please try again later." });
    }
});

// Handle image generation requests
router.post('/generate-image', async (req, res) => {
    const userId = req.body.userId;
    const userInput = req.body.message;

    console.log("Received image generation request:", userInput);

    try {
        const negativePrompt = encodeURIComponent("(worst quality, low quality, normal quality, lowres...)");
        const apiUrl = `https://api.kastg.xyz/api/ai/flux?prompt=${encodeURIComponent(userInput)}&ratio=square&n_p=${negativePrompt}&key=Kastg_WFWhKBt93k6sobHi6uTC_free`;
        
        const response = await axios.get(apiUrl);
        console.log("Full API Response:", response.data);

        const data = response.data;

        if (data && data.status === 'true' && data.result && data.result.length > 0) {
            const imageUrls = data.result.map(item => item.url);
            console.log("Generated Images:", imageUrls);

            const filePath = getChatFile(userId);
            const imageResponse = "Image generated successfully!";
            saveChatHistory(filePath, userInput, imageResponse);

            res.json({ response: imageResponse });
        } else {
            console.error("Image generation failed:", data.message || "No result found");
            res.status(400).json({ response: "Sorry, I could not generate images." });
        }
    } catch (error) {
        console.error("Error fetching images:", error.message || error);
        res.status(500).json({ response: "Sorry, something went wrong. Please try again later." });
    }
});

module.exports = router;
