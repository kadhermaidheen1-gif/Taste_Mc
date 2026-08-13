const aiService = require('./ai-service');
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'taste_modelling',
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false  // ✅ REQUIRED for TiDB Cloud
  },
  waitForConnections: true,
  connectionLimit: 10
});

// Initialize database
const initDatabase = async () => {
  // Tables creation queries (run the SQL from Phase 1)
  console.log("✅ Database tables ready");
};
initDatabase();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'taste_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  next();
}

// ============= AUTH ROUTES =============
app.post('/api/register', async (req, res) => {
  const { name, email, password, speciality } = req.body;
  if (!name || !email || !password || !speciality) {
    return res.json({ success: false, message: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.json({ success: false, message: 'Password must be at least 6 characters.' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.json({ success: false, message: 'Email already registered.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, speciality) VALUES (?, ?, ?, ?)',
      [name, email, hashed, speciality]
    );
    req.session.userId = result.insertId;
    req.session.userName = name;
    
    // Check and award achievements
    await checkAchievements(result.insertId, pool);
    
    res.json({ success: true, message: 'Account created!', name });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Server error. Try again.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ success: false, message: 'Email and password are required.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.json({ success: false, message: 'Invalid email or password.' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, message: 'Invalid email or password.' });
    }
    req.session.userId = user.id;
    req.session.userName = user.name;
    res.json({ success: true, name: user.name, avatar: user.avatar_url });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Server error. Try again.' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }
  res.json({ loggedIn: true, name: req.session.userName, id: req.session.userId });
});

// ============= PROFILE ROUTES =============
app.get('/api/profile/:userId?', async (req, res) => {
  const userId = req.params.userId || req.session.userId;
  if (!userId) return res.json({ success: false });
  
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, speciality, bio, avatar_url, location, website, is_verified, created_at 
       FROM users WHERE id = ?`,
      [userId]
    );
    if (rows.length === 0) return res.json({ success: false });
    
    // Get user stats
    const [postCount] = await pool.query('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [userId]);
    const [followerCount] = await pool.query('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [userId]);
    const [followingCount] = await pool.query('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [userId]);
    const [achievements] = await pool.query('SELECT achievement_type FROM user_achievements WHERE user_id = ?', [userId]);
    
    res.json({ 
      success: true, 
      user: rows[0],
      stats: {
        posts: postCount[0].count,
        followers: followerCount[0].count,
        following: followingCount[0].count
      },
      achievements: achievements.map(a => a.achievement_type)
    });
  } catch (err) {
    res.json({ success: false });
  }
});

app.put('/api/profile', requireAuth, upload.single('avatar'), async (req, res) => {
  const { bio, location, website } = req.body;
  let avatar_url = null;
  
  if (req.file) {
    avatar_url = `/uploads/${req.file.filename}`;
  }
  
  try {
    let query = 'UPDATE users SET bio = ?, location = ?, website = ?';
    let params = [bio || '', location || '', website || ''];
    
    if (avatar_url) {
      query += ', avatar_url = ?';
      params.push(avatar_url);
    }
    
    query += ' WHERE id = ?';
    params.push(req.session.userId);
    
    await pool.query(query, params);
    res.json({ success: true, message: 'Profile updated!', avatar_url });
  } catch (err) {
    res.json({ success: false, message: 'Could not update profile.' });
  }
});

// ============= POSTS ROUTES =============

app.get('/api/posts', async (req, res) => {
  const { limit = 30, offset = 0, category } = req.query;
  
  try {
    let query = `
      SELECT p.*, u.name AS author, u.speciality, u.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT reaction_type FROM likes WHERE post_id = p.id AND user_id = ?) as user_reaction
      FROM posts p
      JOIN users u ON p.user_id = u.id
    `;
    let params = [req.session.userId || 0];
    
    if (category && category !== 'all') {
      query += ' WHERE p.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.query(query, params);
    
    // Increment view count
    for (const row of rows) {
      await pool.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [row.id]);
    }
    
    res.json({ success: true, posts: rows, hasMore: rows.length === parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.json({ success: false, posts: [] });
  }
});

app.post('/api/posts', requireAuth, upload.single('image'), async (req, res) => {
  const { title, content, category } = req.body;
  let image_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!title || !content || !category) {
    return res.json({ success: false, message: 'All fields required.' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, title, content, category, image_url) VALUES (?, ?, ?, ?, ?)',
      [req.session.userId, title, content, category, image_url]
    );
    
    // Check and award achievements
    await checkAchievements(req.session.userId, pool);
    
    res.json({ success: true, message: 'Post created!', postId: result.insertId });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Could not create post.' });
  }
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  const postId = req.params.id;
  
  try {
    const [post] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
    if (post.length === 0 || post[0].user_id !== req.session.userId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }
    
    await pool.query('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.json({ success: false, message: 'Could not delete post' });
  }
});

// ============= LIKES ROUTES =============
app.post('/api/posts/:id/like', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { reaction = 'like' } = req.body;
  
  try {
    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
      [id, req.session.userId]
    );
    
    if (existing.length > 0) {
      await pool.query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [id, req.session.userId]);
      res.json({ success: true, liked: false });
    } else {
      await pool.query(
        'INSERT INTO likes (post_id, user_id, reaction_type) VALUES (?, ?, ?)',
        [id, req.session.userId, reaction]
      );
      
      // Check achievements
      await checkAchievements(req.session.userId, pool);
      res.json({ success: true, liked: true });
    }
  } catch (err) {
    res.json({ success: false, message: 'Error processing like' });
  }
});

// ============= COMMENTS ROUTES =============
app.get('/api/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [comments] = await pool.query(
      `SELECT c.*, u.name as author, u.avatar_url 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.parent_id IS NULL
       ORDER BY c.created_at DESC`,
      [id]
    );
    
    // Get replies for each comment
    for (const comment of comments) {
      const [replies] = await pool.query(
        `SELECT c.*, u.name as author, u.avatar_url 
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.parent_id = ?
         ORDER BY c.created_at ASC`,
        [comment.id]
      );
      comment.replies = replies;
    }
    
    res.json({ success: true, comments });
  } catch (err) {
    res.json({ success: false, comments: [] });
  }
});

app.post('/api/posts/:id/comments', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content, parentId } = req.body;
  
  if (!content) {
    return res.json({ success: false, message: 'Comment cannot be empty' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [id, req.session.userId, content, parentId || null]
    );
    
    res.json({ success: true, commentId: result.insertId });
  } catch (err) {
    res.json({ success: false, message: 'Could not post comment' });
  }
});

// ============= FOLLOW ROUTES =============
app.post('/api/users/:id/follow', requireAuth, async (req, res) => {
  const { id } = req.params;
  
  if (parseInt(id) === req.session.userId) {
    return res.json({ success: false, message: 'Cannot follow yourself' });
  }
  
  try {
    const [existing] = await pool.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.session.userId, id]
    );
    
    if (existing.length > 0) {
      await pool.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.session.userId, id]);
      res.json({ success: true, following: false });
    } else {
      await pool.query(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
        [req.session.userId, id]
      );
      res.json({ success: true, following: true });
    }
  } catch (err) {
    res.json({ success: false });
  }
});

app.get('/api/users/:id/followers', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [followers] = await pool.query(
      `SELECT u.id, u.name, u.speciality, u.avatar_url
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ?`,
      [id]
    );
    res.json({ success: true, followers });
  } catch (err) {
    res.json({ success: false, followers: [] });
  }
});

// ============= SAVED POSTS =============
app.post('/api/posts/:id/save', requireAuth, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [existing] = await pool.query(
      'SELECT id FROM saved_posts WHERE post_id = ? AND user_id = ?',
      [id, req.session.userId]
    );
    
    if (existing.length > 0) {
      await pool.query('DELETE FROM saved_posts WHERE post_id = ? AND user_id = ?', [id, req.session.userId]);
      res.json({ success: true, saved: false });
    } else {
      await pool.query('INSERT INTO saved_posts (post_id, user_id) VALUES (?, ?)', [id, req.session.userId]);
      res.json({ success: true, saved: true });
    }
  } catch (err) {
    res.json({ success: false });
  }
});

app.get('/api/saved-posts', requireAuth, async (req, res) => {
  try {
    const [posts] = await pool.query(
      `SELECT p.*, u.name as author
       FROM saved_posts sp
       JOIN posts p ON sp.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE sp.user_id = ?
       ORDER BY sp.created_at DESC`,
      [req.session.userId]
    );
    res.json({ success: true, posts });
  } catch (err) {
    res.json({ success: false, posts: [] });
  }
});

// ============= ACHIEVEMENTS =============
async function checkAchievements(userId, pool) {
  // Get user stats
  const [postCount] = await pool.query('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [userId]);
  const [likeCount] = await pool.query(
    `SELECT COUNT(*) as count FROM likes WHERE user_id IN (SELECT user_id FROM posts WHERE user_id = ?)`,
    [userId]
  );
  const [followerCount] = await pool.query('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [userId]);
  
  const achievements = [];
  
  if (postCount[0].count >= 1 && !await hasAchievement(userId, 'first_post', pool)) {
    achievements.push('first_post');
  }
  if (postCount[0].count >= 10 && !await hasAchievement(userId, 'prolific', pool)) {
    achievements.push('prolific');
  }
  if (postCount[0].count >= 50 && !await hasAchievement(userId, 'master_creator', pool)) {
    achievements.push('master_creator');
  }
  if (likeCount[0].count >= 10 && !await hasAchievement(userId, 'popular', pool)) {
    achievements.push('popular');
  }
  if (followerCount[0].count >= 5 && !await hasAchievement(userId, 'influencer', pool)) {
    achievements.push('influencer');
  }
  
  for (const achievement of achievements) {
    await pool.query(
      'INSERT INTO user_achievements (user_id, achievement_type) VALUES (?, ?)',
      [userId, achievement]
    );
  }
}

async function hasAchievement(userId, type, pool) {
  const [result] = await pool.query(
    'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_type = ?',
    [userId, type]
  );
  return result.length > 0;
}

app.get('/api/achievements', requireAuth, async (req, res) => {
  try {
    const [achievements] = await pool.query(
      'SELECT achievement_type, earned_at FROM user_achievements WHERE user_id = ?',
      [req.session.userId]
    );
    
    const allAchievements = [
      { type: 'first_post', name: '🎓 First Post', description: 'Published your first taste insight', icon: '📝' },
      { type: 'prolific', name: '📚 Prolific Creator', description: 'Published 10 posts', icon: '✍️' },
      { type: 'master_creator', name: '👑 Master Creator', description: 'Published 50 posts', icon: '🏆' },
      { type: 'popular', name: '🔥 Popular', description: 'Received 10 likes total', icon: '❤️' },
      { type: 'influencer', name: '⭐ Influencer', description: 'Gained 5 followers', icon: '🌟' }
    ];
    
    const earned = achievements.map(a => a.achievement_type);
    const allWithStatus = allAchievements.map(a => ({
      ...a,
      earned: earned.includes(a.type),
      earned_at: achievements.find(ae => ae.achievement_type === a.type)?.earned_at
    }));
    
    res.json({ success: true, achievements: allWithStatus });
  } catch (err) {
    res.json({ success: false, achievements: [] });
  }
});

// ============= LEADERBOARD =============
app.get('/api/leaderboard', async (req, res) => {
  const { period = 'week', limit = 10 } = req.query;
  
  let dateCondition = '';
  if (period === 'week') dateCondition = 'AND p.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)';
  if (period === 'month') dateCondition = 'AND p.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)';
  
  try {
    const [creators] = await pool.query(`
      SELECT u.id, u.name, u.speciality, u.avatar_url,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT l.id) as like_count,
        COUNT(DISTINCT f.follower_id) as follower_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id ${dateCondition ? 'AND ' + dateCondition.replace('AND', '') : ''}
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN follows f ON u.id = f.following_id
      GROUP BY u.id
      ORDER BY post_count DESC, like_count DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
    res.json({ success: true, creators });
  } catch (err) {
    res.json({ success: false, creators: [] });
  }
});

// ============= NOTIFICATIONS =============
app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    // Simplified notifications based on interactions
    const [notifications] = await pool.query(`
      (SELECT 'like' as type, l.created_at, u.name as actor, p.title as post_title
       FROM likes l
       JOIN posts p ON l.post_id = p.id
       JOIN users u ON l.user_id = u.id
       WHERE p.user_id = ? AND l.user_id != ?
       ORDER BY l.created_at DESC LIMIT 10)
      UNION ALL
      (SELECT 'follow' as type, f.created_at, u.name as actor, NULL as post_title
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ? AND f.follower_id != ?
       ORDER BY f.created_at DESC LIMIT 10)
      ORDER BY created_at DESC LIMIT 20
    `, [req.session.userId, req.session.userId, req.session.userId, req.session.userId]);
    
    res.json({ success: true, notifications });
  } catch (err) {
    res.json({ success: false, notifications: [] });
  }
});

