import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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

    // Certification status logic
    let status = `<span style="color:#999;">Not Certified</span>`;
    if (percent >= 88) status = `<span style="color:darkslategray;">🔘 Platinum</span>`;
    else if (percent >= 72) status = `<span style="color:gold;">🥇 Gold</span>`;
    else if (percent >= 56) status = `<span style="color:silver;">🥈 Silver</span>`;
    else if (percent >= 40) status = `<span style="color:#cd7f32;">🥉 Bronze</span>`;

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

// Certificate eligibility check
app.get('/api/offices/:id/certificate-check', async (req, res) => {
  try {
    const office = await Office.findById(req.params.id);
    if (!office) return res.status(404).json({ message: "Office not found" });

    // Use backend completionPercent
    if (office.completionPercent < 40) {
      return res.json({ certified: false, message: "Office space not yet certified" });
    }

    return res.json({ certified: true, message: "Generating your certificate... please wait." });
  } catch (err) {
    res.status(500).json({ message: "Error checking certificate", error: err.message });
  }
});

app.get("/api/offices/:id/certificate", async (req, res) => {
  try {
    const office = await Office.findById(req.params.id);
    if (!office) return res.status(404).send("Office not found");

    // Only allow Bronze, Silver, Gold, Platinum
    const validStatuses = ["Bronze", "Silver", "Gold", "Platinum"];
    if (!validStatuses.includes(office.certificationStatus.replace(/<[^>]*>/g, ""))) {
      return res.status(400).send("Office not eligible for certificate");
    }

    // Load the PDF template
    const templatePath = path.join(__dirname, "certificate_template.pdf");
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Get first page of template
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { height } = firstPage.getSize();

    // Clean certification status (strip HTML tags if any)
    const cleanStatus = office.certificationStatus.replace(/<[^>]*>/g, "");

    // Motivational message
    const messages = {
      Bronze: "Great start! You’ve taken the first steps towards sustainability.",
      Silver: "Commendable progress! Your efforts are making a real difference.",
      Gold: "Outstanding commitment! You’re setting an inspiring standard.",
      Platinum: "Exemplary achievement! You are a true leader in Zero Waste practices."
    };
    const message = messages[cleanStatus] || "";

    // Draw dynamic fields (adjust x, y to match your template blanks)
    firstPage.drawText(`Office: ${office.officeName}`, {
      x: 200, y: height - 250, size: 14, font, color: rgb(0, 0, 0),
    });
    firstPage.drawText(`Department: ${office.department}`, {
      x: 200, y: height - 280, size: 14, font, color: rgb(0, 0, 0),
    });
    firstPage.drawText(`Certification: ${cleanStatus}`, {
      x: 200, y: height - 310, size: 14, font, color: rgb(0.2, 0.2, 0.2),
    });
    firstPage.drawText(`Completion: ${office.completionPercent}%`, {
      x: 200, y: height - 340, size: 14, font, color: rgb(0, 0.4, 0),
    });
    firstPage.drawText(message, {
      x: 100, y: height - 380, size: 12, font, color: rgb(0, 0, 0),
    });
    firstPage.drawText(`Issued on: ${office.certificateDate || new Date().toLocaleDateString()}`, {
      x: 200, y: 80, size: 10, font, color: rgb(0, 0, 0),
    });

    // Save modified PDF
    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Disposition", `attachment; filename=certificate_${office.officeName}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating certificate");
  }
});





