const { Router } = require("express");
const { upload } = require("../middlewares/multer.middleware");

const {
  createUser,
  loginUser,
  getUsers,
  deleteUser,
  updateUser,
} = require("../controllers/user.controller");

const router = Router();

router.post("/login", loginUser);

router.get("/get", getUsers);
router.post("/create", upload.single("file"), createUser);
router.delete("/delete/:id", deleteUser);
router.post("/update", upload.single("file"), updateUser);


module.exports = router;
