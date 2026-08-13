const mysql = require('mysql2/promise');
const fs = require('fs');

async function prepareDataset() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'kadher',
    database: 'taste_modelling',
    port: 3306
  });

  // Get all posts
  const [posts] = await pool.query(`
    SELECT p.title, p.content, p.category, u.name as author 
    FROM posts p 
    JOIN users u ON p.user_id = u.id
  `);

  // Format for fine-tuning (prompt-response pairs)
  const trainingData = [];
  
  for (const post of posts) {
    // For taste description training
    trainingData.push({
      prompt: `Describe the taste of a dish with these ingredients: ${post.title.toLowerCase()}`,
      completion: ` ${post.content.substring(0, 200)}`
    });
    
    // For category classification
    trainingData.push({
      prompt: `What category does this taste insight belong to: "${post.title}"`,
      completion: ` ${post.category}`
    });
    
    // For enhancement training
    trainingData.push({
      prompt: `Improve this taste insight title: "${post.title}"`,
      completion: ` ✨ ${post.title} - A ${post.category} perspective`
    });
  }
  
  // Add custom taste descriptions
  const customData = [
    {
      prompt: "Describe the taste of Butter Chicken",
      completion: " Creamy, rich, and mildly spiced with a perfect balance of tomato, butter, and aromatic Indian spices. The chicken is tender and the gravy is velvety smooth."
    },
    {
      prompt: "Describe the taste of Margherita Pizza",
      completion: " Fresh, simple, and authentic. The sweet San Marzano tomatoes, creamy buffalo mozzarella, and fragrant basil create a perfect harmony on a crispy, chewy crust."
    },
    {
      prompt: "Describe the taste of Sushi",
      completion: " Delicate and fresh. The vinegared rice complements the raw fish perfectly, while wasabi adds a clean, sharp kick and ginger cleanses the palate."
    },
    {
      prompt: "Describe the taste of Dark Chocolate",
      completion: " Intense, bitter-sweet with notes of coffee and berries. It melts slowly on the tongue, releasing complex earthy and fruity undertones."
    },
    {
      prompt: "Describe the taste of Ramen",
      completion: " Rich, savory umami broth with springy noodles, tender chashu pork, and a jammy soft-boiled egg. Each slurp is deeply satisfying."
    }
  ];
  
  trainingData.push(...customData);
  
  // Save as JSONL format (required for Hugging Face)
  const jsonlContent = trainingData.map(item => 
    JSON.stringify({ prompt: item.prompt, completion: item.completion })
  ).join('\n');
  
  fs.writeFileSync('taste-training-data.jsonl', jsonlContent);
  console.log(`✅ Saved ${trainingData.length} training examples to taste-training-data.jsonl`);
  
  process.exit();
}

prepareDataset();