// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Schema
const officeSchema = new mongoose.Schema({
    officeName: { type: String, required: true },
    department: String,
    contactPerson: String,
    contactEmail: String,
    totalEmployees: Number,
    pantryStatus: String,
    restroomsStatus: String,
    meetingRoomsStatus: String,
    eventsStatus: String,
    premisesStatus: String,
    certificateDate: String,
    notes: String
});
const Office = mongoose.model('Office', officeSchema);

// API routes
app.get('/api/offices', async (req, res) => {
    const offices = await Office.find();
    res.json(offices);
});

app.get('/api/offices/:id', async (req, res) => {
    const office = await Office.findById(req.params.id);
    res.json(office);
});

app.post('/api/offices', async (req, res) => {
    const newOffice = new Office(req.body);
    await newOffice.save();
    res.status(201).json(newOffice);
});

app.put('/api/offices/:id', async (req, res) => {
    const updated = await Office.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

app.delete('/api/offices/:id', async (req, res) => {
    await Office.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
