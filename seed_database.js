const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'kadher', // Add your password if you have one
  database: 'taste_modelling',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10
});

// Sample users data
const users = [
  {
    name: 'Priya Sharma',
    email: 'priya@tastemc.com',
    password: 'password123',
    speciality: 'Indian Fusion',
    bio: 'Mumbai-based food blogger exploring the intersection of traditional Indian flavors and modern cooking. 🌶️'
  },
  {
    name: 'Marco Rossi',
    email: 'marco@tastemc.com',
    password: 'password123',
    speciality: 'Italian Cuisine',
    bio: 'Authentic Italian recipes passed down for generations. Nonna would be proud! 🇮🇹'
  },
  {
    name: 'Emma Chen',
    email: 'emma@tastemc.com',
    password: 'password123',
    speciality: 'Asian Street Food',
    bio: 'Street food hunter documenting the best eats across Southeast Asia. 🥢'
  },
  {
    name: 'Carlos Mendez',
    email: 'carlos@tastemc.com',
    password: 'password123',
    speciality: 'Latin American',
    bio: 'Bringing the heat and flavor of Latin America to your kitchen. 🌮'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@tastemc.com',
    password: 'password123',
    speciality: 'Farm to Table',
    bio: 'Sustainable eating advocate and organic farming enthusiast. 🥬'
  },
  {
    name: 'Kenji Tanaka',
    email: 'kenji@tastemc.com',
    password: 'password123',
    speciality: 'Japanese Cuisine',
    bio: 'Sushi chef turned content creator. Sharing the art of Japanese cooking. 🍣'
  },
  {
    name: 'Aisha Mbowe',
    email: 'aisha@tastemc.com',
    password: 'password123',
    speciality: 'African Cuisine',
    bio: 'Celebrating the diverse flavors of Africa, one recipe at a time. 🥘'
  },
  {
    name: 'David Kim',
    email: 'david@tastemc.com',
    password: 'password123',
    speciality: 'Korean BBQ',
    bio: 'KBBQ enthusiast and marinade master. Get your grill ready! 🔥'
  },
  {
    name: 'Lisa Thompson',
    email: 'lisa@tastemc.com',
    password: 'password123',
    speciality: 'Pastry Arts',
    bio: 'Pastry chef with a sweet tooth and a love for beautiful desserts. 🍰'
  },
  {
    name: 'Raj Patel',
    email: 'raj@tastemc.com',
    password: 'password123',
    speciality: 'Vegan Innovations',
    bio: 'Proving that plant-based can be absolutely delicious. 🌱'
  }
];

