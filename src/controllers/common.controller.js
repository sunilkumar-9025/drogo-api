const { apiError } = require("../utils/common");
const path = require("path");

const viewFile = (req, res) => {
  try {
    const filePath = req.params.filePath;
    const fullPath = path.join(__dirname, "..", "..", filePath);
    res.sendFile(fullPath);
  } catch (error) {
    apiError(res, 500, error.message);
  }
};

module.exports = { viewFile };
