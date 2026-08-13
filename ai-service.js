// ai-service.js - Fixed Working Version
const { OpenAI } = require('openai');
const Sentiment = require('sentiment');
require('dotenv').config();

class AIService {
  constructor() {
    this.sentiment = new Sentiment();
    this.openai = null;
    
    // Get API key from .env
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    console.log('🔑 Checking API key...');
    
    if (apiKey && apiKey.length > 10) {
      try {
        this.openai = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: apiKey,
          defaultHeaders: {
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Taste MC',
          },
        });
        console.log('✅ OpenRouter AI Connected!');
      } catch (err) {
        console.error('OpenRouter init failed:', err.message);
      }
    } else {
      console.log('⚠️ No API key found, using enhanced fallback');
    }
  }
  
  async generateTasteDescription(dish, ingredients, mood = 'excited') {
    // Try real AI first
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { role: 'system', content: 'You are a food critic. Describe taste vividly.' },
            { role: 'user', content: `Describe ${dish} made with ${ingredients} in a ${mood} tone. 2-3 sentences.` }
          ],
          max_tokens: 150,
          temperature: 0.8,
        });
        const result = completion.choices[0].message.content;
        console.log('✅ AI generated description');
        return result;
      } catch (err) {
        console.error('AI Error:', err.message);
      }
    }
    
    // Enhanced fallback with variety
    return this.getVariedDescription(dish, ingredients);
  }
  
  getVariedDescription(dish, ingredients) {
    const dishLower = dish.toLowerCase();
    
    const descriptions = {
      'pizza': [
        `🍕 The ${dish} has a crispy, chewy crust with tangy tomato sauce and melted mozzarella.`,
        `🍕 Every slice of this ${dish} delivers the perfect balance of sauce, cheese, and crispy crust.`,
        `🍕 This ${dish} features a thin, blistered crust with sweet tomato sauce and gooey cheese.`
      ],
      'burger': [
        `🍔 The ${dish} is juicy with a perfect sear, soft bun, and fresh toppings.`,
        `🍔 This ${dish} delivers smoky, beefy flavor with melted cheese and crisp lettuce.`,
        `🍔 Each bite of this ${dish} is perfectly balanced - savory patty, fresh veggies, and special sauce.`
      ],
      'pasta': [
        `🍝 The ${dish} features al dente noodles in a rich, garlicky sauce.`,
        `🍝 This ${dish} is comfort food perfection - silky noodles with fresh herbs and Parmesan.`
      ],
      'garlic': [
        `🧄 ${dish} has a pungent, aromatic flavor that adds depth to any dish. When roasted, it becomes sweet and creamy.`,
        `🧄 ${dish} is bold and aromatic - it transforms from spicy and sharp when raw to sweet and mellow when cooked.`
      ],
      'wine': [
        `🍷 ${dish} offers complex notes of fruit, oak, and tannins. Red wines are bold with berry flavors; whites are crisp with citrus notes.`,
        `🍷 A good ${dish} balances acidity, sweetness, and tannins. Red wines pair with meats, whites with seafood.`
      ],
      'default': [
        `✨ The ${dish} combines ${ingredients} beautifully. The flavors are well-balanced and satisfying.`,
        `🍽️ This ${dish} is absolutely delightful! The ${ingredients} come together perfectly.`,
        `🌟 Every bite of this ${dish} brings joy. The flavors create a wonderful harmony on your palate.`,
        `💫 The ${dish} is a true taste sensation! Each ingredient adds its own unique character.`
      ]
    };
    
    // Find matching dish
    for (let [key, options] of Object.entries(descriptions)) {
      if (dishLower.includes(key)) {
        return options[Math.floor(Math.random() * options.length)];
      }
    }
    
    // Check ingredients for garlic/wine
    const ingLower = ingredients.toLowerCase();
    if (ingLower.includes('garlic')) {
      return descriptions['garlic'][Math.floor(Math.random() * descriptions['garlic'].length)];
    }
    if (ingLower.includes('wine')) {
      return descriptions['wine'][Math.floor(Math.random() * descriptions['wine'].length)];
    }
    
    const defaultOptions = descriptions.default;
    return defaultOptions[Math.floor(Math.random() * defaultOptions.length)];
  }
  
  async suggestFlavorPairings(ingredient) {
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { role: 'system', content: 'You suggest food pairings.' },
            { role: 'user', content: `Suggest 3 unique flavor pairings for ${ingredient}. Be specific.` }
          ],
          max_tokens: 150,
          temperature: 0.8,
        });
        return completion.choices[0].message.content;
      } catch (err) {
        console.error('AI Error:', err.message);
      }
    }
    
    return this.getVariedPairings(ingredient);
  }
  
  getVariedPairings(ingredient) {
    const ingLower = ingredient.toLowerCase();
    
    const pairings = {
      'garlic': [
        `🧄 ${ingredient} pairs with: roasted vegetables, butter, olive oil, lemon, herbs (rosemary, thyme), and crusty bread.`,
        `🧄 ${ingredient} is amazing with: pasta, seafood, chicken, mushrooms, and tomatoes.`,
        `🧄 Try ${ingredient} with: roasted potatoes, spinach, olive oil, and Parmesan cheese.`
      ],
      'wine': [
        `🍷 ${ingredient} pairings: Red wine with red meat, cheese, pasta; White wine with seafood, chicken, salad; Rosé with grilled veggies, pork.`,
        `🍷 ${ingredient} tips: Bold reds with steak, light whites with fish, sparkling with appetizers.`,
        `🍷 ${ingredient} guide: Cabernet with beef, Pinot with duck, Chardonnay with lobster, Sauvignon with goat cheese.`
      ],
      'cheese': [
        `🧀 ${ingredient} pairs with: honey, figs, nuts, apples, pears, grapes, and crusty bread.`,
        `🧀 ${ingredient} is wonderful with: dried fruits, crackers, olives, and cured meats.`
      ],
      'chocolate': [
        `🍫 ${ingredient} pairs with: orange, coffee, sea salt, chili, raspberry, caramel, mint, and hazelnut.`,
        `🍫 ${ingredient} is delicious with: strawberries, bananas, peanut butter, and vanilla ice cream.`
      ],
      'default': [
        `🔗 ${ingredient} pairs well with: garlic, fresh herbs (rosemary, thyme, basil), citrus (lemon, lime), and olive oil.`,
        `🔗 ${ingredient} complements: roasted vegetables, balsamic glaze, toasted nuts, and cracked black pepper.`,
        `🔗 Try ${ingredient} with: caramelized onions, wild mushrooms, fresh thyme, and a squeeze of lemon.`
      ]
    };
    
    for (let [key, options] of Object.entries(pairings)) {
      if (ingLower.includes(key)) {
        return options[Math.floor(Math.random() * options.length)];
      }
    }
    const defaultOptions = pairings.default;
    return defaultOptions[Math.floor(Math.random() * defaultOptions.length)];
  }
  
  analyzeFoodSentiment(text) {
    const analysis = this.sentiment.analyze(text);
    
    const wittyMessages = [
      { score: 3, msg: "These taste buds are doing a happy dance! 💃", icon: '😍' },
      { score: 1, msg: "Someone's having a delicious day! 🎉", icon: '😊' },
      { score: 0, msg: "A balanced review - like a well-seasoned dish! ⚖️", icon: '😐' },
      { score: -1, msg: "Not the best food experience. 😕", icon: '😕' },
      { score: -3, msg: "Yikes! Maybe try a different dish next time? 😅", icon: '😫' },
    ];
    
    let result = wittyMessages[2]; // default neutral
    for (const item of wittyMessages) {
      if (analysis.score >= item.score && item.score > 0) {
        result = item;
      } else if (analysis.score <= item.score && item.score < 0) {
        result = item;
      }
    }
    
    return {
      score: analysis.score,
      sentiment: analysis.score > 0 ? 'positive' : (analysis.score < 0 ? 'negative' : 'neutral'),
      icon: result.icon,
      wittySummary: result.msg,
      positiveWords: analysis.positive || [],
      negativeWords: analysis.negative || [],
      isPositive: analysis.score > 0
    };
  }
  
  async generateRecipe(ingredients, cuisine = 'simple') {
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { role: 'system', content: 'You are a chef.' },
            { role: 'user', content: `Quick ${cuisine} recipe using ${ingredients}. 5 steps.` }
          ],
          max_tokens: 250,
        });
        return completion.choices[0].message.content;
      } catch (err) {
        console.error('AI Error:', err.message);
      }
    }
    
    const ingredientsList = ingredients.split(',').map(i => i.trim());
    return `📖 **${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} Recipe**\n\n` +
           `**Ingredients:**\n${ingredientsList.map(i => `• ${i}`).join('\n')}\n\n` +
           `**Steps:**\n1. Prepare ingredients\n2. Cook together\n3. Season to taste\n4. Enjoy!\n\n#TasteMC`;
  }
  
  async enhancePost(title, content) {
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { role: 'system', content: 'Improve titles.' },
            { role: 'user', content: `Improve: "${title}"` }
          ],
          max_tokens: 80,
        });
        const newTitle = completion.choices[0].message.content;
        return `${newTitle}\n\n${content}\n\n#TasteMC #FoodReview`;
      } catch (err) {
        console.error('AI Error:', err.message);
      }
    }
    return `${title}\n\n${content}\n\n#TasteMC #FoodReview`;
  }
  
  async compareDishes(dish1, dish2) {
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { role: 'system', content: 'Compare dishes.' },
            { role: 'user', content: `Compare ${dish1} vs ${dish2}. Brief.` }
          ],
          max_tokens: 150,
        });
        return completion.choices[0].message.content;
      } catch (err) {
        console.error('AI Error:', err.message);
      }
    }
    return `🍽️ ${dish1} vs ${dish2}\n\n${dish1} offers classic comfort. ${dish2} brings excitement. Both are delicious!`;
  }
}

module.exports = new AIService();