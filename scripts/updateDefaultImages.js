const { Product, sequelize } = require('../models');

const CLOUDINARY_DEFAULT_URL = 'https://res.cloudinary.com/dw1ijcd7g/image/upload/v1753221769/default_cw8yer.webp';

async function updateDefaultImages() {
  try {
    await sequelize.authenticate();
    const [updatedCount] = await Product.update(
      { image: CLOUDINARY_DEFAULT_URL },
      { where: { image: 'default.jpg' } }
    );
    console.log(`Updated ${updatedCount} products to use Cloudinary default image.`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating products:', err);
    process.exit(1);
  }
}

updateDefaultImages(); 