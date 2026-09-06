import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Banknote, Check, CreditCard, Info, LockKeyhole, ReceiptText, ShieldCheck } from "lucide-react";
import { getOrder, submitPayment } from "../api/client";
import "./Payment.css";

const paymentOptions = [
  { id: "card", title: "Debit / Credit Card", description: "Visa, Mastercard, Verve & Apple Pay", icon: CreditCard, recommended: true },
  { id: "transfer", title: "Direct Bank Transfer", description: "Virtual account for your table", icon: Banknote },
  { id: "ussd", title: "USSD Quick Code", description: "Dial your bank's USSD code", icon: LockKeyhole },
];

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setError("Could not load order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePay = async () => {
    setPaying(true);
    setError("");
    try {
      await submitPayment(orderId, paymentMethod);
      navigate(`/orders/${orderId}/receipt`);
    } catch (err) {
      setError(err.message || "Payment simulation failed. Please try again.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="page payment">
        <p>Loading bill...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="page payment">
        <p className="input-error">{error}</p>
      </div>
    );
  }

  const total = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="page payment">
      <div className="context-row">
        <div className="mode-pill">
          <span className="pulse-dot" /> Table {order.tableNumber}
        </div>
        <div className="session-label">
          <ShieldCheck size={16} /> Order #{String(order.id).slice(-6).toUpperCase()}
        </div>
      </div>

      <div className="page-heading">
        <h1>Table Bill &amp; Payment</h1>
        <p>{order.restaurantName} • Table {order.tableNumber}</p>
      </div>

      <section className="order-card">
        <div className="section-heading">
          <div className="section-title">
            <ReceiptText size={20} /> <span>Order Summary</span>
          </div>
          <span className="items-count">{order.items.length} items</span>
        </div>
        <div className="items-list">
          {order.items.map((item) => (
            <div className="order-item" key={item.id}>
              <div className="item-copy">
                <div className="item-name-row">
                  <span className="quantity-tag">{item.quantity}x</span>
                  <span className="item-name">{item.name}</span>
                </div>
              </div>
              <strong className="item-price">{"\u20A6"}{(item.unitPrice * item.quantity).toLocaleString()}</strong>
            </div>
          ))}
        </div>
        <div className="totals-box">
          <div className="grand-total">
            <div>
              <strong>Grand Total</strong>
              <span>Pay before you leave</span>
            </div>
            <strong>{"\u20A6"}{total.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      <section className="payment-section">
        <div className="payment-heading">
          <h2>Payment Method</h2>
        </div>
        <div className="payment-options" role="radiogroup" aria-label="Select payment method">
          {paymentOptions.map((option) => {
            const isSelected = paymentMethod === option.id;
            const Icon = option.icon;
            return (
              <label className={`payment-option ${isSelected ? "selected" : ""}`} key={option.id}>
                <input
                  type="radio"
                  name="payment_method"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setPaymentMethod(option.id)}
                />
                <div className={`payment-icon ${isSelected ? "selected-icon" : ""}`}>
                  <Icon size={22} />
                </div>
                <div className="payment-copy">
                  <div className="payment-title-row">
                    <strong>{option.title}</strong>
                    {option.recommended && <span className="recommended">Recommended</span>}
                  </div>
                  <span>{option.description}</span>
                </div>
                <div className={`check-circle ${isSelected ? "selected-check" : ""}`}>
                  {isSelected && <Check size={16} strokeWidth={3} />}
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {error && <p className="input-error">{error}</p>}

      <div className="action-wrap">
        <div className="simulation-note">
          <Info size={16} /> This is a simulation — no real charge will be made.
        </div>
        <button className="pay-button" onClick={handlePay} disabled={paying}>
          <LockKeyhole size={20} /> {paying ? "Processing..." : `Pay (Pretend Payment) • ${"\u20A6"}${total.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
