require('dotenv').config();
const mysql = require('mysql2/promise');

async function addAllCategoryPosts() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'kadher',  // Reads from .env
    database: process.env.DB_NAME || 'taste_modelling',
    port: process.env.DB_PORT || 3306
  });
  
  const posts = [
    // Food posts
    { user_id: 1, title: 'Best Pizza in Town', content: 'The crust is perfectly crispy and the cheese is amazing!', category: 'Food & Culinary' },
    { user_id: 2, title: 'Vegan Recipes for Beginners', content: 'Easy and delicious plant-based meals anyone can make.', category: 'Food & Culinary' },
    
    // Fashion posts
    { user_id: 3, title: 'Summer Fashion Trends 2026', content: 'Bright colors and comfortable fabrics are in this season.', category: 'Fashion' },
    { user_id: 4, title: 'Sustainable Fashion Brands', content: 'Eco-friendly clothing that looks great and helps the planet.', category: 'Fashion' },
    
    // Music posts
    { user_id: 5, title: 'Best Albums of the Year', content: 'From indie rock to hip-hop, this year has amazing music.', category: 'Music' },
    { user_id: 6, title: 'Live Concert Experience', content: 'Nothing beats the energy of a live show!', category: 'Music' },
    
    // Art posts
    { user_id: 7, title: 'Digital Art Revolution', content: 'How technology is changing the way we create art.', category: 'Art' },
    { user_id: 8, title: 'Museum Must-Sees', content: 'Top exhibitions you cannot miss this month.', category: 'Art' },
    
    // Lifestyle posts
    { user_id: 9, title: 'Morning Routine Tips', content: 'Start your day right with these simple habits.', category: 'Lifestyle' },
    { user_id: 10, title: 'Work-Life Balance', content: 'Finding harmony in a busy world.', category: 'Lifestyle' },
    
    // Travel posts
    { user_id: 1, title: 'Hidden Gems in Europe', content: 'Beautiful places off the beaten path.', category: 'Travel' },
    { user_id: 2, title: 'Budget Travel Tips', content: 'See the world without breaking the bank.', category: 'Travel' },
    
    // Beauty posts
    { user_id: 3, title: 'Skincare Routine for Glowing Skin', content: 'Simple steps for healthy, radiant skin.', category: 'Beauty' },
    { user_id: 4, title: 'Best Drugstore Makeup', content: 'Affordable products that actually work.', category: 'Beauty' }
  ];
  
  try {
    console.log('📝 Adding posts for all categories...\n');
    
    for (const post of posts) {
      await pool.query(
        'INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)',
        [post.user_id, post.title, post.content, post.category]
      );
      console.log(`✅ Added: ${post.title} (${post.category})`);
    }
    
    console.log('\n🎉 All category posts added successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  process.exit();
}

addAllCategoryPosts();