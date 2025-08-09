const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Mongoose Schema & Model
const entrySchema = new mongoose.Schema({
    name: String,
    category: String,
    quantity: Number
});
const Entry = mongoose.model('Entry', entrySchema);

// Routes
app.get('/api/entries', async (req, res) => {
    try {
        const entries = await Entry.find();
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/entries', async (req, res) => {
    try {
        const newEntry = new Entry(req.body);
        await newEntry.save();
        res.json(newEntry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/entries/:id', async (req, res) => {
    try {
        const updated = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/entries/:id', async (req, res) => {
    try {
        await Entry.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
