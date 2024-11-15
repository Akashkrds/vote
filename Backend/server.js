const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/voting', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.log(err));

// Define User schema
const userSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  password: String,
  adhar: String,
  address: String,
  photo: String,
  role: { type: String, enum: ['Voter', 'Group'] },
  status: { type: Boolean, default: false },
  votes: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Register route
app.post('/api/register', async (req, res) => {
  const { name, mobile, password, cpassword, adhar, address, role, photo } = req.body;
  if (password !== cpassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ mobile });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Save user to database
  const newUser = new User({ name, mobile, password: hashedPassword, adhar, address, role, photo });
  await newUser.save();
  res.status(200).json({ message: 'Registration successful' });
});

// Login route
app.post('/api/login', async (req, res) => {
  const { mobile, password, role } = req.body;

  // Check if user exists
  const user = await User.findOne({ mobile, role });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Generate JWT token
  const token = jwt.sign({ id: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
  res.json({ message: "Login successful", token });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
