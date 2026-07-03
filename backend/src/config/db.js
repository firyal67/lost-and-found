const mongoose = require('mongoose'); //pour se connecter à Mongodb avec mongoose 

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message); //si la cnx echoue le serveur s'arrete
    process.exit(1);
  }
};

module.exports = connectDB;
