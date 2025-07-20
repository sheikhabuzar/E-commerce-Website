const Comment = require('../mongo/models/Comment');
//  Create Comment
exports.createComment = async (req, res) => {
  try {
    const { productId, content, parentCommentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newComment = new Comment({
      productId,
      userId,
      content,
      parentCommentId: parentCommentId || null
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error(" Error creating comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCommentsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const comments = await Comment.aggregate([
      {
        $match: {
          productId: productId,
          parentCommentId: null
        }
      },
      {
        $lookup: {
          from: "comments",
          let: { rootId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$parentCommentId", "$$rootId"] }
              }
            },
            {
              $lookup: {
                from: "comments",
                let: { parentId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$parentCommentId", "$$parentId"] }
                    }
                  },
                  {
                    $project: {
                      _id: 1,
                      productId: 1,
                      userId: 1,
                      content: 1,
                      parentCommentId: 1,
                      createdAt: 1,
                      replies: [] // third level replies will be ignored
                    }
                  }
                ],
                as: "replies"
              }
            },
            {
              $project: {
                _id: 1,
                productId: 1,
                userId: 1,
                content: 1,
                parentCommentId: 1,
                createdAt: 1,
                replies: 1
              }
            }
          ],
          as: "replies"
        }
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          userId: 1,
          content: 1,
          parentCommentId: 1,
          createdAt: 1,
          replies: 1
        }
      }
    ]);

    res.json(comments);
  } catch (error) {
    console.error(" Error fetching nested comments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
