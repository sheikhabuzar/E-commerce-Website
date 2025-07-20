const { Product, Like, Comment, User } = require('../models');
const { Op } = require('sequelize');
const { getProductDetailsOptimized } = require('../services/productDetailsService');

// CREATE Product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const sizesRaw = req.body.sizes;
    const sizes = Array.isArray(sizesRaw)
      ? sizesRaw
      : typeof sizesRaw === 'string'
        ? sizesRaw.split(',').map(s => s.trim())
        : [];

    const image = req.file ? req.file.filename : null;

    const product = await Product.create({
      name,
      description,
      price,
      image,
      stock,
      category,
      sizes
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Product creation failed" });
  }
};
exports.getAllProducts = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    if (limit <= 0) return res.status(400).json({ error: "Limit must be > 0" });
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const {
      search = '',
      size: sizeQuery,
      priceMin,
      priceMax,
      stock: stockFilter,
      category,
      sortType = 'createdAt',
      orderBy = 'DESC'
    } = req.query;

    const where = {};

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (category) {
      where.category = category;
    }
    if (sizeQuery && typeof sizeQuery === 'string') {
      const sizeArray = sizeQuery.split(',').map(s => s.trim()).filter(Boolean);
      if (sizeArray.length > 0) {
        where.sizes = { [Op.overlap]: sizeArray };
      }
    }
    if (!isNaN(priceMin) || !isNaN(priceMax)) {
      where.price = {};
      if (!isNaN(priceMin)) where.price[Op.gte] = parseFloat(priceMin);
      if (!isNaN(priceMax)) where.price[Op.lte] = parseFloat(priceMax);
    }
    if (stockFilter === 'in') {
      where.stock = { [Op.gt]: 0 };
    } else if (stockFilter === 'out') {
      where.stock = 0;
    }

    const order = [[sortType === 'bestSelling' ? 'stock' : sortType, orderBy.toUpperCase()], ['id', orderBy.toUpperCase()]];

    // Log for debugging
    console.log(`Product fetch: Page ${page}, Limit ${limit}, Filters:`, where);

    const { rows: products, count: total } = await Product.findAndCountAll({
      where,
      attributes: ['id', 'name', 'price', 'image', 'stock', 'category', 'sizes'],
      order,
      limit,
      offset,
      logging: false
    });

    res.status(200).json({
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      count: products.length,
      total
    });
  } catch (err) {
    console.error("💥 Error in GetProducts:", err, "Params:", req.query);
    res.status(500).json({ message: "Server error", details: err.message });
  }
};
// GET by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

// UPDATE Product
exports.updateProduct = async (req, res) => {
  try {
    const sizesRaw = req.body.sizes;
    const sizes = Array.isArray(sizesRaw)
      ? sizesRaw
      : typeof sizesRaw === 'string'
        ? sizesRaw.split(',').map(s => s.trim())
        : [];

    const { name, description, price, stock, category } = req.body;
    const image = req.file ? req.file.filename : req.body.image;

    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    await product.update({
      name,
      description,
      price,
      image,
      stock,
      category,
      sizes
    });

    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Product update failed" });
  }
};

// DELETE Product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    await product.destroy();
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Product delete failed" });
  }
};

// TOGGLE Like/Unlike
exports.toggleProductLike = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const existingLike = await Like.findOne({ where: { userId, productId } });

    if (existingLike) {
      await existingLike.destroy();
      return res.json({ liked: false, message: 'Product unliked' });
    } else {
      await Like.create({ userId, productId });
      return res.json({ liked: true, message: 'Product liked' });
    }
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};

// GET Likes + Status
exports.getProductLikes = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const totalLikes = await Like.count({ where: { productId } });
    const userLiked = await Like.findOne({ where: { productId, userId } });

    res.json({
      totalLikes,
      likedByCurrentUser: !!userLiked
    });
  } catch (err) {
    console.error("Error fetching likes:", err);
    res.status(500).json({ error: "Failed to fetch like data" });
  }
};

// GET Full Product Detail (with comments)
exports.getProductFullDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user?.id || null;

    const productDetail = await getProductDetailsOptimized(productId, userId);
    if (!productDetail) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const rootComments = await Comment.findAll({
      where: { productId, parentCommentId: null },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']]
    });

    productDetail.comments = rootComments;
    res.json(productDetail);
  } catch (err) {
    console.error("❌ Error in getProductFullDetail:", err);
    res.status(500).json({ error: "Failed to fetch product detail" });
  }
};

//console.log("getProductFullDetail loaded", typeof exports.getProductFullDetail);
