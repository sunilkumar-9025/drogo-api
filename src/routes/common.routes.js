const { Router } = require("express");
const { viewFile } = require("../controllers/common.controller");

const router = Router();


router.get("/:filePath(*)", viewFile);

module.exports = router;
