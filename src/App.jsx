import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from 'react-use-cart';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Cart from './pages/Cart';
import FoodDetails from './pages/FoodDetails';
import CategoryDetails from './pages/CategoryDetails';
import QRHandler from './pages/QRHandler';

import KitchenView from './pages/kitchen/KitchenView';
import WaiterLogin from './pages/waiter/WaiterLogin';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDishes from './pages/admin/AdminDishes';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBanners from './pages/admin/AdminBanners';
import AdminTables from './pages/admin/AdminTables';
import AdminWaiters from './pages/admin/AdminWaiters';
import AdminOrders from './pages/admin/AdminOrders';
import AdminLogin from './pages/admin/AdminLogin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Customer QR Scan & Menu Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/table/:tableId" element={<QRHandler />} />
            <Route path="/qr/common" element={<QRHandler />} />
            <Route path="/qr/:qrCode" element={<QRHandler />} />
            <Route path="/FoodDetails/:foodId" element={<FoodDetails />} />
            <Route path="/CategoryDetails/:categoryId" element={<CategoryDetails />} />
            <Route path="/cart" element={<Cart />} />

            {/* Waiter Application Routes (Authenticated) */}
            <Route path="/waiter/login" element={<WaiterLogin />} />
            <Route
              path="/waiter"
              element={
                <ProtectedRoute requiredRole="WAITER">
                  <KitchenView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute requiredRole="WAITER">
                  <KitchenView />
                </ProtectedRoute>
              }
            />

            {/* Admin Portal Authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Management Portal (Protected) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="dishes" element={<AdminDishes />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="tables" element={<AdminTables />} />
              <Route path="waiters" element={<AdminWaiters />} />
              <Route path="orders" element={<AdminOrders />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
