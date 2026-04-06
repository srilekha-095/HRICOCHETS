import fs from 'fs';
import { pool } from './db.js';

async function importProducts() {
  try {
    // Read products.json from your frontend
    const productsData = JSON.parse(
      fs.readFileSync('../frontend/src/data/products.json', 'utf8')
    );

    console.log(`📦 Found ${productsData.length} products to import...`);

    for (const product of productsData) {
      // Extract numeric price from "Rs.200" format
      const priceMatch = product.price.match(/[\d.]+/);
      const numericPrice = priceMatch ? parseFloat(priceMatch[0]) : 0;

      const query = `
        INSERT INTO products (
          id, name, description, price, image, category, 
          details, features, dimensions, customizable, images, active
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          image = EXCLUDED.image,
          category = EXCLUDED.category,
          details = EXCLUDED.details,
          features = EXCLUDED.features,
          dimensions = EXCLUDED.dimensions,
          customizable = EXCLUDED.customizable,
          images = EXCLUDED.images,
          updated_at = CURRENT_TIMESTAMP
      `;

      const values = [
        product.id,
        product.name,
        product.description || '',
        product.price, // Keep original format "Rs.200"
        product.image,
        product.category,
        product.details || '',
        product.features || [],
        product.dimensions || '',
        product.customizable || false,
        product.images || [product.image],
        true
      ];

      await pool.query(query, values);
      console.log(`✓ Imported: ${product.name}`);
    }

    console.log(`\n✅ Successfully imported ${productsData.length} products!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing products:', error);
    process.exit(1);
  }
}

importProducts();