const { sequelize } = require('../models');
exports.getProductDetailsOptimized = async (productId, userId) => {
  const query = `
  WITH product_data AS (
    SELECT
      p.*
    FROM "Products" p
    WHERE p.id = :productId
  ),
  like_data AS (
    SELECT
      COUNT(*) AS total_likes,
      BOOL_OR("userId" = :userId) AS liked_by_user
    FROM "Like"
    WHERE "productId" = :productId
  ),
  comment_tree AS (
    SELECT
      c.id,
      c."content",
      c."parentCommentId",
      c."productId",
      c."userId",
      u.name AS user_name,
      NULL::JSONB AS children
    FROM "Comment" c
    JOIN "Users" u ON c."userId" = u.id
    WHERE c."productId" = :productId
  )
  SELECT
    pd.id,
    pd.name,
    pd.description,
    pd.price,
    pd.image,
    pd.stock,
    pd.category,
    pd.sizes,
    ld.total_likes,
    ld.liked_by_user,
    COALESCE(json_agg(ct.*) FILTER (WHERE ct.id IS NOT NULL), '[]') AS comments
  FROM product_data pd
  CROSS JOIN like_data ld
  LEFT JOIN comment_tree ct ON ct."parentCommentId" IS NULL
  GROUP BY 
    pd.id, pd.name, pd.description, pd.price, pd.image, pd.stock, pd.category, pd.sizes,
    ld.total_likes, ld.liked_by_user;
`;

  const [results] = await sequelize.query(query, {
    replacements: { productId, userId },
    type: sequelize.QueryTypes.SELECT
  });

  return results;
};
