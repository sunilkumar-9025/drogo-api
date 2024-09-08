require("dotenv").config();
const { ObjectId } = require("mongodb");
const { db } = require("../db");
const fs = require("fs");
const {
  hashPassword,
  checkPassword,
  apiError,
  apiResponse,
  convertToTitleCase,
  viewLocalFilePath,
  getToken,
  removeLocalFilePath,
} = require("../utils/common");
const { emailRegex, phoneRegex } = require("../utils/constants");
const {
  uploadOnCloudinary,
  removeOnCloudinary,
} = require("../utils/cloudinary");

const userCollection = db.collection("user");

const options = {
  httpOnly: true,
  secure: true,
};

//create user
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, createdBy } =
      req.body;

    if (
      [firstName, lastName, email, password, phoneNumber, createdBy].some(
        (field) => !field || field?.trim() === ""
      )
    ) {
      return apiError(res, 400, "All fields are required");
    }

    if (!emailRegex.test(email)) {
      return apiError(res, 400, "Invalid email format");
    }

    if (!phoneRegex.test(phoneNumber)) {
      return apiError(res, 400, "Phone number must be exactly 10 digits");
    }

    const existedUser = await userCollection.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existedUser) {
      return apiError(
        res,
        409,
        "User with email or phone number already exists"
      );
    }

    let image = { url: "", fileName: "" };
    if (process.env.LOCAL_UPLOAD === "true" && req.file) {
      image = {
        url: viewLocalFilePath(req),
        fileName: req.file.originalname,
      };
    } else if (req.file) {
      const upload = await uploadOnCloudinary(req.file.path);
      image = {
        url: upload?.url,
        fileName: req.file.originalname,
      };
    }

    const hashedPassword = await hashPassword(password);

    const obj = {
      firstName,
      lastName,
      email,
      phoneNumber,
      defaultPassword: hashedPassword,
      isActive: false,
      fullName: convertToTitleCase(firstName + " " + lastName),
      userId: "UR" + Math.floor(Math.random() * 10000),
      password: "",
      roles: [],
      token: "",
      createdAt: new Date(),
      updateAt: new Date(),
      lastLogin: "",
      otp: "",
      lastLogout: "",
      isTwoStep: false,
      loginCount: 0,
      createdBy: createdBy,
      userLogo: image,
    };

    const user = await userCollection.insertOne(obj);
    if (user.acknowledged) {
      delete obj.password;
      delete obj.defaultPassword;
      let data = { ...obj, _id: user._id };
      return apiResponse(res, 201, data);
    } else {
      return apiError(res, 400, "DB fetch error");
    }
  } catch (error) {
    return apiError(res, 500, error.message);
  }
};

const deleteAllUser = async (req, res) => {
  try {
    const deletedUser = await userCollection.deleteMany({});
    if (deletedUser.acknowledged) {
      let message = {
        message: "User deleted successfully",
        count: deletedUser.deletedCount,
      };
      apiResponse(res, 200, message);
    } else {
      apiError(res, 500, "Failed to delete user");
    }
  } catch (error) {
    let errorMessage = error.message;
    apiError(res, 500, errorMessage);
  }
};

const getUserById = async (req, res) => {
  try {
    let id = req.params.id;
    let user = await userCollection.findOne({ _id: new ObjectId(id) });
    if (user.acknowledged) {
      apiResponse(res, 200, user);
    } else {
      apiError(res, 500, "Failed to get user");
    }
  } catch (error) {
    let errorMessage = error.message;
    apiError(res, 500, errorMessage);
  }
};

const findUser = async (req, res) => {
  try {
    let search = req.query.search;

    let query = {
      $or: [
        { fullname: { $regex: search, $options: "i" } },
        { password: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const users = await userCollection.find(query).toArray();
    if (users.acknowledged) {
      apiResponse(res, 200, users);
    } else {
      apiError(res, 500, "Failed to find user");
    }
  } catch (error) {
    let errorMessage = error.message;
    apiError(res, 500, errorMessage);
  }
};

//login
const loginUser = async (req, res) => {
  try {
    let { username, password } = req.headers;

    console.log(username, password);
    const user = await userCollection.findOne({ email: username });

    if (user) {
      let isCorrectPassword = await checkPassword(
        password,
        user.defaultPassword,
        user.password
      );
      if (isCorrectPassword) {
        const token = await getToken(user._id, user.email);

        const userDetails = await userCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              token: token,
              loginCount: user.loginCount + 1,
              lastLogin: new Date(),
              activeRole:
                user.activeRole !== "" ? user.activeRole : user.roles[0]?.role,
            },
          }
        );

        delete user.password;
        delete user.defaultPassword;

        if (userDetails.acknowledged) {
          return res
            .status(200)
            .cookie("token", token, options)
            .json({
              status: "Success",
              response: { ...user, token: token },
            });
        } else {
          return apiError(res, 400, "DB fetch error");
        }
      } else {
        return apiError(res, 401, "Invalid credentials");
      }
    } else {
      return apiError(res, 401, "Invalid credentials");
    }
  } catch (error) {
    return apiError(res, 500, error.message);
  }
};

