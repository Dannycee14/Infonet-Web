const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Example POST endpoint for bookings
app.post("/api/book", (req, res) => {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !phone || !service) {
        return res.status(400).json({ message: "Please fill all required fields." });
    }

    // Here you can save to a database or send an email
    console.log("📩 New Booking Request:", req.body);

    // Simulate success
    res.json({ message: "Your booking request was received! We’ll contact you shortly." });
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
