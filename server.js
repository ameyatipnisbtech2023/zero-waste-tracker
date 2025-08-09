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

// Office Schema
const officeSchema = new mongoose.Schema({
    officeName: String,
    department: String,
    contactPerson: String,
    contactEmail: String,
    totalEmployees: Number,
    pantryStatus: String,
    restroomsStatus: String,
    meetingRoomsStatus: String,
    eventsStatus: String,
    premisesStatus: String,
    overallProgress: Number,
    certificateDate: String,
    notes: String
});

const Office = mongoose.model('Office', officeSchema);

// Office API Routes
app.get('/api/offices', async (req, res) => {
    try {
        const offices = await Office.find();
        res.json(offices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/offices', async (req, res) => {
    try {
        const newOffice = new Office(req.body);
        await newOffice.save();
        res.json(newOffice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/offices/:id', async (req, res) => {
    try {
        await Office.findByIdAndDelete(req.params.id);
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
