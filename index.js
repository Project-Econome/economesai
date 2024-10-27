const express = require("express");
const path = require("path");
const chatRouter = require("./routes/chat"); // Import the chat router
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', chatRouter); // Mount the chat router

app.post('/save-chat', (req, res) => {
    const { userId, messages } = req.body;

    // Here you would typically save the messages to a database
    console.log(`Received chat history from ${userId}:`, messages);

    // Respond with a success message
    res.status(200).json({ message: 'Chat history saved successfully.' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

