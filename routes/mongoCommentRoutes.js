const express = require("express");
const router = express.Router();
const { getCommentsByProduct, createComment } = require("../controllers/mongoCommentController");
// 🧾 Get nested comments for a product
router.get('/comments/:productId', getCommentsByProduct);

const { verifyToken } = require('../middlewares/authMiddleware');
router.post('/comments', verifyToken, createComment);

module.exports = router;
