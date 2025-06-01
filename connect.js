const mongoose = require('mongoose');

function connectToMongoDB(url){
    mongoose.connect(url)
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.error('MongoDB connection error:', err));
}

module.exports = {
     connectToMongoDB,
} 