// ============= SEARCH =============
app.get('/api/search', async (req, res) => {
  const { q, type = 'all' } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ success: false, results: [] });
  }
  
  try {
    const searchTerm = `%${q}%`;
    let results = {};
    
    if (type === 'all' || type === 'posts') {
      const [posts] = await pool.query(
        `SELECT p.id, p.title, p.content, p.category, u.name as author, 'post' as type
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE p.title LIKE ? OR p.content LIKE ?
         LIMIT 10`,
        [searchTerm, searchTerm]
      );
      results.posts = posts;
    }
    
    if (type === 'all' || type === 'users') {
      const [users] = await pool.query(
        `SELECT id, name, speciality, avatar_url, 'user' as type
         FROM users
         WHERE name LIKE ? OR speciality LIKE ?
         LIMIT 10`,
        [searchTerm, searchTerm]
      );
      results.users = users;
    }
    
    res.json({ success: true, results });
  } catch (err) {
    res.json({ success: false, results: [] });
  }
});

// ============= STATS DASHBOARD =============
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const [postStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(view_count) as total_views,
        (SELECT COUNT(*) FROM likes WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)) as total_likes
      FROM posts
      WHERE user_id = ?
    `, [req.session.userId, req.session.userId]);
    
    const [categoryStats] = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM posts
      WHERE user_id = ?
      GROUP BY category
      ORDER BY count DESC
    `, [req.session.userId]);
    
    const [weeklyActivity] = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM posts
      WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [req.session.userId]);
    
    res.json({ 
      success: true, 
      stats: postStats[0],
      categories: categoryStats,
      weeklyActivity
    });
  } catch (err) {
    res.json({ success: false });
  }
});

