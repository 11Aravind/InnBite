import { supabase, isSupabaseConfigured } from './supabase';
import { APP_CONFIG } from '../config';
import { secureStorage } from './secureStorage';
import { convertToWebP } from './cropImage';

const envServiceMode = import.meta.env.VITE_SERVICE_MODE || 'TABLE_SERVICE';

// In-Memory High Performance Cache for Instant Page Transitions
const CACHE_TTL_MS = 60000; // 60s cache
const menuCache = {
    homeData: null,
    homeDataTime: 0,
    categories: null,
    categoriesTime: 0,
    dishes: null,
    dishesTime: 0,
    dishMap: new Map() // id -> { data, timestamp }
};

export const invalidateMenuCache = () => {
    menuCache.homeData = null;
    menuCache.categories = null;
    menuCache.dishes = null;
    menuCache.dishMap.clear();
};

export const getCategoryPriority = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('main')) return 1;
    if (n.includes('beverage') || n.includes('drink')) return 2;
    if (n.includes('starter') || n.includes('appetizer')) return 3;
    if (n.includes('chinese') || n.includes('chineese')) return 4;
    if (n.includes('dessert') || n.includes('desert')) return 5;
    if (n.includes('combo') || n.includes('commbo')) return 6;
    return 99;
};

export const sortCategoriesByPriority = (cats) => {
    if (!Array.isArray(cats)) return [];
    return [...cats].sort((a, b) => {
        const orderA = typeof a.display_order === 'number' && a.display_order > 0 ? a.display_order : getCategoryPriority(a.name);
        const orderB = typeof b.display_order === 'number' && b.display_order > 0 ? b.display_order : getCategoryPriority(b.name);
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
    });
};


