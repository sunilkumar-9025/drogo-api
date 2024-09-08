require("dotenv").config();
const { connectDB, closeDB } = require("./db");
const app = require("./app");

const port = process.env.PORT || 8000;

const init = async () => {
  try {
    app.listen(port, async () => {
      await connectDB();
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.log(error);
  } finally {
    await closeDB();
  }
};

init();
