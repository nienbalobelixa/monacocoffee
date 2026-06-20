import { Routes, Route, Navigate } from 'react-router-dom'
import ClientLayout from './layouts/ClientLayout'
import AdminLayout from './layouts/AdminLayout'
import PosLayout from './layouts/PosLayout'
import AuthLayout from './layouts/AuthLayout'
import ProtectedRoute from './routes/ProtectedRoute'

// Client pages
import HomePage from './pages/client/HomePage'
import MenuPage from './pages/client/MenuPage'
import ProductDetailPage from './pages/client/ProductDetailPage'
import CartPage from './pages/client/CartPage'
import CheckoutPage from './pages/client/CheckoutPage'
import OrderTrackingPage from './pages/client/OrderTrackingPage'
import OrdersPage from './pages/client/OrdersPage'
import ReservationsPage from './pages/client/ReservationsPage'
import ProfilePage from './pages/client/ProfilePage'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// POS pages
import PosPage from './pages/pos/PosPage'
import PosOrdersPage from './pages/pos/PosOrdersPage'

// Admin pages
import DashboardPage from './pages/admin/DashboardPage'
import ProductsAdminPage from './pages/admin/ProductsAdminPage'
import CategoriesAdminPage from './pages/admin/CategoriesAdminPage'
import OrdersAdminPage from './pages/admin/OrdersAdminPage'
import UsersAdminPage from './pages/admin/UsersAdminPage'
import EmployeesAdminPage from './pages/admin/EmployeesAdminPage'
import InventoryAdminPage from './pages/admin/InventoryAdminPage'
import PromotionsAdminPage from './pages/admin/PromotionsAdminPage'
import TablesAdminPage from './pages/admin/TablesAdminPage'
import ReservationsAdminPage from './pages/admin/ReservationsAdminPage'
import ReportsAdminPage from './pages/admin/ReportsAdminPage'

export default function App() {
  return (
    <Routes>
      {/* Client routes */}
      <Route element={<ClientLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route element={<ProtectedRoute roles={['CUSTOMER', 'ADMIN', 'MANAGER', 'STAFF']} />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderTrackingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
      </Route>

      {/* POS routes */}
      <Route element={<ProtectedRoute roles={['ADMIN', 'MANAGER', 'STAFF']} />}>
        <Route element={<PosLayout />}>
          <Route path="/pos" element={<PosPage />} />
          <Route path="/pos/orders" element={<PosOrdersPage />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute roles={['ADMIN', 'MANAGER']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/products" element={<ProductsAdminPage />} />
          <Route path="/admin/categories" element={<CategoriesAdminPage />} />
          <Route path="/admin/orders" element={<OrdersAdminPage />} />
          <Route path="/admin/users" element={<UsersAdminPage />} />
          <Route path="/admin/employees" element={<EmployeesAdminPage />} />
          <Route path="/admin/inventory" element={<InventoryAdminPage />} />
          <Route path="/admin/promotions" element={<PromotionsAdminPage />} />
          <Route path="/admin/tables" element={<TablesAdminPage />} />
          <Route path="/admin/reservations" element={<ReservationsAdminPage />} />
          <Route path="/admin/reports" element={<ReportsAdminPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