// Sample posts data
const posts = [
  {
    title: 'The Secret to Perfect Butter Chicken',
    content: 'After 50+ attempts, I finally cracked the code. The key is using kasuri methi and fresh cream at the right temperature. Never rush the marinade - let it sit for at least 4 hours!',
    category: 'Food & Culinary'
  },
  {
    title: 'Why Sourdough Changed My Life',
    content: "Three years ago I couldn't bake to save my life. Now my sourdough starter is basically a family member. The patience and science behind it is fascinating!",
    category: 'Baking'
  },
  {
    title: 'Hidden Gems: Bangkok Street Food',
    content: "Forget the tourist spots. The best pad thai I've ever had was from a cart with no name, run by a 70-year-old grandmother. Sometimes the best experiences are unplanned.",
    category: 'Travel & Food'
  },
  {
    title: 'Umami Bombs You Need to Try',
    content: 'Mushroom powder, tomato paste, miso, and parmesan rinds. These four ingredients will elevate any dish from good to unforgettable.',
    category: 'Cooking Tips'
  },
  {
    title: 'Why I Hate Avocado Toast (Unpopular Opinion)',
    content: "Don't get me wrong, I love avocados. But paying $15 for bread with smashed avocado is insanity. Make it at home for $3 and save your money.",
    category: 'Opinion'
  },
  {
    title: 'The Perfect Ramen Egg',
    content: '7 minutes exactly. Ice bath immediately. Marinate in soy, mirin, and sake for 24 hours. You will never go back to plain eggs.',
    category: 'Japanese Cuisine'
  },
  {
    title: 'My Grandmothers Chai Recipe',
    content: 'Fresh ginger, cardamom, cinnamon, cloves, and black pepper. Boil with full-fat milk. Never use tea bags. This is the real deal.',
    category: 'Beverages'
  },
  {
    title: '5 Ingredient Pasta That Impresses',
    content: 'Aglio e olio - garlic, olive oil, parsley, red pepper flakes, and good pasta. Simple, elegant, and ready in 15 minutes.',
    category: 'Italian Cuisine'
  },
  {
    title: 'The Rise of Plant-Based Seafood',
    content: 'Just tried a vegan "salmon" that actually tasted like the real thing. The future of sustainable eating is here and it tastes amazing.',
    category: 'Food Trends'
  },
  {
    title: 'Wine Pairing Myths Debunked',
    content: 'Forget "red with meat, white with fish". The real rule is matching intensity. Light dishes need light wines. Heavy dishes need bold wines. Simple.',
    category: 'Beverages'
  },
  {
    title: 'My Favorite Food Markets Around the World',
    content: "1. Mercado de San Miguel - Madrid\n2. Tsukiji Outer Market - Tokyo\n3. La Boqueria - Barcelona\n4. Borough Market - London\n5. Grand Bazaar - Istanbul",
    category: 'Travel & Food'
  },
  {
    title: 'Why You Should Ferment Everything',
    content: 'Kimchi, kombucha, sour pickles, hot sauce. Fermentation adds depth, preserves food, and is great for gut health. Start with sauerkraut - it is impossible to mess up.',
    category: 'Food Science'
  },
  {
    title: 'The Best Coffee Brewing Method',
    content: 'Aeropress > French Press > Pour Over > Drip. Fight me in the comments. But seriously, try the Aeropress if you haven not already.',
    category: 'Beverages'
  },
  {
    title: 'Review: The $500 Pizza Oven',
    content: "Worth every penny. 900°F in 20 minutes. Neapolitan pizza at home. My only regret is not buying it sooner. Summer pizza parties are now a regular thing.",
    category: 'Product Review'
  },
  {
    title: 'Cooking for Picky Eaters',
    content: 'As a parent, I have learned to hide vegetables in sauces, blend them into smoothies, and make "noodles" out of zucchini. The struggle is real but worth it.',
    category: 'Parenting & Food'
  }
];

// Mood mappings based on content
function detectMood(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  if (text.match(/amazing|incredible|love|perfect|wow|awesome|best|changed my life/i)) return 'excited';
  if (text.match(/fusion|experiment|unique|unusual|bold|new|hidden|secret/i)) return 'adventurous';
  if (text.match(/warm|homemade|traditional|classic|nostalgic|grandmother|family/i)) return 'comforting';
  if (text.match(/hate|overrated|unpopular opinion|myth|never/i)) return 'critical';
  return 'neutral';
}

function extractTags(title, content) {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const words = (title + ' ' + content).toLowerCase().split(/\W+/);
  const uniqueWords = [...new Set(words)];
  const filtered = uniqueWords.filter(w => w.length > 3 && !commonWords.includes(w));
  return filtered.slice(0, 5);
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Clear existing data (optional - comment out if you want to keep existing)
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DELETE FROM posts');
    await pool.query('DELETE FROM users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🗑️  Cleared existing data\n');
    
    // Insert users
    console.log('👥 Creating users...');
    const userIds = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password, speciality, bio) VALUES (?, ?, ?, ?, ?)',
        [user.name, user.email, hashedPassword, user.speciality, user.bio]
      );
      userIds.push(result.insertId);
      console.log(`   ✅ Created: ${user.name} (${user.speciality})`);
    }
    
    // Insert posts
    console.log('\n📝 Creating posts...');
    let postCount = 0;
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const userId = userIds[i % userIds.length]; // Distribute posts among users
      const mood = detectMood(post.title, post.content);
      const tags = extractTags(post.title, post.content);
      
      await pool.query(
        'INSERT INTO posts (user_id, title, content, category, taste_mood, tags) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, post.title, post.content, post.category, mood, JSON.stringify(tags)]
      );
      postCount++;
      console.log(`   ✅ Post ${postCount}: "${post.title}" (${mood} mood)`);
    }
    
    console.log('\n✨ Database seeding complete!');
    console.log(`📊 Summary:`);
    console.log(`   - ${users.length} users created`);
    console.log(`   - ${postCount} posts created`);
    console.log(`   - 5+ taste moods represented`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();