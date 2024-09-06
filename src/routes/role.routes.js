const { Router } = require("express");
const {
  addRole,
  updateRole,
  deleteRole,
  getRoles,
} = require("../controllers/role.controller");

const router = Router();

router.post("/create", addRole);
router.post("/update", updateRole);
router.delete("/delete/:userId/:id", deleteRole);
router.get("/get/:userId", getRoles);
module.exports = router;
