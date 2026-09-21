import { supabase, isSupabaseConfigured } from './supabase';
import { foodDataMap } from '../data/foodData';
import { categoriesData } from '../data/categoryData';

// Local storage keys for instant caching
const MOCK_ORDERS_KEY = 'orderly_mock_orders';
const MOCK_TABLES_KEY = 'orderly_mock_tables';
const MOCK_DISHES_KEY = 'orderly_mock_dishes';
const MOCK_CATEGORIES_KEY = 'orderly_mock_categories';
const MOCK_BANNERS_KEY = 'orderly_mock_banners';

const getLocalStore = (key, fallback) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
};

const setLocalStore = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
        console.error('LocalStorage write error:', err);
    }
};

// Helper: Fast timeout promise wrapper (1.5 seconds max) to prevent network lag
const fetchWithTimeout = (promise, ms = 1500) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

const initialTables = [
    { id: 'tbl-1', table_number: 1, status: 'active' },
    { id: 'tbl-2', table_number: 2, status: 'active' },
    { id: 'tbl-3', table_number: 3, status: 'active' },
    { id: 'tbl-4', table_number: 4, status: 'active' },
    { id: 'tbl-5', table_number: 5, status: 'active' },
];

const initialBanners = [
    {
        id: 'banner-1',
        title: 'Special Woodfired Pizza',
        image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
        dish_id: 'margherita-pizza'
    },
    {
        id: 'banner-2',
        title: 'Fresh Chef Sushi Special',
        image_url: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&auto=format&fit=crop&q=80',
        dish_id: 'sushi-platter'
    }
];

