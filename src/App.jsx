import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from 'react-use-cart';

import Home from './pages/Home';
import Cart from './pages/Cart';
import FoodDetails from './pages/FoodDetails';
import CategoryDetails from './pages/CategoryDetails';

import KitchenView from './pages/kitchen/KitchenView';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDishes from './pages/admin/AdminDishes';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBanners from './pages/admin/AdminBanners';
import AdminTables from './pages/admin/AdminTables';
import AdminOrders from './pages/admin/AdminOrders';

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/FoodDetails/:foodId" element={<FoodDetails />} />
          <Route path="/CategoryDetails/:categoryId" element={<CategoryDetails />} />
          <Route path="/cart" element={<Cart />} />

          {/* Kitchen / Cooker / Waiter Real-time Views */}
          <Route path="/kitchen" element={<KitchenView />} />
          <Route path="/waiter" element={<KitchenView />} />

          {/* Admin Management Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dishes" element={<AdminDishes />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="tables" element={<AdminTables />} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
