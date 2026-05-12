import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Product } from '@/lib/models/Product';
import { Category } from '@/lib/models/Category';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});

    // 1. Create Categories
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

    const catMap = categories.reduce((acc, cat) => {
      acc[cat.slug] = cat._id;
      return acc;
    }, {} as Record<string, any>);

    // 2. Create 10 Products
    const products = [
      {
        name: "Midnight Noir",
        description: "A deep, sophisticated dark roast with notes of smoked cocoa and dark cherry. Crafted for the bold narrative of the night.",
        category: catMap["signature-blends"],
        basePrice: 28,
        status: "active",
        stock: 50,
        imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Velvet Morning",
        description: "An elegant medium roast that glides across the palate with chocolate undertones and a silken finish.",
        category: catMap["signature-blends"],
        basePrice: 24,
        status: "active",
        stock: 65,
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Ethiopian Yirgacheffe",
        description: "A bright, celestial single origin with floral jasmine notes and a vibrant citrus acidity.",
        category: catMap["single-origin"],
        basePrice: 32,
        status: "active",
        stock: 30,
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Colombian Supremo",
        description: "The classic artisan choice. Perfectly balanced with a nutty aroma and subtle caramel sweetness.",
        category: catMap["single-origin"],
        basePrice: 26,
        status: "active",
        stock: 40,
        imageUrl: "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Golden Hour Roast",
        description: "Light and ethereal. Captured at the peak of morning light, featuring notes of honey and crisp pear.",
        category: catMap["signature-blends"],
        basePrice: 30,
        status: "active",
        stock: 25,
        imageUrl: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "The Artisan's Choice",
        description: "A seasonal curation of the finest beans, hand-selected for their exceptional character and depth.",
        category: catMap["the-reserve"],
        basePrice: 45,
        status: "active",
        stock: 15,
        imageUrl: "https://images.unsplash.com/photo-1497933321188-941f9ad36b12?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Smoked Oak Blend",
        description: "Earthy, robust, and unapologetically strong. Aged in charred oak to impart a woody complexity.",
        category: catMap["signature-blends"],
        basePrice: 34,
        status: "active",
        stock: 20,
        imageUrl: "https://images.unsplash.com/photo-1506372023823-741c83b836fe?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Vanilla Bean Infusion",
        description: "A subtle, aromatic narrative where Madagascar vanilla meets our signature light roast.",
        category: catMap["signature-blends"],
        basePrice: 28,
        status: "active",
        stock: 35,
        imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "Decaf Dream",
        description: "Full-bodied flavor without the wakefulness. A rich water-processed roast for the evening ritual.",
        category: catMap["signature-blends"],
        basePrice: 22,
        status: "active",
        stock: 55,
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800"
      },
      {
        name: "The Grand Cru",
        description: "Our most exclusive, limited-edition roast. Sourced from a single high-altitude farm in limited quantities.",
        category: catMap["the-reserve"],
        basePrice: 85,
        status: "active",
        stock: 10,
        imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800"
      }
    ];

    await Product.insertMany(products);

    return NextResponse.json({ 
      message: "Atelier collection successfully seeded.",
      categoriesCount: categories.length,
      productsCount: products.length
    });
  } catch (error) {
    console.error("Seeding Error:", error);
    return NextResponse.json({ error: "Inventory seeding failed" }, { status: 500 });
  }
}