export const apiService = {
    // ----------------------------------------------------
    // INSTANT READ: Home Page Data
    // ----------------------------------------------------
    async getHomePageData() {
        if (isSupabaseConfigured) {
            try {
                const [bannersRes, dishesRes, categoriesRes] = await fetchWithTimeout(
                    Promise.all([
                        supabase.from('banners').select('*'),
                        supabase.from('dishes').select('*').eq('is_available', true),
                        supabase.from('categories').select('*').order('display_order', { ascending: true })
                    ]),
                    1500
                );

                if (!bannersRes.error && !dishesRes.error && !categoriesRes.error) {
                    const banners = bannersRes.data || [];
                    const allDishes = dishesRes.data || [];
                    const categories = categoriesRes.data || [];

                    if (categories.length > 0 || allDishes.length > 0) {
                        // Cache for instant future loads
                        setLocalStore(MOCK_DISHES_KEY, allDishes);
                        setLocalStore(MOCK_CATEGORIES_KEY, categories);
                        if (banners.length > 0) setLocalStore(MOCK_BANNERS_KEY, banners);

                        return {
                            banners: banners.length > 0 ? banners : initialBanners,
                            popular_dishes: allDishes.filter(d => d.is_popular),
                            todays_specials: allDishes.filter(d => d.is_special),
                            categories
                        };
                    }
                }
            } catch (err) {
                console.warn('Supabase fetch timeout/error, serving instant local cache:', err);
            }
        }

        const dishesList = getLocalStore(MOCK_DISHES_KEY, Object.values(foodDataMap));
        const categoriesList = getLocalStore(MOCK_CATEGORIES_KEY, categoriesData);
        const bannersList = getLocalStore(MOCK_BANNERS_KEY, initialBanners);

        return {
            banners: bannersList,
            popular_dishes: dishesList.filter(d => d.is_popular || d.isPopular).slice(0, 4),
            todays_specials: dishesList.filter(d => d.is_special || d.isSpecial || Number(d.basePrice || d.base_price) > 12),
            categories: categoriesList
        };
    },

    async getCategories() {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await fetchWithTimeout(
                    supabase.from('categories').select('*').order('display_order', { ascending: true }),
                    1500
                );
                if (!error && data && data.length > 0) {
                    setLocalStore(MOCK_CATEGORIES_KEY, data);
                    return data;
                }
            } catch (err) {
                console.warn('Supabase categories timeout:', err);
            }
        }
        return getLocalStore(MOCK_CATEGORIES_KEY, categoriesData);
    },

    async getDishes(categoryId = null) {
        if (isSupabaseConfigured) {
            try {
                let query = supabase.from('dishes').select('*');
                if (categoryId) query = query.eq('category_id', categoryId);
                const { data, error } = await fetchWithTimeout(query, 1500);
                if (!error && data && data.length > 0) {
                    if (!categoryId) setLocalStore(MOCK_DISHES_KEY, data);
                    return data;
                }
            } catch (err) {
                console.warn('Supabase dishes timeout:', err);
            }
        }

        const allDishes = getLocalStore(MOCK_DISHES_KEY, Object.values(foodDataMap));
        if (categoryId) {
            return allDishes.filter(d => d.category === categoryId || d.category_id === categoryId);
        }
        return allDishes;
    },

    async getDishById(id) {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await fetchWithTimeout(
                    supabase.from('dishes').select('*').eq('id', id).maybeSingle(),
                    1500
                );
                if (!error && data) return data;
            } catch (err) {
                console.warn('Supabase dish fetch timeout:', err);
            }
        }
        const allDishes = getLocalStore(MOCK_DISHES_KEY, Object.values(foodDataMap));
        return allDishes.find(d => d.id === id) || foodDataMap[id] || null;
    },

    // ----------------------------------------------------
    // OPTIMISTIC WRITE: Create Order (0ms UI Latency)
    // ----------------------------------------------------
    async createOrder(orderPayload) {
        const newOrder = {
            id: 'ord-' + Date.now(),
            table_number: Number(orderPayload.table_number) || 1,
            customer_name: orderPayload.customer_name || 'Guest',
            customer_phone: orderPayload.customer_phone || '',
            total_amount: Number(orderPayload.total_amount),
            status: 'pending',
            payment_method: orderPayload.payment_method || 'counter',
            payment_status: orderPayload.payment_status || 'pending',
            razorpay_payment_id: orderPayload.razorpay_payment_id || null,
            created_at: new Date().toISOString(),
            order_items: orderPayload.items || []
        };

        // 1. Optimistic Local Save (Instant 0ms UI feedback)
        const existingOrders = getLocalStore(MOCK_ORDERS_KEY, []);
        const updatedOrders = [newOrder, ...existingOrders];
        setLocalStore(MOCK_ORDERS_KEY, updatedOrders);

        // 2. Background Sync to Supabase
        if (isSupabaseConfigured) {
            (async () => {
                try {
                    const { data: dbDishes } = await supabase.from('dishes').select('id');
                    const validDishIds = new Set((dbDishes || []).map(d => d.id));

                    const { data: insertedOrder, error: orderErr } = await supabase
                        .from('orders')
                        .insert([{
                            table_number: newOrder.table_number,
                            customer_name: newOrder.customer_name,
                            customer_phone: newOrder.customer_phone,
                            total_amount: newOrder.total_amount,
                            status: newOrder.status,
                            payment_method: newOrder.payment_method,
                            payment_status: newOrder.payment_status,
                            razorpay_payment_id: newOrder.razorpay_payment_id
                        }])
                        .select()
                        .single();

                    if (!orderErr && insertedOrder) {
                        const itemsToInsert = (orderPayload.items || []).map(item => {
                            const rawDishId = item.dish_id || item.id;
                            return {
                                order_id: insertedOrder.id,
                                dish_id: validDishIds.has(rawDishId) ? rawDishId : null,
                                dish_name: item.name,
                                portion_label: item.portion || 'Regular',
                                unit_price: item.price,
                                quantity: item.quantity,
                                subtotal: item.price * item.quantity
                            };
                        });
                        await supabase.from('order_items').insert(itemsToInsert);
                    }
                } catch (err) {
                    console.warn('Background Supabase order sync error:', err);
                }
            })();
        }

        return { success: true, order: newOrder };
    },

    async getOrders() {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await fetchWithTimeout(
                    supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
                    1500
                );
                if (!error && data) {
                    setLocalStore(MOCK_ORDERS_KEY, data);
                    return data;
                }
            } catch (err) {
                console.warn('Supabase fetch orders timeout:', err);
            }
        }
        return getLocalStore(MOCK_ORDERS_KEY, []);
    },

    async updateOrderStatus(orderId, status) {
        // 1. Instant local update
        const orders = getLocalStore(MOCK_ORDERS_KEY, []);
        const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
        setLocalStore(MOCK_ORDERS_KEY, updated);

        // 2. Background sync
        if (isSupabaseConfigured) {
            supabase.from('orders').update({ status }).eq('id', orderId).then();
        }
        return true;
    },

    async updatePaymentStatus(orderId, payment_status, razorpay_payment_id = null) {
        // 1. Instant local update
        const orders = getLocalStore(MOCK_ORDERS_KEY, []);
        const updated = orders.map(o => o.id === orderId ? {
            ...o,
            payment_status,
            ...(razorpay_payment_id ? { razorpay_payment_id } : {})
        } : o);
        setLocalStore(MOCK_ORDERS_KEY, updated);

        // 2. Background sync
        if (isSupabaseConfigured) {
            const updatePayload = { payment_status };
            if (razorpay_payment_id) updatePayload.razorpay_payment_id = razorpay_payment_id;
            supabase.from('orders').update(updatePayload).eq('id', orderId).then();
        }
        return true;
    },

    async getTables() {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await fetchWithTimeout(
                    supabase.from('tables').select('*').order('table_number', { ascending: true }),
                    1500
                );
                if (!error && data && data.length > 0) {
                    setLocalStore(MOCK_TABLES_KEY, data);
                    return data;
                }
            } catch (err) {
                console.warn('Supabase tables timeout:', err);
            }
        }
        return getLocalStore(MOCK_TABLES_KEY, initialTables);
    },

    async createTable(tableNumber) {
        const newTable = {
            id: 'tbl-' + Date.now(),
            table_number: Number(tableNumber),
            status: 'active'
        };

        const tables = getLocalStore(MOCK_TABLES_KEY, initialTables);
        const updated = [...tables, newTable];
        setLocalStore(MOCK_TABLES_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('tables').insert([{ table_number: Number(tableNumber) }]).then();
        }

        return newTable;
    },

    async deleteTable(tableId) {
        const tables = getLocalStore(MOCK_TABLES_KEY, initialTables);
        const updated = tables.filter(t => t.id !== tableId);
        setLocalStore(MOCK_TABLES_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('tables').delete().eq('id', tableId).then();
        }
        return true;
    },

    // ----------------------------------------------------
    // OPTIMISTIC DISH CRUD: Instant 0ms Admin Saving
    // ----------------------------------------------------
    async saveDish(dishPayload) {
        const dishData = {
            ...dishPayload,
            basePrice: Number(dishPayload.basePrice || dishPayload.base_price || 0),
            base_price: Number(dishPayload.basePrice || dishPayload.base_price || 0),
            id: dishPayload.id || dishPayload.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4)
        };

        // 1. Instant local update (0ms UI latency)
        const dishes = getLocalStore(MOCK_DISHES_KEY, Object.values(foodDataMap));
        const index = dishes.findIndex(d => d.id === dishData.id);
        let updated;
        if (index >= 0) {
            updated = [...dishes];
            updated[index] = dishData;
        } else {
            updated = [dishData, ...dishes];
        }
        setLocalStore(MOCK_DISHES_KEY, updated);

        // 2. Background sync to Supabase
        if (isSupabaseConfigured) {
            supabase.from('dishes').upsert([dishData]).then();
        }

        return dishData;
    },

    async deleteDish(dishId) {
        const dishes = getLocalStore(MOCK_DISHES_KEY, Object.values(foodDataMap));
        const updated = dishes.filter(d => d.id !== dishId);
        setLocalStore(MOCK_DISHES_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('dishes').delete().eq('id', dishId).then();
        }
        return true;
    },

    async saveCategory(categoryPayload) {
        const categoryData = {
            ...categoryPayload,
            id: categoryPayload.id || categoryPayload.name.toLowerCase().replace(/\s+/g, '-')
        };

        const categories = getLocalStore(MOCK_CATEGORIES_KEY, categoriesData);
        const index = categories.findIndex(c => c.id === categoryData.id);
        let updated;
        if (index >= 0) {
            updated = [...categories];
            updated[index] = categoryData;
        } else {
            updated = [...categories, categoryData];
        }
        setLocalStore(MOCK_CATEGORIES_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('categories').upsert([categoryData]).then();
        }

        return categoryData;
    },

    async deleteCategory(categoryId) {
        const categories = getLocalStore(MOCK_CATEGORIES_KEY, categoriesData);
        const updated = categories.filter(c => c.id !== categoryId);
        setLocalStore(MOCK_CATEGORIES_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('categories').delete().eq('id', categoryId).then();
        }
        return true;
    },

    async saveBanner(bannerPayload) {
        const bannerData = {
            ...bannerPayload,
            id: bannerPayload.id || 'banner-' + Date.now()
        };

        const banners = getLocalStore(MOCK_BANNERS_KEY, initialBanners);
        const index = banners.findIndex(b => b.id === bannerData.id);
        let updated;
        if (index >= 0) {
            updated = [...banners];
            updated[index] = bannerData;
        } else {
            updated = [...banners, bannerData];
        }
        setLocalStore(MOCK_BANNERS_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('banners').upsert([bannerData]).then();
        }

        return bannerData;
    },

    async deleteBanner(bannerId) {
        const banners = getLocalStore(MOCK_BANNERS_KEY, initialBanners);
        const updated = banners.filter(b => b.id !== bannerId);
        setLocalStore(MOCK_BANNERS_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('banners').delete().eq('id', bannerId).then();
        }
        return true;
    }
};
