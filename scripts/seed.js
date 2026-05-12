require('dotenv').config();
const mongoose = require('mongoose');

// Mocking the models since we can't easily import TS models in a JS script without transpilation
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  basePrice: { type: Number, required: true },
  status: { type: String, enum: ['active', 'coming_soon', 'out_of_stock'], default: 'active' },
  imageUrl: { type: String },
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Purging existing data...");
    await Product.deleteMany({});
    await Category.deleteMany({});

    console.log("Creating categories...");
    const categories = await Category.insertMany([
      { 
        name: "Signature Blends", 
        slug: "signature-blends", 
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800",
        isActive: true 
      },
      { 
        name: "Single Origin", 
        slug: "single-origin", 
        imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800",
        isActive: true 
      },
      { 
        name: "The Reserve", 
        slug: "the-reserve", 
        imageUrl: "https://images.unsplash.com/photo-1497933321188-941f9ad36b12?auto=format&fit=crop&q=80&w=800",
        isActive: true 
      }
    ]);

    const catMap = {};
    categories.forEach(cat => {
      catMap[cat.slug] = cat._id;
    });

    console.log("Seeding 10 artisanal products...");
    const products = [
      {
        name: "Midnight Noir",
        description: "A deep, sophisticated dark roast with notes of smoked cocoa and dark cherry.",
        category: catMap["signature-blends"],
        basePrice: 28,
        status: "active",
        stock: 50,
        imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Velvet Morning",
        description: "An elegant medium roast that glides across the palate with chocolate undertones.",
        category: catMap["signature-blends"],
        basePrice: 24,
        status: "active",
        stock: 65,
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Ethiopian Yirgacheffe",
        description: "A bright, celestial single origin with floral jasmine notes and vibrant acidity.",
        category: catMap["single-origin"],
        basePrice: 32,
        status: "active",
        stock: 30,
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Colombian Supremo",
        description: "The classic artisan choice. Balanced with a nutty aroma and caramel sweetness.",
        category: catMap["single-origin"],
        basePrice: 26,
        status: "active",
        stock: 40,
        imageUrl: "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Golden Hour Roast",
        description: "Light and ethereal. Captured at the peak of morning light with notes of honey.",
        category: catMap["signature-blends"],
        basePrice: 30,
        status: "active",
        stock: 25,
        imageUrl: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "The Artisan's Choice",
        description: "A seasonal curation of the finest beans, hand-selected for exceptional character.",
        category: catMap["the-reserve"],
        basePrice: 45,
        status: "active",
        stock: 15,
        imageUrl: "https://images.unsplash.com/photo-1497933321188-941f9ad36b12?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Smoked Oak Blend",
        description: "Earthy, robust, and aged in charred oak to impart woody complexity.",
        category: catMap["signature-blends"],
        basePrice: 34,
        status: "active",
        stock: 20,
        imageUrl: "https://images.unsplash.com/photo-1506372023823-741c83b836fe?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Vanilla Bean Infusion",
        description: "A subtle, aromatic narrative where Madagascar vanilla meets our signature roast.",
        category: catMap["signature-blends"],
        basePrice: 28,
        status: "active",
        stock: 35,
        imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Decaf Dream",
        description: "Full-bodied flavor without the wakefulness. A rich water-processed roast.",
        category: catMap["signature-blends"],
        basePrice: 22,
        status: "active",
        stock: 55,
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "The Grand Cru",
        description: "Our most exclusive, limited-edition roast from a single high-altitude farm.",
        category: catMap["the-reserve"],
        basePrice: 85,
        status: "active",
        stock: 10,
        imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800"
      }
    ];

    await Product.insertMany(products);

    console.log("✅ Seed complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed();
