import { supabase, isSupabaseConfigured } from './supabase';
import { foodDataMap } from '../data/foodData';
import { categoriesData } from '../data/categoryData';

// Local storage keys for fallback state
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
    async getHomePageData() {
        if (isSupabaseConfigured) {
            try {
                const [bannersRes, dishesRes, categoriesRes] = await Promise.all([
                    supabase.from('banners').select('*'),
                    supabase.from('dishes').select('*').eq('is_available', true),
                    supabase.from('categories').select('*').order('display_order', { ascending: true })
                ]);

                if (!bannersRes.error && !dishesRes.error && !categoriesRes.error) {
                    const banners = bannersRes.data || [];
                    const allDishes = dishesRes.data || [];
                    const categories = categoriesRes.data || [];

                    // If Supabase returns actual rows, use them!
                    if (categories.length > 0 || allDishes.length > 0) {
                        return {
                            banners,
                            popular_dishes: allDishes.filter(d => d.is_popular),
                            todays_specials: allDishes.filter(d => d.is_special),
                            categories
                        };
                    }
                }
            } catch (err) {
                console.warn('Supabase home data fetch failed, using fallback:', err);
            }
        }

        // Guaranteed Fallback so customer screen is NEVER blank
        const dishesList = getLocalStore(MOCK_DISHES_KEY, Object.values(foodDataMap));
        const categoriesList = getLocalStore(MOCK_CATEGORIES_KEY, categoriesData);
        const bannersList = getLocalStore(MOCK_BANNERS_KEY, initialBanners);

        return {
            banners: bannersList,
            popular_dishes: dishesList.slice(0, 3),
            todays_specials: dishesList.filter(d => d.is_special || d.basePrice > 12),
            categories: categoriesList
        };
    },

    async getCategories() {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
                if (!error && data && data.length > 0) return data;
            } catch (err) {
                console.warn('Supabase categories fetch error:', err);
            }
        }
        return getLocalStore(MOCK_CATEGORIES_KEY, categoriesData);
    },

    async getDishes(categoryId = null) {
        if (isSupabaseConfigured) {
            try {
                let query = supabase.from('dishes').select('*');
                if (categoryId) query = query.eq('category_id', categoryId);
                const { data, error } = await query;
                if (!error && data && data.length > 0) return data;
            } catch (err) {
                console.warn('Supabase dishes fetch error:', err);
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
                const { data, error } = await supabase.from('dishes').select('*').eq('id', id).single();
                if (!error && data) return data;
            } catch (err) {
                console.warn('Supabase single dish fetch error:', err);
            }
        }
        const allDishes = getLocalStore(MOCK_DISHES_KEY, Object.values(foodDataMap));
        return allDishes.find(d => d.id === id) || foodDataMap[id] || null;
    },

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

        if (isSupabaseConfigured) {
            try {
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
                    const itemsToInsert = (orderPayload.items || []).map(item => ({
                        order_id: insertedOrder.id,
                        dish_id: item.dish_id || item.id,
                        dish_name: item.name,
                        portion_label: item.portion || 'Regular',
                        unit_price: item.price,
                        quantity: item.quantity,
                        subtotal: item.price * item.quantity
                    }));

                    await supabase.from('order_items').insert(itemsToInsert);
                    return { success: true, order: insertedOrder };
                }
            } catch (err) {
                console.error('Supabase createOrder error:', err);
            }
        }

        const existingOrders = getLocalStore(MOCK_ORDERS_KEY, []);
        const updatedOrders = [newOrder, ...existingOrders];
        setLocalStore(MOCK_ORDERS_KEY, updatedOrders);
        return { success: true, order: newOrder };
    },

    async getOrders() {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, order_items(*)')
                    .order('created_at', { ascending: false });
                if (!error && data) return data;
            } catch (err) {
                console.error('Supabase fetch orders error:', err);
            }
        }
        return getLocalStore(MOCK_ORDERS_KEY, []);
    },

    async updateOrderStatus(orderId, status) {
        if (isSupabaseConfigured) {
            try {
                await supabase.from('orders').update({ status }).eq('id', orderId);
            } catch (err) {
                console.error('Supabase update order status error:', err);
            }
        }

        const orders = getLocalStore(MOCK_ORDERS_KEY, []);
        const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
        setLocalStore(MOCK_ORDERS_KEY, updated);
        return true;
    },

    async updatePaymentStatus(orderId, payment_status, razorpay_payment_id = null) {
        if (isSupabaseConfigured) {
            try {
                const updatePayload = { payment_status };
                if (razorpay_payment_id) updatePayload.razorpay_payment_id = razorpay_payment_id;
                await supabase.from('orders').update(updatePayload).eq('id', orderId);
            } catch (err) {
                console.error('Supabase update payment status error:', err);
            }
        }

        const orders = getLocalStore(MOCK_ORDERS_KEY, []);
        const updated = orders.map(o => o.id === orderId ? {
            ...o,
            payment_status,
            ...(razorpay_payment_id ? { razorpay_payment_id } : {})
        } : o);
        setLocalStore(MOCK_ORDERS_KEY, updated);
        return true;
    },

    async getTables() {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase.from('tables').select('*').order('table_number', { ascending: true });
                if (!error && data && data.length > 0) return data;
            } catch (err) {
                console.warn('Supabase tables fetch error:', err);
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

        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase.from('tables').insert([{ table_number: Number(tableNumber) }]).select().single();
                if (!error && data) return data;
            } catch (err) {
                console.error('Supabase createTable error:', err);
            }
        }

        const tables = getLocalStore(MOCK_TABLES_KEY, initialTables);
        const updated = [...tables, newTable];
        setLocalStore(MOCK_TABLES_KEY, updated);
        return newTable;
    },

    async deleteTable(tableId) {
        if (isSupabaseConfigured) {
            try {
                await supabase.from('tables').delete().eq('id', tableId);
            } catch (err) {
                console.error('Supabase delete table error:', err);
            }
        }
        const tables = getLocalStore(MOCK_TABLES_KEY, initialTables);
        const updated = tables.filter(t => t.id !== tableId);
        setLocalStore(MOCK_TABLES_KEY, updated);
        return true;
    },

    async saveDish(dishPayload) {
        const dishData = {
            ...dishPayload,
            basePrice: Number(dishPayload.basePrice || dishPayload.base_price || 0),
            base_price: Number(dishPayload.basePrice || dishPayload.base_price || 0),
            id: dishPayload.id || dishPayload.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4)
        };

        if (isSupabaseConfigured) {
            try {
                const { error } = await supabase.from('dishes').upsert([dishData]);
                if (error) console.error('Supabase saveDish error:', error);
            } catch (err) {
                console.error('Supabase saveDish exception:', err);
            }
        }

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
        return dishData;
    },

    async deleteDish(dishId) {
        if (isSupabaseConfigured) {
            try {
                await supabase.from('dishes').delete().eq('id', dishId);
            } catch (err) {
                console.error('Supabase delete dish error:', err);
            }
        }
        const dishes = getLocalStore(MOCK_DISHES_KEY, Object.values(foodDataMap));
        const updated = dishes.filter(d => d.id !== dishId);
        setLocalStore(MOCK_DISHES_KEY, updated);
        return true;
    },

    async saveCategory(categoryPayload) {
        const categoryData = {
            ...categoryPayload,
            id: categoryPayload.id || categoryPayload.name.toLowerCase().replace(/\s+/g, '-')
        };

        if (isSupabaseConfigured) {
            try {
                await supabase.from('categories').upsert([categoryData]);
            } catch (err) {
                console.error('Supabase save category error:', err);
            }
        }

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
        return categoryData;
    },

    async deleteCategory(categoryId) {
        if (isSupabaseConfigured) {
            try {
                await supabase.from('categories').delete().eq('id', categoryId);
            } catch (err) {
                console.error('Supabase delete category error:', err);
            }
        }
        const categories = getLocalStore(MOCK_CATEGORIES_KEY, categoriesData);
        const updated = categories.filter(c => c.id !== categoryId);
        setLocalStore(MOCK_CATEGORIES_KEY, updated);
        return true;
    },

    async saveBanner(bannerPayload) {
        const bannerData = {
            ...bannerPayload,
            id: bannerPayload.id || 'banner-' + Date.now()
        };

        if (isSupabaseConfigured) {
            try {
                await supabase.from('banners').upsert([bannerData]);
            } catch (err) {
                console.error('Supabase save banner error:', err);
            }
        }

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
        return bannerData;
    },

    async deleteBanner(bannerId) {
        if (isSupabaseConfigured) {
            try {
                await supabase.from('banners').delete().eq('id', bannerId);
            } catch (err) {
                console.error('Supabase delete banner error:', err);
            }
        }
        const banners = getLocalStore(MOCK_BANNERS_KEY, initialBanners);
        const updated = banners.filter(b => b.id !== bannerId);
        setLocalStore(MOCK_BANNERS_KEY, updated);
        return true;
    }
};
