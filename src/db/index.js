const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URI || "", {
  serverSelectionTimeoutMS: 0,
});

const db = client.db(process.env.DB_NAME);

const connectDB = async () => {
  try {
    await client.connect();
    console.log('MongoDB connected')
  } catch (error) {
    console.error("MongoDB connection Failed", error);
  }
};

const closeDB = async () => {
  // try {
  //   await client.close();
  // } catch (error) {
  //   console.error("MongoDB Close Failed", error);
  // }
};

module.exports = { db, connectDB, closeDB };
