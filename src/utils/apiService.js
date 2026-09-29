import { supabase } from './supabase';
import { APP_CONFIG } from '../config';

const envServiceMode = import.meta.env.VITE_SERVICE_MODE || 'TABLE_SERVICE';

// Admin accounts are now fetched directly from Supabase 'admins' table

export const apiService = {
    // ----------------------------------------------------
    // RESTAURANT SETTINGS & SERVICE MODE
    // ----------------------------------------------------
    async getRestaurantSettings() {
        let localFallback = null;
        try {
            const stored = localStorage.getItem('innbite_custom_settings');
            if (stored) localFallback = JSON.parse(stored);
        } catch (e) {}

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
                logo_url: '/logo/innbite-logo.png',
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
                logo_url: '/logo/innbite-logo.png',
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
            logo_url: data.logo_url || localFallback?.logo_url || '/logo/innbite-logo.png'
        };
    },

    async updateRestaurantSettings(newSettings) {
        const payload = {
            restaurant_id: 'R001',
            ...newSettings
        };

        // Store immediately in localStorage so state updates instantly across tabs & renders
        try {
            localStorage.setItem('innbite_custom_settings', JSON.stringify(payload));
        } catch (e) {}

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
    // READ MENU DATA
    // ----------------------------------------------------
    async getHomePageData() {
        const [bannersRes, dishesRes, categoriesRes, settings] = await Promise.all([
            supabase.from('banners').select('*'),
            supabase.from('dishes').select('*').eq('is_available', true),
            supabase.from('categories').select('*').order('display_order', { ascending: true }),
            this.getRestaurantSettings()
        ]);
        
        const banners = bannersRes.data || [];
        const allDishes = dishesRes.data || [];
        const categories = categoriesRes.data || [];
        
        return {
            banners,
            popular_dishes: allDishes.filter(d => (d.is_popular || d.isPopular) && d.is_available !== false),
            todays_specials: allDishes.filter(d => (d.is_special || d.isSpecial) && d.is_available !== false),
            categories,
            settings
        };
    },

    async getCategories() {
        const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getDishes(categoryId = null) {
        let query = supabase.from('dishes').select('*');
        if (categoryId) query = query.eq('category_id', categoryId);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getDishById(id) {
        const { data, error } = await supabase.from('dishes').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data;
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
        const base_price = Number(dishPayload.basePrice || dishPayload.base_price || 0);
        const supabasePayload = {
            id: dishPayload.id || dishPayload.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
            name: dishPayload.name,
            description: dishPayload.description || '',
            preparation: dishPayload.preparation || dishPayload.preparation_details || '',
            base_price: base_price,
            category_id: dishPayload.category_id || dishPayload.category || null,
            images: Array.isArray(dishPayload.images) ? dishPayload.images : [dishPayload.imageUrl].filter(Boolean),
            portions: dishPayload.portions || [],
            ingredients: dishPayload.ingredients || [],
            ingredients_list: dishPayload.ingredients_list || [],
            allergens: dishPayload.allergens || [],
            taste_profile: dishPayload.tasteProfile || dishPayload.taste_profile || [],
            is_popular: Boolean(dishPayload.is_popular || dishPayload.isPopular),
            is_special: Boolean(dishPayload.is_special || dishPayload.isSpecial),
            is_available: dishPayload.is_available !== false
        };
        const { data, error } = await supabase.from('dishes').upsert([supabasePayload]).select().single();
        if (error) throw error;
        return data;
    },

    async deleteDish(dishId) {
        const { error } = await supabase.from('dishes').delete().eq('id', dishId);
        if (error) throw error;
        return true;
    },

    async saveCategory(categoryPayload) {
        const supabasePayload = {
            id: categoryPayload.id || categoryPayload.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
            name: categoryPayload.name,
            description: categoryPayload.description || '',
            image_url: categoryPayload.image_url || categoryPayload.image || ''
        };
        const { data, error } = await supabase.from('categories').upsert([supabasePayload]).select().single();
        if (error) throw error;
        return data;
    },

    async deleteCategory(categoryId) {
        const { error } = await supabase.from('categories').delete().eq('id', categoryId);
        if (error) throw error;
        return true;
    },

    async saveBanner(bannerPayload) {
        const supabasePayload = {
            id: bannerPayload.id || 'banner-' + Date.now(),
            title: bannerPayload.title,
            image_url: bannerPayload.image_url || bannerPayload.image || '',
            dish_id: bannerPayload.dish_id || null
        };
        const { data, error } = await supabase.from('banners').upsert([supabasePayload]).select().single();
        if (error) throw error;
        return data;
    },

    async deleteBanner(bannerId) {
        const { error } = await supabase.from('banners').delete().eq('id', bannerId);
        if (error) throw error;
        return true;
    }
};
