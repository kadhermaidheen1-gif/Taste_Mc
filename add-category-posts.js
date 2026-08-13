require('dotenv').config();
const mysql = require('mysql2/promise');

async function addCategoryPosts() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'taste_modelling',  // Note: your DB is 'taste_modeling'?
    port: process.env.DB_PORT || 3306
  });
  
  try {
    console.log('📝 Adding posts for all categories...\n');
    
    // Using your existing user IDs (23-34)
    const posts = [
      // Food & Culinary posts
      { user_id: 23, title: 'The Secret to Perfect Butter Chicken', content: 'After 50 attempts, I finally cracked the code. The key is using kasuri methi and fresh cream at the right temperature. Never rush the marinade - let it sit for at least 4 hours!', category: 'Food & Culinary' },
      { user_id: 24, title: 'Authentic Pasta Carbonara', content: 'No cream! Just eggs, pecorino cheese, guanciale, and black pepper. This is the real Roman way.', category: 'Food & Culinary' },
      { user_id: 25, title: 'Best Street Food in Bangkok', content: 'From pad thai to mango sticky rice, the flavors are incredible. Here is my top 5 list.', category: 'Food & Culinary' },
      
      // Fashion posts
      { user_id: 26, title: 'Summer Fashion Trends 2026', content: 'Bright colors, linen fabrics, and comfortable silhouettes are in this season. Here is how to style them.', category: 'Fashion' },
      { user_id: 27, title: 'Sustainable Fashion Brands', content: 'Eco-friendly clothing that looks great and helps the planet. These 5 brands are leading the way.', category: 'Fashion' },
      { user_id: 28, title: 'Minimalist Wardrobe Essentials', content: '10 pieces you actually need. Quality over quantity is the way to go.', category: 'Fashion' },
      
      // Music posts
      { user_id: 29, title: 'Best Albums of 2026 So Far', content: 'From indie rock to hip-hop, this year has been incredible for music. Here are my top 10 picks.', category: 'Music' },
      { user_id: 30, title: 'Why Vinyl is Making a Comeback', content: 'The warmth, the ritual, the artwork - vinyl offers something digital never can.', category: 'Music' },
      { user_id: 31, title: 'Live Concert Experience', content: 'Nothing beats the energy of a live show! Just saw my favorite band and it was unforgettable.', category: 'Music' },
      
      // Art posts
      { user_id: 32, title: 'Digital Art Revolution', content: 'How technology is changing the way we create art. NFTs, AI art, and digital galleries explained.', category: 'Art' },
      { user_id: 33, title: 'Museum Must-Sees This Month', content: 'Top exhibitions you cannot miss. From Van Gogh to contemporary masters.', category: 'Art' },
      { user_id: 34, title: 'Street Art Tours: 5 Cities', content: 'Berlin, Melbourne, NYC, London, and São Paulo - the street art capitals of the world.', category: 'Art' },
      
      // Lifestyle posts
      { user_id: 23, title: 'Morning Routine for Success', content: 'Start your day right with these simple habits. Meditation, exercise, and planning make all the difference.', category: 'Lifestyle' },
      { user_id: 24, title: 'Work-Life Balance Tips', content: 'Finding harmony in a busy world. Boundaries, self-care, and saying no when needed.', category: 'Lifestyle' },
      { user_id: 25, title: 'Minimalist Living: Less is More', content: 'Decluttering my life changed everything. Here is my journey to simplicity.', category: 'Lifestyle' },
      
      // Travel posts
      { user_id: 26, title: 'Hidden Gems in Southeast Asia', content: 'Beyond Bali and Bangkok - the places locals do not want you to know about.', category: 'Travel' },
      { user_id: 27, title: 'Solo Travel: A Beginners Guide', content: 'Safe, empowering, and life-changing. Here is how to start your solo journey.', category: 'Travel' },
      { user_id: 28, title: 'Budget Travel Hacks', content: 'See the world without breaking the bank. How I traveled to 15 countries on a budget.', category: 'Travel' },
      
      // Beauty posts
      { user_id: 29, title: 'Skincare Routine for Glowing Skin', content: 'Simple steps for healthy, radiant skin. Morning and night routines that actually work.', category: 'Beauty' },
      { user_id: 30, title: 'Best Drugstore Makeup Products', content: 'Affordable products that actually work. You do not need to spend a fortune to look great.', category: 'Beauty' },
      { user_id: 31, title: 'Clean Beauty Brands to Watch', content: 'No toxins, no compromise. These brands deliver results with natural ingredients.', category: 'Beauty' }
    ];
    
    let added = 0;
    for (const post of posts) {
      await pool.query(
        'INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)',
        [post.user_id, post.title, post.content, post.category]
      );
      console.log(`✅ Added: "${post.title}" (${post.category})`);
      added++;
    }
    
    console.log(`\n🎉 Successfully added ${added} posts across all 7 categories!`);
    
    // Show summary
    const [summary] = await pool.query(
      'SELECT category, COUNT(*) as count FROM posts GROUP BY category ORDER BY count DESC'
    );
    console.log('\n📊 Category Summary:');
    summary.forEach(row => {
      console.log(`   - ${row.category}: ${row.count} posts`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('Duplicate entry')) {
      console.log('💡 Posts already exist. That is fine!');
    }
  }
  
  process.exit();
}

addCategoryPosts();