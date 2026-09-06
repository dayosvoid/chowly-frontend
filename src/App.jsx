import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider } from "./context/RoleContext";
import { OrderSessionProvider } from "./context/OrderSessionContext";
import Header from "./components/Header";

import StartSession from "./pages/StartSession";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderStatus from "./pages/OrderStatus";
import Payment from "./pages/Payment";
import Receipt from "./pages/Receipt";
import ComplaintRating from "./pages/ComplaintRating";
import WaiterDashboard from "./pages/WaiterDashboard";
import OrderDetail from "./pages/OrderDetail";

export default function App() {
  return (
    <RoleProvider>
      <OrderSessionProvider>
        <BrowserRouter>
          <Header />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Navigate to="/start" replace />} />
              <Route path="/start" element={<StartSession />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders/:orderId/confirmation" element={<OrderConfirmation />} />
              <Route path="/orders/:orderId/status" element={<OrderStatus />} />
              <Route path="/orders/:orderId/payment" element={<Payment />} />
              <Route path="/orders/:orderId/receipt" element={<Receipt />} />
              <Route path="/orders/:orderId/review" element={<ComplaintRating />} />
              <Route path="/waiter" element={<WaiterDashboard />} />
              <Route path="/waiter/orders/:orderId" element={<OrderDetail />} />
            </Routes>
          </div>
        </BrowserRouter>
      </OrderSessionProvider>
    </RoleProvider>
  );
}