import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqbztmvvvseolziehhxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYnp0bXZ2dnNlb2x6aWVoaHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODE0NjgsImV4cCI6MjEwNTU1NzQ2OH0.ZQgF_rf0N8Owwl9375q5PywoaqABfOv22mRfg2Fcdu8';

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
    {
        id: "appetizers",
        name: "Appetizers",
        image_url: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=80",
        description: "Start your meal with our delicious appetizers",
        display_order: 1
    },
    {
        id: "main-courses",
        name: "Main Courses",
        image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
        description: "Hearty and delicious main dishes",
        display_order: 2
    },
    {
        id: "salads",
        name: "Salads",
        image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80",
        description: "Fresh and crisp healthy salads",
        display_order: 3
    },
    {
        id: "desserts",
        name: "Desserts",
        image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
        description: "Sweet treats to end your meal",
        display_order: 4
    }
];

const dishes = [
    {
        id: "margherita-pizza",
        name: "Margherita Pizza",
        description: "Classic Italian pizza with fresh tomatoes, mozzarella, and basil",
        base_price: 12.99,
        category_id: "main-courses",
        images: ["https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80"],
        portions: [
            { value: "regular", label: "Regular", multiplier: 1 },
            { value: "large", label: "Large", multiplier: 1.5 },
            { value: "small", label: "Small", multiplier: 0.8 }
        ],
        ingredients: ["Tomatoes", "Mozzarella", "Basil", "Olive Oil"],
        preparation: "Hand-tossed pizza dough topped with San Marzano tomatoes, fresh mozzarella, and basil",
        allergens: ["Milk", "Gluten"],
        taste_profile: ["Fresh", "Savory"],
        is_popular: true,
        is_special: true,
        is_available: true
    },
    {
        id: "classic-burger",
        name: "Classic Gourmet Burger",
        description: "Juicy beef patty with fresh lettuce, tomato, cheese, and special sauce",
        base_price: 9.99,
        category_id: "main-courses",
        images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80"],
        portions: [
            { value: "single", label: "Single Patty", multiplier: 1 },
            { value: "double", label: "Double Patty", multiplier: 1.6 }
        ],
        ingredients: ["Beef Patty", "Lettuce", "Tomato", "Cheddar Cheese", "Special Sauce"],
        preparation: "Grilled beef patty served with fresh vegetables on a toasted brioche bun",
        allergens: ["Gluten", "Egg", "Milk"],
        taste_profile: ["Savory", "Rich"],
        is_popular: true,
        is_special: false,
        is_available: true
    },
    {
        id: "sushi-platter",
        name: "Premium Sushi Platter",
        description: "Assortment of fresh salmon, tuna nigiri and avocado rolls",
        base_price: 18.99,
        category_id: "main-courses",
        images: ["https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80"],
        portions: [
            { value: "regular", label: "Regular (8 pcs)", multiplier: 1 },
            { value: "large", label: "Large (12 pcs)", multiplier: 1.4 }
        ],
        ingredients: ["Fresh Salmon", "Tuna", "Sushi Rice", "Nori", "Wasabi"],
        preparation: "Handcrafted sushi using premium sashim-grade seafood",
        allergens: ["Fish", "Soy"],
        taste_profile: ["Fresh", "Umami"],
        is_popular: true,
        is_special: true,
        is_available: true
    },
    {
        id: "caesar-salad",
        name: "Fresh Caesar Salad",
        description: "Crisp romaine lettuce with house-made Caesar dressing, garlic croutons, and parmesan",
        base_price: 8.99,
        category_id: "salads",
        images: ["https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80"],
        portions: [
            { value: "regular", label: "Regular", multiplier: 1 },
            { value: "large", label: "Large", multiplier: 1.4 }
        ],
        ingredients: ["Romaine Lettuce", "Caesar Dressing", "Garlic Croutons", "Parmesan Cheese"],
        preparation: "Freshly tossed romaine lettuce with Caesar dressing and aged parmesan",
        allergens: ["Dairy", "Gluten", "Egg"],
        taste_profile: ["Crisp", "Creamy"],
        is_popular: false,
        is_special: false,
        is_available: true
    }
];

const banners = [
    {
        title: "Woodfired Artisan Pizza",
        image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
        dish_id: "margherita-pizza"
    },
    {
        title: "Fresh Chef's Sushi Special",
        image_url: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&auto=format&fit=crop&q=80",
        dish_id: "sushi-platter"
    }
];

const tables = [
    { table_number: 1, status: "active" },
    { table_number: 2, status: "active" },
    { table_number: 3, status: "active" },
    { table_number: 4, status: "active" },
    { table_number: 5, status: "active" }
];

async function seed() {
    console.log("Seeding Supabase...");

    const { error: catErr } = await supabase.from('categories').upsert(categories);
    if (catErr) console.error("Category Seed Error:", catErr);
    else console.log("✅ Categories Seeded Successfully!");

    const { error: dishErr } = await supabase.from('dishes').upsert(dishes);
    if (dishErr) console.error("Dish Seed Error:", dishErr);
    else console.log("✅ Dishes Seeded Successfully!");

    const { error: bannerErr } = await supabase.from('banners').upsert(banners);
    if (bannerErr) console.error("Banner Seed Error:", bannerErr);
    else console.log("✅ Banners Seeded Successfully!");

    const { error: tblErr } = await supabase.from('tables').upsert(tables, { onConflict: 'table_number' });
    if (tblErr) console.error("Tables Seed Error:", tblErr);
    else console.log("✅ Tables Seeded Successfully!");
}

seed();
