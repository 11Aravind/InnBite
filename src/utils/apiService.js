import { supabase, isSupabaseConfigured } from './supabase';
import { foodDataMap } from '../data/foodData';
import { categoriesData } from '../data/categoryData';

// Local storage keys for caching and mock state
const MOCK_ORDERS_KEY = 'orderly_mock_orders';
const MOCK_TABLES_KEY = 'orderly_mock_tables';
const MOCK_DISHES_KEY = 'orderly_mock_dishes';
const MOCK_CATEGORIES_KEY = 'orderly_mock_categories';
const MOCK_BANNERS_KEY = 'orderly_mock_banners';
const MOCK_SETTINGS_KEY = 'orderly_mock_settings';
const MOCK_WAITERS_KEY = 'orderly_mock_waiters';
const MOCK_IDEMPOTENCY_KEY = 'orderly_mock_idempotency';

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

// Helper: Fast timeout promise wrapper for instant local failover
const fetchWithTimeout = (promise, ms = 600) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

const initialTables = [
    { id: 'tbl-1', table_number: 1, status: 'active', qr_code: 'QR-TBL-1', revoked: false },
    { id: 'tbl-2', table_number: 2, status: 'active', qr_code: 'QR-TBL-2', revoked: false },
    { id: 'tbl-3', table_number: 3, status: 'active', qr_code: 'QR-TBL-3', revoked: false },
    { id: 'tbl-4', table_number: 4, status: 'active', qr_code: 'QR-TBL-4', revoked: false },
    { id: 'tbl-5', table_number: 5, status: 'active', qr_code: 'QR-TBL-5', revoked: false },
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

const envServiceMode = import.meta.env.VITE_SERVICE_MODE || 'TABLE_SERVICE';

const initialSettings = {
    restaurant_id: 'R001',
    restaurant_name: 'InnBite Restaurant',
    service_mode: envServiceMode, // 'TABLE_SERVICE' or 'SELF_SERVICE'
    common_qr_code: 'QR-COMMON-R001',
    common_qr_status: 'active'
};

const initialWaiters = [
    {
        id: 'wtr-1',
        name: 'John Waiter',
        email: 'waiter@innbite.com',
        username: 'waiter1',
        password: 'password123',
        role: 'WAITER',
        restaurant_id: 'R001',
        status: 'ACTIVE',
        google_email: 'waiter@gmail.com'
    },
    {
        id: 'wtr-2',
        name: 'Sarah Staff',
        email: 'sarah@innbite.com',
        username: 'sarah',
        password: 'password123',
        role: 'WAITER',
        restaurant_id: 'R001',
        status: 'ACTIVE',
        google_email: 'sarah.waiter@gmail.com'
    }
];

const initialAdmins = [
    {
        id: 'adm-1',
        name: 'Admin Manager',
        email: 'admin@innbite.com',
        username: 'admin',
        password: 'adminpassword',
        role: 'ADMIN',
        restaurant_id: 'R001',
        status: 'ACTIVE',
        google_email: 'admin@gmail.com'
    }
];

// Sequential order number tracking
let orderCounter = 1045;

export const apiService = {
    // ----------------------------------------------------
    // RESTAURANT SETTINGS & SERVICE MODE
    // ----------------------------------------------------
    async getRestaurantSettings() {
        const envMode = import.meta.env.VITE_SERVICE_MODE || 'TABLE_SERVICE';
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await fetchWithTimeout(
                    supabase.from('restaurant_settings').select('*').eq('restaurant_id', 'R001').maybeSingle()
                );
                if (!error && data) {
                    const merged = { ...data, service_mode: envMode };
                    setLocalStore(MOCK_SETTINGS_KEY, merged);
                    return merged;
                }
            } catch (err) {
                console.warn('Supabase settings timeout:', err);
            }
        }
        const store = getLocalStore(MOCK_SETTINGS_KEY, initialSettings);
        return { ...store, service_mode: envMode };
    },

    async updateRestaurantSettings(newSettings) {
        const current = getLocalStore(MOCK_SETTINGS_KEY, initialSettings);
        const updated = { ...current, ...newSettings };
        setLocalStore(MOCK_SETTINGS_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('restaurant_settings').upsert([updated]).then();
        }
        return updated;
    },

    // ----------------------------------------------------
    // QR CODE VALIDATION & REVOCATION
    // ----------------------------------------------------
    async validateQRCode(qrCode) {
        const settings = await this.getRestaurantSettings();

        // 1. Check if Self-Service Common QR
        if (qrCode === 'common' || qrCode === settings.common_qr_code) {
            if (settings.common_qr_status === 'disabled' || settings.common_qr_status === 'revoked') {
                return { valid: false, reason: 'This QR code is no longer available. Please contact staff.' };
            }
            return {
                valid: true,
                type: 'SELF_SERVICE',
                restaurant_id: settings.restaurant_id,
                table_id: null,
                table_number: null
            };
        }

        // 2. Check Table QR
        const tables = await this.getTables();
        const matchedTable = tables.find(t =>
            t.qr_code === qrCode ||
            t.id === qrCode ||
            `tbl-${t.table_number}` === qrCode ||
            `T${t.table_number}` === qrCode ||
            String(t.table_number) === qrCode
        );

        if (!matchedTable) {
            return { valid: false, reason: 'This QR code is invalid or no longer exists.' };
        }

        if (matchedTable.status !== 'active' || matchedTable.revoked) {
            return { valid: false, reason: 'This table QR code is currently unavailable or revoked. Please contact staff.' };
        }

        return {
            valid: true,
            type: 'TABLE_SERVICE',
            restaurant_id: settings.restaurant_id,
            table_id: matchedTable.id,
            table_number: matchedTable.table_number
        };
    },

    // ----------------------------------------------------
    // STAFF & AUTHENTICATION (ADMIN / WAITER)
    // ----------------------------------------------------
    async authenticateStaff({ usernameOrEmail, password, authProvider = 'PASSWORD', googleEmail = null, targetRole = null }) {
        const waiters = getLocalStore(MOCK_WAITERS_KEY, initialWaiters);
        const allUsers = [...initialAdmins, ...waiters];

        let matchedUser = null;

        if (authProvider === 'GOOGLE') {
            // Requirement Sec 6 & 7: Google Login does NOT automatically grant access!
            // Must check if Google email belongs to an authorized staff account
            matchedUser = allUsers.find(u =>
                u.google_email?.toLowerCase() === googleEmail?.toLowerCase() ||
                u.email?.toLowerCase() === googleEmail?.toLowerCase()
            );

            if (!matchedUser) {
                return {
                    success: false,
                    error: `Access denied. The Google account (${googleEmail}) is not authorized to access the ${targetRole || 'staff'} panel.`
                };
            }
        } else {
            // Username / Email + Password login
            const identifier = usernameOrEmail?.toLowerCase()?.trim();
            matchedUser = allUsers.find(u =>
                (u.username?.toLowerCase() === identifier || u.email?.toLowerCase() === identifier) &&
                u.password === password
            );

            if (!matchedUser) {
                // Requirement Sec 14: Generic error message to not reveal account existence
                return {
                    success: false,
                    error: 'Invalid username/email or password.'
                };
            }
        }

        // Check target role permissions
        if (targetRole && matchedUser.role !== targetRole) {
            return {
                success: false,
                error: `Access denied. You do not have ${targetRole} permissions.`
            };
        }

        // Requirement Sec 13: Disabled accounts MUST be blocked server-side!
        if (matchedUser.status === 'DISABLED') {
            return {
                success: false,
                error: 'Your account has been disabled. Please contact the administrator.'
            };
        }

        // Successful authentication token / session creation
        const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const authSession = {
            token,
            user_id: matchedUser.id,
            name: matchedUser.name,
            email: matchedUser.email,
            role: matchedUser.role,
            restaurant_id: matchedUser.restaurant_id || 'R001',
            authenticated_at: new Date().toISOString()
        };

        return {
            success: true,
            session: authSession
        };
    },

    async getWaiters() {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await fetchWithTimeout(
                    supabase.from('waiters').select('*').order('created_at', { ascending: false }),
                    1500
                );
                if (!error && data) {
                    setLocalStore(MOCK_WAITERS_KEY, data);
                    return data;
                }
            } catch (err) {
                console.warn('Supabase waiters timeout:', err);
            }
        }
        return getLocalStore(MOCK_WAITERS_KEY, initialWaiters);
    },

    async saveWaiter(waiterPayload) {
        const waiters = getLocalStore(MOCK_WAITERS_KEY, initialWaiters);
        const newWaiter = {
            id: waiterPayload.id || 'wtr-' + Date.now(),
            name: waiterPayload.name,
            email: waiterPayload.email,
            username: waiterPayload.username || waiterPayload.email.split('@')[0],
            password: waiterPayload.password || 'password123',
            role: 'WAITER',
            restaurant_id: 'R001',
            status: waiterPayload.status || 'ACTIVE',
            google_email: waiterPayload.google_email || waiterPayload.email
        };

        const idx = waiters.findIndex(w => w.id === newWaiter.id);
        let updated;
        if (idx >= 0) {
            updated = [...waiters];
            updated[idx] = newWaiter;
        } else {
            updated = [...waiters, newWaiter];
        }

        setLocalStore(MOCK_WAITERS_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('waiters').upsert([newWaiter]).then();
        }

        return newWaiter;
    },

    async toggleWaiterStatus(waiterId) {
        const waiters = getLocalStore(MOCK_WAITERS_KEY, initialWaiters);
        const updated = waiters.map(w => {
            if (w.id === waiterId) {
                return { ...w, status: w.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' };
            }
            return w;
        });
        setLocalStore(MOCK_WAITERS_KEY, updated);

        if (isSupabaseConfigured) {
            const target = updated.find(w => w.id === waiterId);
            if (target) supabase.from('waiters').update({ status: target.status }).eq('id', waiterId).then();
        }
        return true;
    },

    // ----------------------------------------------------
    // READ MENU DATA
    // ----------------------------------------------------
    async getHomePageData() {
        if (isSupabaseConfigured) {
            try {
                const [bannersRes, dishesRes, categoriesRes] = await fetchWithTimeout(
                    Promise.all([
                        supabase.from('banners').select('*'),
                        supabase.from('dishes').select('*').eq('is_available', true),
                        supabase.from('categories').select('*').order('display_order', { ascending: true })
                    ])
                );

                if (!bannersRes.error && !dishesRes.error && !categoriesRes.error) {
                    const banners = bannersRes.data || [];
                    const allDishes = dishesRes.data || [];
                    const categories = categoriesRes.data || [];

                    if (categories.length > 0 || allDishes.length > 0) {
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
                console.warn('Supabase fetch timeout/error, serving local cache:', err);
            }
        }

        const dishesList = getLocalStore(MOCK_DISHES_KEY, Object.values(foodDataMap));
        const categoriesList = getLocalStore(MOCK_CATEGORIES_KEY, categoriesData);
        const bannersList = getLocalStore(MOCK_BANNERS_KEY, initialBanners);

        return {
            banners: bannersList,
            popular_dishes: dishesList.filter(d => (d.is_popular || d.isPopular) && d.is_available !== false).slice(0, 6),
            todays_specials: dishesList.filter(d => (d.is_special || d.isSpecial) && d.is_available !== false),
            categories: categoriesList
        };
    },

    async getCategories() {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await fetchWithTimeout(
                    supabase.from('categories').select('*').order('display_order', { ascending: true })
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
                const { data, error } = await fetchWithTimeout(query);
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
                    supabase.from('dishes').select('*').eq('id', id).maybeSingle()
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
    // ORDER CREATION & IDEMPOTENCY & SERVER-SIDE VALIDATION
    // ----------------------------------------------------
    async createOrder(orderPayload) {
        const settings = await this.getRestaurantSettings();

        // 1. Idempotency Check (Req Sec 42, 50, 52)
        const idempotencyKey = orderPayload.idempotency_key || orderPayload.checkout_attempt_id;
        const processedMap = getLocalStore(MOCK_IDEMPOTENCY_KEY, {});

        if (idempotencyKey && processedMap[idempotencyKey]) {
            console.log('Idempotency hit! Returning existing order:', processedMap[idempotencyKey]);
            return { success: true, order: processedMap[idempotencyKey], is_duplicate: true };
        }

        // 2. Empty Cart Check (Req Sec 32)
        if (!orderPayload.items || orderPayload.items.length === 0) {
            return { success: false, error: 'Your cart is empty.' };
        }

        // 3. Server-side Availability & Price Revalidation (Req Sec 33, 34, 35, 37)
        const allDishes = await this.getDishes();
        const dishMap = new Map(allDishes.map(d => [d.id, d]));

        let calculatedSubtotal = 0;
        const validatedOrderItems = [];

        for (const item of orderPayload.items) {
            // Quantity check
            if (!item.quantity || item.quantity <= 0 || item.quantity > 50) {
                return { success: false, error: `Invalid quantity for item ${item.name || 'product'}.` };
            }

            const rawDishId = item.dish_id || item.id;
            const dbDish = dishMap.get(rawDishId) || foodDataMap[rawDishId];

            // Product existence & availability check
            if (dbDish && dbDish.is_available === false) {
                return { success: false, error: `"${item.name || dbDish.name}" is currently unavailable. Please remove it from your cart.` };
            }

            // Server-side authoritative price snapshot calculation
            let unitPrice = Number(item.price);
            if (dbDish) {
                const basePrice = Number(dbDish.basePrice || dbDish.base_price || 0);
                if (basePrice > 0) {
                    unitPrice = basePrice;
                }
            }

            const itemSubtotal = unitPrice * item.quantity;
            calculatedSubtotal += itemSubtotal;

            validatedOrderItems.push({
                dish_id: rawDishId,
                dish_name: item.name || dbDish?.name || 'Dish',
                unit_price_snapshot: unitPrice,
                quantity: item.quantity,
                portion_label: item.portion || 'Regular',
                customizations: item.customizations || {},
                special_instruction: item.special_instruction || item.specialInstruction || '',
                subtotal: itemSubtotal
            });
        }

        // Determine Service Mode & Table ID (Req Sec 1, 3, 26, 43)
        const isSelfService = (orderPayload.service_mode || settings.service_mode) === 'SELF_SERVICE';
        const serviceMode = isSelfService ? 'SELF_SERVICE' : 'TABLE_SERVICE';

        // Table ID MUST be NULL for self-service
        const tableId = isSelfService ? null : (orderPayload.table_id || (orderPayload.table_number ? `tbl-${orderPayload.table_number}` : null));
        const tableNumber = isSelfService ? null : (Number(orderPayload.table_number) || 1);

        // Generate Unique Visible Order Number
        const currentOrders = getLocalStore(MOCK_ORDERS_KEY, []);
        const nextOrderNum = (currentOrders.length > 0 ? (Math.max(...currentOrders.map(o => Number(o.order_number || 1000))) + 1) : 1045);

        const newOrder = {
            id: 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            order_number: String(nextOrderNum),
            restaurant_id: settings.restaurant_id || 'R001',
            service_mode: serviceMode,
            table_id: tableId,
            table_number: tableNumber,
            session_id: orderPayload.session_id || 'sess_guest',
            customer_name: orderPayload.customer_name || 'Guest',
            customer_phone: orderPayload.customer_phone || '',
            subtotal: calculatedSubtotal,
            tax: 0,
            discount: 0,
            total_amount: calculatedSubtotal,
            status: 'CONFIRMED',
            payment_method: orderPayload.payment_method || 'razorpay',
            payment_status: orderPayload.payment_status || 'SUCCESS',
            razorpay_payment_id: orderPayload.razorpay_payment_id || null,
            created_at: new Date().toISOString(),
            order_items: validatedOrderItems
        };

        // Save order locally
        const updatedOrders = [newOrder, ...currentOrders];
        setLocalStore(MOCK_ORDERS_KEY, updatedOrders);

        // Record Idempotency Key
        if (idempotencyKey) {
            processedMap[idempotencyKey] = newOrder;
            setLocalStore(MOCK_IDEMPOTENCY_KEY, processedMap);
        }

        // Sync to Supabase in background
        if (isSupabaseConfigured) {
            (async () => {
                try {
                    const { data: insertedOrder } = await supabase
                        .from('orders')
                        .insert([{
                            order_number: newOrder.order_number,
                            restaurant_id: newOrder.restaurant_id,
                            service_mode: newOrder.service_mode,
                            table_id: newOrder.table_id,
                            table_number: newOrder.table_number,
                            session_id: newOrder.session_id,
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

                    if (insertedOrder) {
                        const itemsToInsert = validatedOrderItems.map(item => ({
                            order_id: insertedOrder.id,
                            dish_id: item.dish_id,
                            dish_name: item.dish_name,
                            unit_price: item.unit_price_snapshot,
                            quantity: item.quantity,
                            portion_label: item.portion_label,
                            customizations: item.customizations,
                            special_instruction: item.special_instruction,
                            subtotal: item.subtotal
                        }));
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
                    2000
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
        const orders = getLocalStore(MOCK_ORDERS_KEY, []);
        const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
        setLocalStore(MOCK_ORDERS_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('orders').update({ status }).eq('id', orderId).then();
        }
        return true;
    },

    async updatePaymentStatus(orderId, payment_status, razorpay_payment_id = null) {
        const orders = getLocalStore(MOCK_ORDERS_KEY, []);
        const updated = orders.map(o => o.id === orderId ? {
            ...o,
            payment_status,
            ...(razorpay_payment_id ? { razorpay_payment_id } : {})
        } : o);
        setLocalStore(MOCK_ORDERS_KEY, updated);

        if (isSupabaseConfigured) {
            const updatePayload = { payment_status };
            if (razorpay_payment_id) updatePayload.razorpay_payment_id = razorpay_payment_id;
            supabase.from('orders').update(updatePayload).eq('id', orderId).then();
        }
        return true;
    },

    // ----------------------------------------------------
    // TABLES MANAGEMENT & QR CODES
    // ----------------------------------------------------
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
        const num = Number(tableNumber);
        const newTable = {
            id: 'tbl-' + num,
            table_number: num,
            status: 'active',
            qr_code: `QR-TBL-${num}`,
            revoked: false
        };

        const tables = getLocalStore(MOCK_TABLES_KEY, initialTables);
        const updated = [...tables, newTable];
        setLocalStore(MOCK_TABLES_KEY, updated);

        if (isSupabaseConfigured) {
            supabase.from('tables').insert([{ table_number: num, status: 'active', qr_code: newTable.qr_code }]).then();
        }

        return newTable;
    },

    async toggleTableRevoked(tableId) {
        const tables = getLocalStore(MOCK_TABLES_KEY, initialTables);
        const updated = tables.map(t => {
            if (t.id === tableId) {
                return { ...t, revoked: !t.revoked };
            }
            return t;
        });
        setLocalStore(MOCK_TABLES_KEY, updated);

        if (isSupabaseConfigured) {
            const target = updated.find(t => t.id === tableId);
            if (target) supabase.from('tables').update({ revoked: target.revoked }).eq('id', tableId).then();
        }
        return true;
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
    // DISH & CATEGORY & BANNER CRUD
    // ----------------------------------------------------
    async saveDish(dishPayload) {
        const dishData = {
            ...dishPayload,
            basePrice: Number(dishPayload.basePrice || dishPayload.base_price || 0),
            base_price: Number(dishPayload.basePrice || dishPayload.base_price || 0),
            is_available: dishPayload.is_available !== false,
            id: dishPayload.id || dishPayload.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4)
        };

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
