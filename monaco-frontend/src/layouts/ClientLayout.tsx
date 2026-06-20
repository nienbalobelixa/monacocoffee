import { Outlet } from 'react-router-dom'
import ClientNavbar from '../components/client/ClientNavbar'
import ClientFooter from '../components/client/ClientFooter'
import CartDrawer from '../components/client/CartDrawer'
import { useCartStore } from '../store/cart.store'

export default function ClientLayout() {
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)

  return (
    <div className="min-h-screen flex flex-col">
      <ClientNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <ClientFooter />
      <CartDrawer />
      {isOpen && <div className="overlay" onClick={closeCart} />}
    </div>
  )
}
