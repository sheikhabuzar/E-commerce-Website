const { Comment, User, sequelize } = require('../models');

exports.createComment = async (req, res) => {
  const t = await sequelize.transaction({ isolationLevel: 'SERIALIZABLE' });
  try {
    const { content, productId, parentCommentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      await t.rollback();
      return res.status(401).json({ error: 'Unauthorized. No user ID found.' });
    }
    if (!content || !productId) {
      await t.rollback();
      return res.status(400).json({ error: 'Content and productId are required.' });
    }

    let depth = 0;
    let finalParentId = parentCommentId || null;

    if (parentCommentId) {
      const parentComment = await Comment.findByPk(parentCommentId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!parentComment) {
        await t.rollback();
        return res.status(404).json({ error: 'Parent comment not found' });
      }
      const parentDepth = parentComment.depth || 0;
      if (parentDepth >= 2) {
        depth = 2;
        finalParentId = parentComment.parentCommentId;
      } else {
        depth = parentDepth + 1;
      }
    }

    const newComment = await Comment.create({
      content,
      productId,
      userId,
      parentCommentId: finalParentId,
      depth
    }, { transaction: t });

    const fullComment = await Comment.findByPk(newComment.id, {
      include: [{ model: User, attributes: ['id', 'name'] }],
      transaction: t
    });

    await t.commit();
    res.status(201).json(fullComment);
  } catch (err) {
    await t.rollback();
    // If serialization error, ask client to retry
    if (err.parent && err.parent.code === '40001') {
      return res.status(409).json({ error: "Please retry your request" });
    }
    console.error("Error creating comment:", err);
    res.status(500).json({ error: 'Failed to create comment', details: err.message });
  }
};
exports.getCommentsForProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log(" Fetching comments for product:", productId);

    const allComments = await Comment.findAll({
      where: { productId },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']]
    });

    const commentMap = {};
    allComments.forEach(c => {
      commentMap[c.id] = { ...c.dataValues, replies: [] };
    });

    const commentTree = [];
    allComments.forEach(comment => {
      const { parentCommentId } = comment;
      if (parentCommentId && commentMap[parentCommentId]) {
        commentMap[parentCommentId].replies.push(commentMap[comment.id]);
      } else {
        commentTree.push(commentMap[comment.id]);
      }
    });

    res.json(commentTree);
  } catch (err) {
    console.error(" Error fetching comments:", err);
    res.status(500).json({ error: 'Failed to get comments', details: err.message });
  }
};
