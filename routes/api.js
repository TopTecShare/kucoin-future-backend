const { Router } = require("express");

const apiController = require("../controllers/api");

const router = Router();

router.get("/api", apiController.findAll);
router.post("/api", apiController.update);
router.get("/balance", apiController.balance);
// router.get('/history', apiController.findAllUserActive);

// router.get('/users/clearchecked', apiController.clearChecked);

// router.post('/users', apiController.create);

// router.put('/users/:id', apiController.update);

// router.put('/users/:id/status', apiController.updateByField);

// router.delete('/users/:id', apiController.delete);

module.exports = router;
