import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, PartyPopper, QrCode, Share2, Store } from "lucide-react";
import { getOrder } from "../api/client";
import "./Receipt.css";

export default function Receipt() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);

  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setError("Could not load receipt."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const shareReceipt = async () => {
    const text = `Receipt for Table ${order.tableNumber} at ${order.restaurantName}: ${"\u20A6"}${order.amount.toLocaleString()} paid via Chowly.`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Chowly Receipt", text });
      } catch {
        // user dismissed the share sheet
      }
    } else {
      setShared(true);
      window.setTimeout(() => setShared(false), 2200);
    }
  };

  if (loading) {
    return (
      <div className="page receipt">
        <p>Loading receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page receipt">
        <p className="input-error">{error || "Order not found."}</p>
      </div>
    );
  }

  const paidTime = order.paidAt
    ? new Date(order.paidAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--";

  return (
    <div className="page receipt">
      <section className="receipt-hero">
        <div className="hero-icon-wrap">
          <CheckCircle2 size={54} strokeWidth={2.5} />
          <span className="hero-badge">
            <PartyPopper size={16} />
          </span>
        </div>
        <p className="hero-eyebrow">Receipt Confirmed</p>
        <h1>Payment Confirmed — Table {order.tableNumber}</h1>
        <p className="hero-subtitle">Thank you for dining with us! We hope to see you again soon.</p>
      </section>

      <section className="receipt-card">
        <div className="receipt-strip" />
        <div className="receipt-body">
          <div className="receipt-top">
            <div>
              <h2>{order.restaurantName}</h2>
              <p>Table {order.tableNumber} (Dine-In) • Order #{String(order.id).slice(-6).toUpperCase()}</p>
            </div>
            <div className="store-icon">
              <Store size={22} />
            </div>
          </div>

          <div className="meta-grid">
            <div>
              <p className="meta-label">Paid at</p>
              <p className="meta-value">{paidTime}</p>
            </div>
            <div>
              <p className="meta-label">Payment Method</p>
              <p className="meta-value" style={{ textTransform: "capitalize" }}>{order.paymentMethod}</p>
            </div>
          </div>

          <div className="items-block">
            <p className="items-label">Itemized Details</p>
            {order.items.map((item) => (
              <div className="receipt-item" key={item.id}>
                <div className="receipt-item-left">
                  <span className="qty-badge">{item.quantity}x</span>
                  <p className="item-name">{item.name}</p>
                </div>
                <span className="item-price">{"\u20A6"}{(item.unitPrice * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="total-block">
            <div className="total-row">
              <div>
                <p className="total-label">Total Paid</p>
                <p className="total-sub">Simulated payment — no real charge was made</p>
              </div>
              <span className="total-amount">{"\u20A6"}{order.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="receipt-footer">
          <span className="verified-label">
            <QrCode size={17} /> VERIFIED RECEIPT • Chowly Pay
          </span>
          <span className="approved-label">APPROVED</span>
        </div>
      </section>

      <div className="receipt-actions">
        <button className="share-button" onClick={shareReceipt}>
          <Share2 size={19} /> {shared ? "Copied to share!" : "Download / Share Receipt"}
        </button>
        <button className="done-button" onClick={() => navigate(`/orders/${orderId}/review`)}>
          Done <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}