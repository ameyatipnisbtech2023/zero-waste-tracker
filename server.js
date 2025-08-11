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

const officeSchema = new mongoose.Schema({
  officeName: String,
  department: String,
  contactPerson: String,
  contactEmail: String,
  totalEmployees: Number,
  pantry: {
    platesCutlery: String,
    waterBottles: String,
    cupsGlasses: String,
    foodLeftovers: String,
    cleaners: String
  },
  restrooms: {
    tissuePapers: String,
    toiletRolls: String,
    sanitaryWaste: String,
    waterSavingDevices: String,
    cleaners: String
  },
  meetingRooms: {
    cupsGlasses: String,
    waterBottles: String,
    printoutsStationery: String,
    platesCutlery: String,
    cleaners: String
  },
  events: {
    venueStageDecorations: String,
    waterBottles: String,
    displaysBadges: String,
    foodWaste: String,
    platesCutlery: String
  },
  premises: {
    eWaste: String,
    gardenMatter: String,
    grayWater: String,
    stormWater: String,
    foodLeftovers: String
  },
  certificateDate: String,
  notes: String
});


const Office = mongoose.model('Office', officeSchema);

// ================= API ROUTES ================= //

// Get all offices
app.get('/api/offices', async (req, res) => {
    try {
        const offices = await Office.find();
        res.json(offices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single office by ID
app.get('/api/offices/:id', async (req, res) => {
    try {
        const office = await Office.findById(req.params.id);
        if (!office) return res.status(404).json({ error: 'Office not found' });
        res.json(office);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new office
app.post('/api/offices', async (req, res) => {
    try {
        const newOffice = new Office(req.body);
        await newOffice.save();
        res.json(newOffice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Office
app.put('/api/offices/:id', async (req, res) => {
    try {
        const updatedOffice = await Office.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedOffice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete office
app.delete('/api/offices/:id', async (req, res) => {
    try {
        const deleted = await Office.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Office not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
