const express = require('express');
const router = express.Router();
const axios = require('axios');

// Render the chat page
router.get('/', (req, res) => {
    res.render('index'); // Renders your EJS template
});

// Handle chat message submission
router.post('/chat', async (req, res) => {
    const userInput = req.body.message;

    try {
        const personalityPrompt = `- Your role: Your Name Is JackGPT. You have a lot of knowledge on IT and can give any answers to any questions. Max Response Limit 500 characters. - User Message: ${userInput}`;
        
        // API call to your AI service
        const response = await axios.get(`https://api.kastg.xyz/api/ai/chatgptV4?prompt=${encodeURIComponent(personalityPrompt)}&key=Kastg_WFWhKBt93k6sobHi6uTC_free`);
        
        const botResponse = response.data.result[0]?.response || "Sorry, I could not get a response from the AI.";
        res.json({ response: botResponse });
    } catch (error) {
        console.error("Error fetching AI response:", error);
        res.status(500).json({ response: "Sorry, something went wrong. Please try again later." });
    }
});

// Handle image generation requests
router.post('/generate-image', async (req, res) => {
    const userInput = req.body.message;

    try {
        const negativePrompt = encodeURIComponent("(worst quality, low quality, normal quality, lowres...)");
        const apiUrl = `https://api.kastg.xyz/api/ai/flux?prompt=${encodeURIComponent(userInput)}&ratio=square&n_p=${negativePrompt}&key=Kastg_WFWhKBt93k6sobHi6uTC_free`;
        
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.status === 'true' && data.result.length > 0) {
            const imageUrls = data.result.map(item => item.url);
            res.json({ images: imageUrls });
        } else {
            res.status(400).json({ response: "Sorry, I could not generate images." });
        }
    } catch (error) {
        console.error("Error fetching images:", error);
        res.status(500).json({ response: "Sorry, something went wrong. Please try again later." });
    }
});

module.exports = router;
