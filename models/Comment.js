const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Comment = sequelize.define('Comment', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  parentCommentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  depth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true,
  freezeTableName: true,
  indexes: [
    { fields: ['productId'] },
    { fields: ['parentCommentId'] }
  ]
});

module.exports = Comment;