// ============= AI ENDPOINTS =============
app.post('/api/ai/describe', requireAuth, async (req, res) => {
  const { dish, ingredients, mood } = req.body;
  
  if (!dish || !ingredients) {
    return res.json({ success: false, description: 'Please provide dish and ingredients' });
  }
  
  try {
    const description = await aiService.generateTasteDescription(dish, ingredients, mood || 'excited');
    res.json({ success: true, description });
  } catch (err) {
    res.json({ success: false, description: `✨ The ${dish} combines ${ingredients} beautifully!` });
  }
});

app.post('/api/ai/pairings', requireAuth, async (req, res) => {
  const { ingredient } = req.body;
  
  try {
    const pairings = await aiService.suggestFlavorPairings(ingredient);
    res.json({ success: true, pairings });
  } catch (err) {
    res.json({ success: false, pairings: `🔗 ${ingredient} pairs well with garlic and herbs!` });
  }
});

app.post('/api/ai/analyze', requireAuth, async (req, res) => {
  const { text } = req.body;
  
  try {
    const analysis = aiService.analyzeFoodSentiment(text);
    res.json({ success: true, analysis });
  } catch (err) {
    res.json({ success: false, analysis: { score: 0, sentiment: 'neutral' } });
  }
});

app.post('/api/ai/recipe', requireAuth, async (req, res) => {
  const { ingredients, cuisine } = req.body;
  
  try {
    const recipe = await aiService.generateRecipe(ingredients, cuisine);
    res.json({ success: true, recipe });
  } catch (err) {
    res.json({ success: false, recipe: `📖 Simple recipe with ${ingredients}` });
  }
});

