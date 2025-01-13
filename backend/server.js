const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/AuthRoute');
const residentRoutes = require('./routes/ResidentRoute');  // Resident-related routes
const adminRoutes = require('./routes/AdminRoute');
const connectDB = require('./config/db');

dotenv.config();  // To load environment variables from .env file

const app = express();
connectDB();
// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:5173', // Allow requests only from your frontend
    credentials: true                // Enable credentials (if using cookies or authorization headers)
}));
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.error('Error connecting to MongoDB:', error));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resident', residentRoutes);
app.use('/api/admin', adminRoutes);

app.use('/static', express.static(__dirname + '/../frontend/public'));


// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


