const { Like, Product } = require('../models');

exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    // Atomic toggle: try to destroy, if not found, create
    const destroyed = await Like.destroy({ where: { userId, productId } });
    if (destroyed) {
      return res.json({ message: 'Unliked' });
    } else {
      // Use findOrCreate to avoid race condition
      const [like, created] = await Like.findOrCreate({
        where: { userId, productId }
      });
      if (created) {
        return res.json({ message: 'Liked' });
      } else {
        // Already exists (should not happen), treat as liked
        return res.json({ message: 'Liked' });
      }
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};
exports.getLikeStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    const totalLikes = await Like.count({ where: { productId } });
    const liked = await Like.findOne({ where: { userId, productId } });

    res.json({
      totalLikes,
      likedByCurrentUser: !!liked
    });
  } catch (error) {
    console.error("Error getting like status:", error);
    res.status(500).json({ error: "Failed to fetch like status" });
  }
};
