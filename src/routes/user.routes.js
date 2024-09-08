const { Router } = require("express");
const { upload } = require("../middlewares/multer.middleware");

const {
  createUser,
  loginUser,
  getUsers,
  deleteUser,
  updateUser,
  updateUserField,
} = require("../controllers/user.controller");

const router = Router();

router.post("/login", loginUser);

router.get("/get", getUsers);
router.post("/create", upload.single("files"), createUser);
router.delete("/delete/:id", deleteUser);
router.post("/update", upload.single("files"), updateUser);
router.post("/updateUser", updateUserField);

module.exports = router;
