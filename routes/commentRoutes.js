const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// ✅ Protected route to post a comment or reply
router.post('/', verifyToken, commentController.createComment);

// ✅ Public route to get all comments and replies for a product
router.get('/api/products/:productId/comments', commentController.getCommentsForProduct);

module.exports = router;
