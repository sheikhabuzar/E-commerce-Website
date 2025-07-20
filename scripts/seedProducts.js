// scripts/seedProducts.js
const { Sequelize } = require('sequelize');
const Product = require('../models/Product');
const sequelize = require('../config/db');

const categories = ['Polos', 'Chinos', 'Jeans', 'Trousers', 'Causal Shirts', 'Tees'];
const sizesList = ['S', 'M', 'L', 'XL'];

// Helper to generate random integer in range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to generate random product data
function generateRandomProduct(index) {
  const name = `Product ${index + 1}`;
  const description = `This is a dummy description for product #${index + 1}`;
  const price = randomInt(300, 3000);
  const stock = randomInt(0, 100);
  const category = categories[randomInt(0, categories.length - 1)];
  const image = 'default.jpg';

  // Choose random 1–3 sizes
  const shuffledSizes = sizesList.sort(() => 0.5 - Math.random());
  const sizes = shuffledSizes.slice(0, randomInt(1, 3));

  return {
    name,
    description,
    price,
    stock,
    category,
    image,
    sizes
  };
}

// Insert in batches
async function seedProducts() {
  try {
    await sequelize.authenticate();
    console.log(" Database connected...");

    const totalProducts = 20000;
    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < totalProducts; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize; j++) {
        const product = generateRandomProduct(i + j);
        batch.push(product);
      }

      await Product.bulkCreate(batch);
      inserted += batch.length;
      console.log(` Inserted ${inserted}/${totalProducts} products...`);
    }

    console.log(" All products seeded successfully!");
    process.exit();
  } catch (err) {
    console.error(" Error seeding products:", err);
    process.exit(1);
  }
}

seedProducts();