//get all users
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.headers.page) || 1;
    const limit = parseInt(req.headers.limit) || 10;
    const skip = (page - 1) * limit;
    const users = await userCollection
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();
    if (users) {
      const usersDetails = users?.map((user) => {
        delete user.password;
        return user;
      });

      const count = await userCollection.countDocuments({});

      return apiResponse(res, 200, { data: usersDetails, count });
    } else {
      return apiError(res, 400, "DB fetch error");
    }
  } catch (error) {
    return apiError(res, 500, error.message);
  }
};

//deleteUser
const deleteUser = async (req, res) => {
  try {
    let id = req.params.id;

    const user = await userCollection.findOne({ _id: new ObjectId(id) });

    if (user) {
      if (user.userLogo?.url !== "") {
        if (process.env.LOCAL_UPLOAD === "true") {
          let localpath = removeLocalFilePath(user?.userLogo?.url)
          fs.unlinkSync(localpath)
        } else {
          await removeOnCloudinary(user?.userLogo?.url);
        }
      }

      const deletedUser = await userCollection.deleteOne({
        _id: new ObjectId(id),
      });

      if (deletedUser.acknowledged) {
        let message = {
          message: "User deleted successfully",
          count: deletedUser.deletedCount,
        };

        return apiResponse(res, 200, message);
      } else {
        return apiError(res, 400, "DB fetch error");
      }
    } else {
      return apiError(res, 400, "User not found");
    }
  } catch (error) {
    return apiError(res, 500, error.message);
  }
};

//updateUser
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, createdBy, id } = req.body;

    if (
      [firstName, lastName, email, phoneNumber, createdBy].some(
        (field) => !field || field?.trim() === ""
      )
    ) {
      return apiError(res, 400, "All fields are required");
    }

    if (!emailRegex.test(email)) {
      return apiError(res, 400, "Invalid email format");
    }

    if (!phoneRegex.test(phoneNumber)) {
      return apiError(res, 400, "Phone number must be exactly 10 digits");
    }

    const user = await userCollection.findOne({ _id: new ObjectId(id) });

    if (user) {
      let image = user.userLogo;

      if (process.env.LOCAL_UPLOAD === "true" && req.file) {
        image = {
          url: viewLocalFilePath(req),
          fileName: req.file.originalname,
        };
        if (user?.userLogo?.url !== "") {
          let localpath = removeLocalFilePath(user?.userLogo?.url);
          fs.unlinkSync(localpath);
        }
      } else if (req.file) {
        user?.userLogo?.url !== "" &&
          (await removeOnCloudinary(user?.userLogo?.url));
        const upload = await uploadOnCloudinary(req.file.path);
        image = {
          url: upload?.url,
          fileName: req.file.originalname,
        };
      }

      const updatedUser = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            firstName: firstName,
            lastName: lastName,
            fullName: convertToTitleCase(firstName + " " + lastName),
            email: email,
            updatedBy: createdBy,
            phoneNumber: phoneNumber,
            updateAt: new Date(),
            userLogo: image,
          },
        }
      );

      if (updatedUser.acknowledged) {
        const user = await userCollection.findOne({ _id: new ObjectId(id) });
        delete user.password;
        delete user.defaultPassword;
        return apiResponse(res, 201, user);
      } else {
        return apiError(res, 400, "DB fetch error");
      }
    } else {
      return apiError(res, 400, "User not found");
    }
  } catch (error) {
    let errorMessage = error.message;
    return apiError(res, 500, errorMessage);
  }
};

const updateUserField = async (req, res) => {
  try {
    let body = req.body;
    let id = req.body.id;

    const user = await userCollection.findOne({ _id: new ObjectId(id) });

    if (user) {
      let updatedUser;
      if (body.password) {
        const hashedPassword = await hashPassword(body.password);
        updatedUser = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              defaultPassword: hashedPassword,
            },
          }
        );
      } else {
        updatedUser = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              isActive: body.isActive,
            },
          }
        );
      }

      const user = await userCollection.findOne({ _id: new ObjectId(id) });
      delete user.password;
      delete user.defaultPassword;
      return apiResponse(res, 201, user);
    } else {
      return apiError(res, 400, "User not found");
    }
  } catch (error) {
    return apiError(res, 500, error.message);
  }
};

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  deleteAllUser,
  getUsers,
  getUserById,
  findUser,
  loginUser,
  updateUserField,
};
