const mongoose = require('mongoose');
const fs = require('fs');
const path = require("path");

// Enable debug mode
mongoose.set('debug', false);
mongoose.set("strictQuery", false);

// Cấu hình kết nối
const mongoURI = process.env.PRO_MONGO_CONNECTION_STRING || "mongodb://127.0.0.1:27017";
const dbName = process.env.PRO_MONGO_DB_NAME || 'tsc-server-tool';

const options = {
    dbName: dbName,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
    connectTimeoutMS: 30000
};

// Kết nối với error handling chi tiết
mongoose.connect(mongoURI, options)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully');
        console.log('📡 Database:', dbName);
        console.log('🔗 Connection URL:', mongoURI);
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        
        if (err.name === 'MongoServerError') {
            console.error('Server Error Code:', err.code);
            console.error('Server Error Message:', err.errmsg);
        }
        
        if (err.name === 'MongoError') {
            console.error('Driver Error Code:', err.code);
            console.error('Driver Error Message:', err.message);
        }
    });

// Monitor connection events
mongoose.connection.on('connected', () => {
    console.log('🟢 Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed through app termination');
    process.exit(0);
});

// Initialize the schemas variable
let schemas = null;

/**
 * Function to get the database model(s)
 * @param {string|string[]} modelName - The name(s) of the model(s) to retrieve
 * @returns {Object|Object[]} - The requested model(s)
 */
module.exports = function getDb(modelName) {
  if (!schemas) {
    var files = fs.readdirSync('./schemas');
    schemas = {};
    for (var i in files) {
      var schemaPath = './schemas' + '/' + files[i];
      if (!fs.statSync(schemaPath).isDirectory()) {
        var name = path.parse(schemaPath).name;
        let schema = require('.' + schemaPath);
        schemas[name] = mongoose.model(name, schema);
      }
    }
  }

  if (!modelName) {
    return schemas;
  }

  if (Array.isArray(modelName)) {
    return modelName.map(name => {
      return schemas[name];
    });
  } else {
    return schemas[modelName];
  }
}