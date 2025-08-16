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

// Helper function to compute Certification Status
function getCertificationStatus(percent) {
    const p = parseInt(percent);
    if (p >= 90) return "Platinum";
    if (p >= 80) return "Gold";
    if (p >= 70) return "Silver";
    if (p >= 60) return "Bronze";
    if (p >= 50) return "Certified";
    return "Not Certified";
}

const officeSchema = new mongoose.Schema({
    officeName: String,
    department: String,
    contactPerson: String,
    contactEmail: String,
    totalEmployees: Number,

    pantryStatus: { type: Map, of: String },
    restroomsStatus: { type: Map, of: String },
    meetingRoomsStatus: { type: Map, of: String },
    eventsStatus: { type: Map, of: String },
    premisesStatus: { type: Map, of: String },

    certificateDate: String,

    completionPercent: { type: Number, default: 0 },
    certificationStatus: { type: String, default: "Not Certified" }
});

const Office = mongoose.model('Office', officeSchema);

// Utility to calculate completion % and certification status
function computeCompletion(data) {
    const allStatuses = [
        ...Object.values(data.pantryStatus || {}),
        ...Object.values(data.restroomsStatus || {}),
        ...Object.values(data.meetingRoomsStatus || {}),
        ...Object.values(data.eventsStatus || {}),
        ...Object.values(data.premisesStatus || {})
    ];
    const implementedCount = allStatuses.filter(s => s === "Implemented").length;
    const percent = ((implementedCount / 25) * 100).toFixed(0);
    return {
        completionPercent: Number(percent),
        certificationStatus: getCertificationStatus(percent)
    };
}

function computeCompletionAndCertification(body) {
    const categories = [
        body.pantryStatus,
        body.restroomsStatus,
        body.meetingRoomsStatus,
        body.eventsStatus,
        body.premisesStatus
    ];

    let implemented = 0;
    categories.forEach(cat => {
        if (cat) {
            implemented += Object.values(cat).filter(s => s === "Implemented").length;
        }
    });

    const percent = Math.round((implemented / 25) * 100);

    let status = "Not Certified";
    if (percent >= 90) status = "Platinum";
    else if (percent >= 80) status = "Gold";
    else if (percent >= 70) status = "Silver";
    else if (percent >= 60) status = "Bronze";
    else if (percent >= 50) status = "Certified";

    return { percent, status };
}

// Routes
app.get('/api/offices', async (req, res) => {
    try {
        const offices = await Office.find();
        res.json(offices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/offices/:id', async (req, res) => {
    try {
        const office = await Office.findById(req.params.id);
        if (!office) return res.status(404).json({ error: 'Office not found' });
        res.json(office);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/offices', async (req, res) => {
    try {
        const { percent, status } = computeCompletionAndCertification(req.body);
        req.body.completionPercent = percent;
        req.body.certificationStatus = status;

        const newOffice = new Office(req.body);
        await newOffice.save();
        res.json(newOffice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/offices/:id', async (req, res) => {
    try {
        const { percent, status } = computeCompletionAndCertification(req.body);
        req.body.completionPercent = percent;
        req.body.certificationStatus = status;

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

app.delete('/api/offices/:id', async (req, res) => {
    try {
        const deleted = await Office.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Office not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
