require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
  return hashedPassword;
};

const checkPassword = async (password, hashedPassword, hashedPassword2) => {
  const match1 = await bcrypt.compare(password, hashedPassword);
  if (match1) return true;

  const match2 = await bcrypt.compare(password, hashedPassword2);
  return match2;
};

const apiError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    status: "Failed",
    errorMessage: message,
  });
};

const apiResponse = (res, statusCode, data) => {
  return res.status(statusCode).json({
    status: "Success",
    response: data,
  });
};

const convertToTitleCase = (string) => {
  string = string?.toLowerCase().replace(/\b\w/g, (letter) => {
    return letter?.toUpperCase();
  });
  return string;
};

const viewLocalFilePath = (req) => {
  return `${req.protocol}://${req.get("host")}/api/view/${req.file.path}`;
};

const getToken = async(id, email) => {
  return jwt.sign(
    {
      _id: id,
      email: email
    },
    process.env.TOKEN_SECRET,
    {
      expiresIn: process.env.TOKEN_EXPIRY,
    }
  );
};

module.exports = {
  hashPassword,
  checkPassword,
  apiError,
  apiResponse,
  convertToTitleCase,
  viewLocalFilePath,
  getToken,
};
