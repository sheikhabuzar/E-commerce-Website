const sequelize = require('../config/db');
const User = require('./user');
const Product = require('./product');
const Order = require('./order');
const Comment = require('./Comment');
const Like = require('./like'); // 👈 NEW

// Product → Comments
Product.hasMany(Comment, { foreignKey: 'productId' });
Comment.belongsTo(Product, { foreignKey: 'productId' });

// User → Comments
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// Comment - Replies (Self-Referencing)
Comment.hasMany(Comment, {
  foreignKey: 'parentCommentId',
  as: 'replies'
});
Comment.belongsTo(Comment, {
  foreignKey: 'parentCommentId',
  as: 'parent'
});

//  Like Associations
User.hasMany(Like, { foreignKey: 'userId', onDelete: 'CASCADE' });
Product.hasMany(Like, { foreignKey: 'productId', onDelete: 'CASCADE' });

Like.belongsTo(User, { foreignKey: 'userId' });
Like.belongsTo(Product, { foreignKey: 'productId' });

const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true }); // It updates existing tables
    console.log("DB Synced");
  } catch (error) {
    console.error("DB Sync Failed", error);
  }
};

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  Comment,
  Like, 
  syncDB
};