export const apiService = {
    // ----------------------------------------------------
    // RESTAURANT SETTINGS & SERVICE MODE
    // ----------------------------------------------------
    async getRestaurantSettings() {
        let localFallback = null;
        try {
            const stored = secureStorage.getItem('innbite_custom_settings');
            if (stored) localFallback = typeof stored === 'string' ? JSON.parse(stored) : stored;
        } catch {
            // Ignore storage fallback error
        }

        const { data, error } = await supabase.from('restaurant_settings').select('*').eq('restaurant_id', 'R001').maybeSingle();
        if (error) {
            console.warn('Supabase settings fetch error (using fallback settings):', error.message);
            return {
                restaurant_id: 'R001',
                restaurant_name: `${APP_CONFIG.APP_NAME} Restaurant`,
                app_name: APP_CONFIG.APP_NAME,
                service_mode: envServiceMode,
                payment_mode: 'BOTH',
                theme_color: 'emerald',
                logo_url: '/logo.svg',
                ...localFallback
            };
        }
        if (!data) {
            return {
                restaurant_id: 'R001',
                restaurant_name: `${APP_CONFIG.APP_NAME} Restaurant`,
                app_name: APP_CONFIG.APP_NAME,
                service_mode: envServiceMode,
                payment_mode: 'BOTH',
                theme_color: 'emerald',
                logo_url: '/logo.svg',
                ...localFallback
            };
        }
        return {
            ...data,
            ...localFallback,
            service_mode: data.service_mode || localFallback?.service_mode || envServiceMode,
            payment_mode: data.payment_mode || localFallback?.payment_mode || 'BOTH',
            app_name: data.app_name || data.restaurant_name || localFallback?.app_name || APP_CONFIG.APP_NAME,
            theme_color: data.theme_color || localFallback?.theme_color || 'emerald',
            logo_url: data.logo_url || localFallback?.logo_url || '/logo.svg'
        };
    },

    async updateRestaurantSettings(newSettings) {
        const payload = {
            restaurant_id: 'R001',
            ...newSettings
        };

        // Store immediately in encrypted secureStorage so state updates instantly across tabs & renders securely
        try {
            secureStorage.setItem('innbite_custom_settings', payload);
        } catch {
            // Ignore storage write error
        }

        // Attempt Supabase upsert
        const { error } = await supabase.from('restaurant_settings').upsert([payload]);

        if (error) {
            console.warn('Supabase upsert warning on restaurant_settings:', error);
            // Handle missing columns gracefully if migration hasn't been run yet on database
            if (error.code === 'PGRST204' || error.message?.includes('schema cache')) {
                // Try upserting basic columns supported by initial schema
                const basePayload = {
                    restaurant_id: 'R001',
                    restaurant_name: payload.app_name || payload.restaurant_name || 'InnBite Restaurant',
                    service_mode: payload.service_mode || 'TABLE_SERVICE'
                };
                await supabase.from('restaurant_settings').upsert([basePayload]);
            } else {
                throw error;
            }
        }

        return payload;
    },

    // ----------------------------------------------------
    // QR CODE VALIDATION & REVOCATION
    // ----------------------------------------------------
    async validateQRCode(qrCode) {
        const settings = await this.getRestaurantSettings();
        if (qrCode === 'common' || qrCode === settings.common_qr_code) {
            if (settings.common_qr_status === 'disabled' || settings.common_qr_status === 'revoked') {
                return { valid: false, reason: 'This QR code is no longer available. Please contact staff.' };
            }
            return { valid: true, type: 'SELF_SERVICE', restaurant_id: settings.restaurant_id, table_id: null, table_number: null };
        }
        
        const tables = await this.getTables();
        const matchedTable = tables.find(t => t.qr_code === qrCode || t.id === qrCode || `tbl-${t.table_number}` === qrCode || `T${t.table_number}` === qrCode || String(t.table_number) === qrCode);
        
        if (!matchedTable) return { valid: false, reason: 'This QR code is invalid or no longer exists.' };
        if (matchedTable.status !== 'active' || matchedTable.revoked) return { valid: false, reason: 'This table QR code is currently unavailable or revoked. Please contact staff.' };
        
        return { valid: true, type: 'TABLE_SERVICE', restaurant_id: settings.restaurant_id, table_id: matchedTable.id, table_number: matchedTable.table_number };
    },

    // ----------------------------------------------------
    // STAFF & AUTHENTICATION (ADMIN / WAITER)
    // ----------------------------------------------------
    async authenticateStaff({ usernameOrEmail, password, authProvider = 'PASSWORD', googleEmail = null, targetRole = null }) {
        const [{ data: waiters = [] }, { data: admins = [] }] = await Promise.all([
            supabase.from('waiters').select('*'),
            supabase.from('admins').select('*')
        ]);
        
        const allUsers = [...(admins || []), ...(waiters || [])];
        let matchedUser = null;
        
        if (authProvider === 'GOOGLE') {
            matchedUser = allUsers.find(u => u.google_email?.toLowerCase() === googleEmail?.toLowerCase() || u.email?.toLowerCase() === googleEmail?.toLowerCase());
            if (!matchedUser) return { success: false, error: `Access denied. The Google account (${googleEmail}) is not authorized.` };
        } else {
            const identifier = usernameOrEmail?.toLowerCase()?.trim();
            matchedUser = allUsers.find(u => (u.username?.toLowerCase() === identifier || u.email?.toLowerCase() === identifier) && u.password === password);
            if (!matchedUser) return { success: false, error: 'Invalid username/email or password.' };
        }
        
        if (targetRole) {
            const isAllowed = matchedUser.role === targetRole || (targetRole === 'ADMIN' && matchedUser.role === 'SUPER_ADMIN');
            if (!isAllowed) return { success: false, error: `Access denied. You do not have ${targetRole} permissions.` };
        }
        if (matchedUser.status === 'DISABLED') return { success: false, error: 'Your account has been disabled. Please contact the administrator.' };
        
        return {
            success: true,
            session: {
                token: 'token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
                user_id: matchedUser.id,
                name: matchedUser.name,
                email: matchedUser.email,
                role: matchedUser.role,
                restaurant_id: matchedUser.restaurant_id || 'R001',
                authenticated_at: new Date().toISOString()
            }
        };
    },

    async getWaiters() {
        const { data, error } = await supabase.from('waiters').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async saveWaiter(waiterPayload) {
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
        const { error } = await supabase.from('waiters').upsert([newWaiter]);
        if (error) throw error;
        return newWaiter;
    },

    async toggleWaiterStatus(waiterId) {
        const { data: waiter } = await supabase.from('waiters').select('status').eq('id', waiterId).single();
        if (waiter) {
            const newStatus = waiter.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
            await supabase.from('waiters').update({ status: newStatus }).eq('id', waiterId);
        }
        return true;
    },

    // ----------------------------------------------------
    // READ MENU DATA (High Speed Cached)
    // ----------------------------------------------------
    async getHomePageData(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh && menuCache.homeData && (now - menuCache.homeDataTime < CACHE_TTL_MS)) {
            return menuCache.homeData;
        }

        const [bannersRes, dishesRes, categoriesRes, settings] = await Promise.all([
            supabase.from('banners').select('*'),
            supabase.from('dishes').select('*'),
            supabase.from('categories').select('*').order('display_order', { ascending: true }),
            this.getRestaurantSettings()
        ]);

        const banners = bannersRes.data || [];
        const allDishes = dishesRes.data || [];
        const categories = sortCategoriesByPriority(categoriesRes.data || []);


        // Pre-fill dish map & cache
        menuCache.dishes = allDishes;
        menuCache.dishesTime = now;
        allDishes.forEach(d => menuCache.dishMap.set(d.id, { data: d, timestamp: now }));

        menuCache.categories = categories;
        menuCache.categoriesTime = now;

        const result = {
            banners,
            all_dishes: allDishes,
            popular_dishes: allDishes.filter(d => (d.is_popular || d.isPopular) && d.is_available !== false),
            todays_specials: allDishes.filter(d => (d.is_special || d.isSpecial) && d.is_available !== false),
            categories,
            settings
        };

        menuCache.homeData = result;
        menuCache.homeDataTime = now;
        return result;
    },

    getCategoriesSync() {
        if (menuCache.categories) {
            return menuCache.categories;
        }
        return null;
    },

    getDishesSync(categoryId = null) {
        if (menuCache.dishes) {
            if (!categoryId) return menuCache.dishes;
            if (categoryId === 'popular') {
                return menuCache.dishes.filter(d => (d.is_popular || d.isPopular) && d.is_available !== false);
            }
            if (categoryId === 'special') {
                return menuCache.dishes.filter(d => (d.is_special || d.isSpecial) && d.is_available !== false);
            }
            const targetId = String(categoryId).toLowerCase();
            const categories = menuCache.categories || [];
            const targetCat = categories.find(c => String(c.id).toLowerCase() === targetId || String(c.name).toLowerCase() === targetId);
            const catIdToMatch = targetCat ? String(targetCat.id).toLowerCase() : targetId;
            const catNameToMatch = targetCat ? String(targetCat.name).toLowerCase() : targetId;

            return menuCache.dishes.filter(d => {
                const dCatId = String(d.category_id || d.categoryId || d.category || '').toLowerCase();
                const dCatName = String(d.category_name || '').toLowerCase();
                return dCatId === catIdToMatch || (dCatName && dCatName === catNameToMatch) || dCatId === targetId;
            });
        }
        return null;
    },

    getDishByIdSync(id) {
        if (!id) return null;
        const cached = menuCache.dishMap.get(id);
        if (cached) {
            return cached.data;
        }
        if (menuCache.dishes) {
            const found = menuCache.dishes.find(d => String(d.id) === String(id));
            if (found) {
                menuCache.dishMap.set(id, { data: found, timestamp: Date.now() });
                return found;
            }
        }
        if (menuCache.homeData?.all_dishes) {
            const found = menuCache.homeData.all_dishes.find(d => String(d.id) === String(id));
            if (found) {
                menuCache.dishMap.set(id, { data: found, timestamp: Date.now() });
                return found;
            }
        }
        return null;
    },

    async getCategories() {
        const now = Date.now();
        if (menuCache.categories && (now - menuCache.categoriesTime < CACHE_TTL_MS)) {
            return menuCache.categories;
        }
        const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
        if (error) throw error;
        const categories = sortCategoriesByPriority(data || []);
        menuCache.categories = categories;
        menuCache.categoriesTime = now;
        return categories;
    },

    async getDishes(categoryId = null) {
        const now = Date.now();
        let dishes = [];
        if (menuCache.dishes && (now - menuCache.dishesTime < CACHE_TTL_MS)) {
            dishes = menuCache.dishes;
        } else {
            const { data, error } = await supabase.from('dishes').select('*');
            if (error) throw error;
            dishes = data || [];
            menuCache.dishes = dishes;
            menuCache.dishesTime = now;
            dishes.forEach(d => menuCache.dishMap.set(d.id, { data: d, timestamp: now }));
        }

        if (!categoryId) return dishes;

        if (categoryId === 'popular') {
            return dishes.filter(d => (d.is_popular || d.isPopular) && d.is_available !== false);
        }
        if (categoryId === 'special') {
            return dishes.filter(d => (d.is_special || d.isSpecial) && d.is_available !== false);
        }

        const targetId = String(categoryId).toLowerCase();
        const categories = menuCache.categories || await this.getCategories();
        const targetCat = categories.find(c => String(c.id).toLowerCase() === targetId || String(c.name).toLowerCase() === targetId);

        const catIdToMatch = targetCat ? String(targetCat.id).toLowerCase() : targetId;
        const catNameToMatch = targetCat ? String(targetCat.name).toLowerCase() : targetId;

        return dishes.filter(d => {
            const dCatId = String(d.category_id || d.categoryId || d.category || '').toLowerCase();
            const dCatName = String(d.category_name || '').toLowerCase();
            return dCatId === catIdToMatch || (dCatName && dCatName === catNameToMatch) || dCatId === targetId;
        });
    },

    async getDishById(id) {
        if (!id) return null;
        const cached = this.getDishByIdSync(id);
        if (cached && menuCache.dishMap.get(id)?.timestamp && (Date.now() - menuCache.dishMap.get(id).timestamp < CACHE_TTL_MS)) {
            return cached;
        }
        const { data, error } = await supabase.from('dishes').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        if (data) {
            menuCache.dishMap.set(id, { data, timestamp: Date.now() });
        }
        return data || cached;
    },

    // ----------------------------------------------------
    // ORDER CREATION
    // ----------------------------------------------------
    async createOrder(orderPayload) {
        const settings = await this.getRestaurantSettings();
        
        if (!orderPayload.items || orderPayload.items.length === 0) {
            return { success: false, error: 'Your cart is empty.' };
        }
        
        const allDishes = await this.getDishes();
        const dishMap = new Map(allDishes.map(d => [d.id, d]));
        
        let calculatedSubtotal = 0;
        const validatedOrderItems = [];
        
        for (const item of orderPayload.items) {
            if (!item.quantity || item.quantity <= 0 || item.quantity > 50) return { success: false, error: `Invalid quantity for item ${item.name || 'product'}.` };
            
            const rawDishId = item.dish_id || item.id;
            const dbDish = dishMap.get(rawDishId);
            
            if (dbDish && dbDish.is_available === false) return { success: false, error: `"${item.name || dbDish.name}" is currently unavailable.` };
            
            let unitPrice = Number(item.price);
            if (dbDish) {
                const basePrice = Number(dbDish.basePrice || dbDish.base_price || 0);
                if (basePrice > 0) unitPrice = basePrice;
            }
            
            const itemSubtotal = unitPrice * item.quantity;
            calculatedSubtotal += itemSubtotal;
            
            validatedOrderItems.push({
                dish_id: rawDishId,
                dish_name: item.name || dbDish?.name || 'Dish',
                unit_price: unitPrice, // Ensure this matches DB schema (usually unit_price)
                quantity: item.quantity,
                portion_label: item.portion || 'Regular',
                customizations: item.customizations || {},
                special_instruction: item.special_instruction || item.specialInstruction || '',
                subtotal: itemSubtotal
            });
        }
        
        const isSelfService = (orderPayload.service_mode || settings.service_mode) === 'SELF_SERVICE';
        const serviceMode = isSelfService ? 'SELF_SERVICE' : 'TABLE_SERVICE';
        const tableId = isSelfService ? null : (orderPayload.table_id || (orderPayload.table_number ? `tbl-${orderPayload.table_number}` : null));
        const tableNumber = isSelfService ? null : (Number(orderPayload.table_number) || 1);
        
        const { data: latestOrder } = await supabase.from('orders').select('order_number').order('created_at', { ascending: false }).limit(1).maybeSingle();
        const nextOrderNum = latestOrder ? (Number(latestOrder.order_number) + 1) : 1045;
        
        const newOrder = {
            order_number: String(nextOrderNum),
            restaurant_id: settings.restaurant_id || 'R001',
            service_mode: serviceMode,
            table_id: tableId,
            table_number: tableNumber,
            session_id: orderPayload.session_id || 'sess_guest',
            customer_name: orderPayload.customer_name || 'Guest',
            customer_phone: orderPayload.customer_phone || '',
            total_amount: calculatedSubtotal,
            status: 'CONFIRMED',
            payment_method: orderPayload.payment_method || 'razorpay',
            payment_status: orderPayload.payment_status || 'SUCCESS',
            razorpay_payment_id: orderPayload.razorpay_payment_id || null
        };
        
        const { data: insertedOrder, error: orderError } = await supabase.from('orders').insert([newOrder]).select().single();
        if (orderError) throw orderError;
        
        if (insertedOrder) {
            const itemsToInsert = validatedOrderItems.map(item => ({ ...item, order_id: insertedOrder.id }));
            await supabase.from('order_items').insert(itemsToInsert);
        }
        
        return { success: true, order: { ...insertedOrder, order_items: validatedOrderItems } };
    },

    async getOrders() {
        const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async updateOrderStatus(orderId, status) {
        const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
        if (error) throw error;
        return true;
    },

    async updatePaymentStatus(orderId, payment_status, razorpay_payment_id = null) {
        const payload = { payment_status };
        if (razorpay_payment_id) payload.razorpay_payment_id = razorpay_payment_id;
        const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
        if (error) throw error;
        return true;
    },

    // ----------------------------------------------------
    // TABLES MANAGEMENT
    // ----------------------------------------------------
    async getTables() {
        const { data, error } = await supabase.from('tables').select('*').order('table_number', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createTable(tableNumber) {
        const num = Number(tableNumber);
        const newTable = { table_number: num, status: 'active', qr_code: `QR-TBL-${num}`, revoked: false };
        const { data, error } = await supabase.from('tables').insert([newTable]).select().single();
        if (error) throw error;
        return data;
    },

    async toggleTableRevoked(tableId) {
        const { data: table } = await supabase.from('tables').select('revoked').eq('id', tableId).single();
        if (table) {
            await supabase.from('tables').update({ revoked: !table.revoked }).eq('id', tableId);
        }
        return true;
    },

    async deleteTable(tableId) {
        const { error } = await supabase.from('tables').delete().eq('id', tableId);
        if (error) throw error;
        return true;
    },

    // ----------------------------------------------------
    // DISH & CATEGORY & BANNER CRUD
    // ----------------------------------------------------
    async saveDish(dishPayload) {
        invalidateMenuCache();

        let oldImages = [];
        if (dishPayload.id) {
            try {
                const { data: oldDish } = await supabase.from('dishes').select('images').eq('id', dishPayload.id).maybeSingle();
                if (oldDish && Array.isArray(oldDish.images)) {
                    oldImages = oldDish.images;
                }
            } catch (e) {
                console.warn('Could not fetch existing dish for image comparison:', e);
            }
        }

        const rawImages = Array.isArray(dishPayload.images) ? dishPayload.images : [dishPayload.imageUrl].filter(Boolean);
        const processedImages = await Promise.all(rawImages.map(img => processAndUploadImage(img, 'dishes')));

        const base_price = Number(dishPayload.basePrice || dishPayload.base_price || 0);
        const supabasePayload = {
            id: dishPayload.id || dishPayload.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
            name: dishPayload.name,
            description: dishPayload.description || '',
            preparation: dishPayload.preparation || dishPayload.preparation_details || '',
            base_price: base_price,
            category_id: dishPayload.category_id || dishPayload.category || null,
            images: processedImages,
            portions: dishPayload.portions || [],
            ingredients: dishPayload.ingredients || [],
            ingredients_list: dishPayload.ingredients_list || [],
            allergens: dishPayload.allergens || [],
            taste_profile: dishPayload.tasteProfile || dishPayload.taste_profile || [],
            is_popular: Boolean(dishPayload.is_popular || dishPayload.isPopular),
            is_special: Boolean(dishPayload.is_special || dishPayload.isSpecial),
            is_available: dishPayload.is_available !== false,
            is_veg: dishPayload.is_veg !== undefined ? Boolean(dishPayload.is_veg) : dishPayload.isVeg !== undefined ? Boolean(dishPayload.isVeg) : true
        };
        const { data, error } = await supabase.from('dishes').upsert([supabasePayload]).select().single();
        if (error) throw error;

        // ONLY AFTER successful DB save, delete replaced images from storage
        const removedImages = oldImages.filter(oldUrl => oldUrl && !processedImages.includes(oldUrl));
        if (removedImages.length > 0) {
            await deleteStorageImages(removedImages);
        }

        return data;
    },

    async deleteDish(dishId) {
        invalidateMenuCache();

        let oldImages = [];
        try {
            const { data: existingDish } = await supabase.from('dishes').select('images').eq('id', dishId).maybeSingle();
            if (existingDish && Array.isArray(existingDish.images)) {
                oldImages = existingDish.images;
            }
        } catch (e) {
            console.warn('Could not fetch dish images prior to delete:', e);
        }

        const { error } = await supabase.from('dishes').delete().eq('id', dishId);
        if (error) throw error;

        // ONLY AFTER successful DB deletion, delete related storage images
        if (oldImages.length > 0) {
            await deleteStorageImages(oldImages);
        }

        return true;
    },

    async toggleDishAvailability(dishId, isAvailable) {
        invalidateMenuCache();
        const { data, error } = await supabase
            .from('dishes')
            .update({ is_available: isAvailable })
            .eq('id', dishId)
            .select()
            .single();
        if (error) {
            console.error('Error updating stock status in Supabase:', error);
            throw error;
        }
        return data;
    },

    async saveCategory(categoryPayload) {
        invalidateMenuCache();

        let oldCategory = null;
        let oldImage = null;
        if (categoryPayload.id) {
            try {
                const { data: oldCat } = await supabase.from('categories').select('*').eq('id', categoryPayload.id).maybeSingle();
                oldCategory = oldCat;
                oldImage = oldCat?.image_url || null;
            } catch (e) {
                console.warn('Could not fetch existing category for comparison:', e);
            }
        }

        const rawImg = categoryPayload.image_url || categoryPayload.image || '';
        const processedImage = await processAndUploadImage(rawImg, 'categories');

        const displayOrder = categoryPayload.display_order ?? oldCategory?.display_order ?? getCategoryPriority(categoryPayload.name);

        const supabasePayload = {
            id: categoryPayload.id || categoryPayload.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
            name: categoryPayload.name,
            description: categoryPayload.description || '',
            image_url: processedImage,
            display_order: displayOrder
        };
        const { data, error } = await supabase.from('categories').upsert([supabasePayload]).select().single();
        if (error) throw error;

        // ONLY AFTER successful DB save, delete replaced image from storage
        if (oldImage && oldImage !== processedImage) {
            await deleteStorageImages([oldImage]);
        }

        return data;
    },

    async deleteCategory(categoryId) {
        invalidateMenuCache();

        let oldImage = null;
        try {
            const { data: oldCat } = await supabase.from('categories').select('image_url').eq('id', categoryId).maybeSingle();
            oldImage = oldCat?.image_url || null;
        } catch (e) {
            console.warn('Could not fetch category image prior to delete:', e);
        }

        const { error } = await supabase.from('categories').delete().eq('id', categoryId);
        if (error) throw error;

        // ONLY AFTER successful DB deletion, delete related storage image
        if (oldImage) {
            await deleteStorageImages([oldImage]);
        }

        return true;
    },

    async saveBanner(bannerPayload) {
        invalidateMenuCache();

        let oldImage = null;
        if (bannerPayload.id) {
            try {
                const { data: oldBanner } = await supabase.from('banners').select('image_url').eq('id', bannerPayload.id).maybeSingle();
                oldImage = oldBanner?.image_url || null;
            } catch (e) {
                console.warn('Could not fetch existing banner for image comparison:', e);
            }
        }

        const rawImg = bannerPayload.image_url || bannerPayload.image || '';
        const processedImage = await processAndUploadImage(rawImg, 'banners');

        const supabasePayload = {
            id: bannerPayload.id || 'banner-' + Date.now(),
            title: bannerPayload.title,
            image_url: processedImage,
            dish_id: bannerPayload.dish_id || null
        };
        const { data, error } = await supabase.from('banners').upsert([supabasePayload]).select().single();
        if (error) throw error;

        // ONLY AFTER successful DB save, delete replaced image from storage
        if (oldImage && oldImage !== processedImage) {
            await deleteStorageImages([oldImage]);
        }

        return data;
    },

    async deleteBanner(bannerId) {
        invalidateMenuCache();

        let oldImage = null;
        try {
            const { data: oldBanner } = await supabase.from('banners').select('image_url').eq('id', bannerId).maybeSingle();
            oldImage = oldBanner?.image_url || null;
        } catch (e) {
            console.warn('Could not fetch banner image prior to delete:', e);
        }

        const { error } = await supabase.from('banners').delete().eq('id', bannerId);
        if (error) throw error;

        // ONLY AFTER successful DB deletion, delete related storage image
        if (oldImage) {
            await deleteStorageImages([oldImage]);
        }

        return true;
    }
};

// Helper to convert dataURL to Blob
const dataURLtoBlob = (dataurl) => {
    if (!dataurl || typeof dataurl !== 'string' || !dataurl.startsWith('data:')) return null;
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

// Helper to convert & upload an image to WebP format in Supabase Storage
export async function processAndUploadImage(imageInput, folder = 'dishes') {
    if (!imageInput) return '';

    // If it's a data URL or blob URL, convert to WebP
    let webpDataUrl = imageInput;
    if (typeof imageInput === 'string' && (imageInput.startsWith('data:image') || imageInput.startsWith('blob:'))) {
        webpDataUrl = await convertToWebP(imageInput, 0.85);
    }

    if (isSupabaseConfigured && typeof webpDataUrl === 'string' && webpDataUrl.startsWith('data:image')) {
        try {
            const blob = dataURLtoBlob(webpDataUrl);
            if (blob) {
                const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
                const { data, error } = await supabase.storage
                    .from('menu-images')
                    .upload(fileName, blob, { contentType: 'image/webp', upsert: true });

                if (error) {
                    if (error.statusCode === '404' || error.error === 'Bucket not found' || error.code === 'NoSuchBucket') {
                        console.warn('[Supabase Storage] Bucket "menu-images" not found. Using inline WebP image fallback. To use cloud image URLs, create a public bucket named "menu-images" in your Supabase Dashboard.');
                    } else {
                        console.warn('Supabase storage upload error:', error.message || error);
                    }
                    return webpDataUrl;
                }

                if (data) {
                    const { data: publicUrlData } = supabase.storage
                        .from('menu-images')
                        .getPublicUrl(fileName);
                    return publicUrlData.publicUrl;
                }
            }
        } catch (err) {
            console.warn('Supabase storage upload exception, falling back to data URL:', err);
        }
    }

    return webpDataUrl;
}

// Helper to delete images from Supabase storage AFTER DB operations succeed
export async function deleteStorageImages(imageUrls) {
    if (!isSupabaseConfigured) return;
    const urls = (Array.isArray(imageUrls) ? imageUrls : [imageUrls]).filter(Boolean);
    const pathsToDelete = [];

    for (const url of urls) {
        if (typeof url === 'string' && url.includes('/storage/v1/object/public/menu-images/')) {
            const path = url.split('/storage/v1/object/public/menu-images/')[1];
            if (path) pathsToDelete.push(decodeURIComponent(path));
        }
    }

    if (pathsToDelete.length > 0) {
        try {
            const { error } = await supabase.storage.from('menu-images').remove(pathsToDelete);
            if (error) {
                console.warn('Failed to delete storage images:', error);
            }
        } catch (err) {
            console.warn('Storage delete exception:', err);
        }
    }
}

