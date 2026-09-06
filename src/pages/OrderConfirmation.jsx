import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock3, Radar, ConciergeBell, CirclePlus } from "lucide-react";
import { getOrder } from "../api/client";
import "./OrderConfirmation.css";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setError("Could not load your order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  if (loading) {
    return (
      <div className="page confirmation">
        <p>Loading your order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page confirmation">
        <p className="input-error">{error || "Order not found."}</p>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="page confirmation">
      <section className="confirmation-hero">
        <div className="confirmation-icon">
          <CheckCircle2 size={31} strokeWidth={2.1} />
        </div>
        <span className="confirmation-tag">Sent to kitchen</span>
        <h1>Order #{String(order.id).slice(-6).toUpperCase()} submitted!</h1>
        <p>Table {order.tableNumber} • Your ticket is with the kitchen now.</p>
      </section>

      <section className="confirmation-card">
        <div className="wait-time-row">
          <div className="wait-time-icon">
            <Clock3 size={26} strokeWidth={2} />
          </div>
          <div>
            <span className="label">Estimated wait time</span>
            <strong>~{order.estimatedWaitMinutes} minutes</strong>
          </div>
          <span className="status-pill">On Schedule</span>
        </div>
      </section>

      <section className="confirmation-card">
        <div className="card-header">
          <h2>Items in this ticket</h2>
          <span className="count-pill">
            {order.items.length} dish{order.items.length !== 1 ? "es" : ""}
          </span>
        </div>
        <div className="ticket-items">
          {order.items.map((item) => (
            <div className="ticket-item" key={item.id}>
              <div className="ticket-item-info">
                <div className="ticket-item-name">
                  <span>{item.name}</span>
                  <strong>{"\u20A6"}{(item.unitPrice * item.quantity).toLocaleString()}</strong>
                </div>
                <span className="ticket-item-qty">{item.quantity}x</span>
              </div>
            </div>
          ))}
        </div>
        <div className="ticket-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{"\u20A6"}{subtotal.toLocaleString()}</span>
          </div>
          <div className="summary-total">
            <div>
              <span className="label">Total due</span>
              <span className="sub-label">Pay before you leave</span>
            </div>
            <strong>{"\u20A6"}{subtotal.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      <div className="confirmation-actions">
        <button className="primary-button" onClick={() => navigate(`/orders/${orderId}/status`)}>
          <Radar size={20} /> Track Order Status
        </button>
        <div className="secondary-actions">
          <button onClick={() => navigate("/menu")}>
            <CirclePlus size={19} /> Add More Items
          </button>
          <button onClick={() => showNotice("A waiter has been notified.")}>
            <ConciergeBell size={19} /> Call Waiter
          </button>
        </div>
      </div>

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}
