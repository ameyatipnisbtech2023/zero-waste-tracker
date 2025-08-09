const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Example Schema
const EntrySchema = new mongoose.Schema({
  name: String,
  category: String,
  quantity: Number
});

const Entry = mongoose.model('Entry', EntrySchema);

// API routes
app.get('/api/entries', async (req, res) => {
  const entries = await Entry.find();
  res.json(entries);
});

app.post('/api/entries', async (req, res) => {
  const newEntry = new Entry(req.body);
  await newEntry.save();
  res.json({ message: 'Entry saved', entry: newEntry });
});

app.put('/api/entries/:id', async (req, res) => {
  const updatedEntry = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: 'Entry updated', entry: updatedEntry });
});

app.delete('/api/entries/:id', async (req, res) => {
  await Entry.findByIdAndDelete(req.params.id);
  res.json({ message: 'Entry deleted' });
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