app.post('/api/ai/enhance', requireAuth, async (req, res) => {
  const { title, content } = req.body;
  
  try {
    const enhanced = await aiService.enhancePost(title, content);
    res.json({ success: true, enhanced });
  } catch (err) {
    res.json({ success: false, enhanced: `${title}\n\n${content}\n\n#TasteMC` });
  }
});

app.post('/api/ai/compare', requireAuth, async (req, res) => {
  const { dish1, dish2 } = req.body;
  
  try {
    const comparison = await aiService.compareDishes(dish1, dish2);
    res.json({ success: true, comparison });
  } catch (err) {
    res.json({ success: false, comparison: `${dish1} and ${dish2} are both great!` });
  }
});

app.get('/api/ai/food-fact', async (req, res) => {
  try {
    const fact = await aiService.getFoodFact();
    res.json({ success: true, fact });
  } catch (err) {
    res.json({ success: false, fact: "Did you know? The world's oldest known recipe is for beer!" });
  }
});

// ============= FRONTEND =============
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Taste MC running on port ${PORT}`);
});

// Helper function for achievements
async function checkAchievements(userId, pool) {
  const [postCount] = await pool.query('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [userId]);
  const [likeCount] = await pool.query(
    `SELECT COUNT(*) as count FROM likes WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)`,
    [userId]
  );
  const [followerCount] = await pool.query('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [userId]);
  
  const achievements = [];
  
  if (postCount[0].count >= 1 && !await hasAchievement(userId, 'first_post', pool)) achievements.push('first_post');
  if (postCount[0].count >= 10 && !await hasAchievement(userId, 'prolific', pool)) achievements.push('prolific');
  if (postCount[0].count >= 50 && !await hasAchievement(userId, 'master_creator', pool)) achievements.push('master_creator');
  if (likeCount[0].count >= 10 && !await hasAchievement(userId, 'popular', pool)) achievements.push('popular');
  if (followerCount[0].count >= 5 && !await hasAchievement(userId, 'influencer', pool)) achievements.push('influencer');
  
  for (const achievement of achievements) {
    await pool.query('INSERT INTO user_achievements (user_id, achievement_type) VALUES (?, ?)', [userId, achievement]);
  }
}

async function hasAchievement(userId, type, pool) {
  const [result] = await pool.query('SELECT id FROM user_achievements WHERE user_id = ? AND achievement_type = ?', [userId, type]);
  return result.length > 0;
}
