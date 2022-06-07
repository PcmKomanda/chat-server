// Import mongoose.
const mongoose = require("mongoose");

// Connect to the database using environment variable.
mongoose.connect(process.env.DATABASE);

// Export mongoose.
var db = mongoose.connection;
module.exports = db;
