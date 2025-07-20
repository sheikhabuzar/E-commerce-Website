const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const commentController = require('../controllers/commentController');
const likeController = require('../controllers/likeController'); // ✅ Correct controller for likes

// Set storage destination and filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

const {
  createProduct, 
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductFullDetail
} = require('../controllers/productController');

const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// ✅ PUBLIC ROUTES (Specific → General Order Matters)
router.get('/', getAllProducts);

// ✅ Place this BEFORE `/:id`
router.get('/:id/details', verifyToken, getProductFullDetail);

// ✅ Comments & Likes (Also BEFORE `/:id`)
router.get('/:productId/comments', commentController.getCommentsForProduct);
router.get('/:productId/likes', verifyToken, likeController.getLikeStatus);
router.post('/:productId/like', verifyToken, likeController.toggleLike);

// ✅ General ID route (must be LAST)
router.get('/:id', getProductById);

// ✅ ADMIN ROUTES
router.post('/', verifyToken, isAdmin, upload.single('image'), createProduct);
router.put('/:id', verifyToken, isAdmin, updateProduct);
router.delete('/:id', verifyToken, isAdmin, deleteProduct);

module.exports = router;
