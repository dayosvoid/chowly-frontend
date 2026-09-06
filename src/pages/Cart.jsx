import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, Edit3, ShieldCheck, UtensilsCrossed, X } from "lucide-react";
import { createOrder } from "../api/client";
import { useOrderSession } from "../context/OrderSessionContext";
import "./Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const { session, cartItems, cartTotal, updateCartQuantity, clearCart } = useOrderSession();

  const [kitchenNote, setKitchenNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (cartItems.length === 0) return;

    setSubmitting(true);
    setError("");

    try {
      const order = await createOrder({
        restaurantId: session.restaurantId,
        tableNumber: session.tableNumber,
        customerName: session.customerName,
        kitchenNote: kitchenNote.trim() || undefined,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });

      clearCart();
      navigate(`/orders/${order.id}/confirmation`);
    } catch (err) {
      setError(err.message || "Could not submit your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="page cart">
        <p>Your cart is empty.</p>
        <button className="submit-button" onClick={() => navigate("/menu")}>
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="page cart">
      <section className="order-banner">
        <div>
          <h1>Your Order</h1>
          <p>Table {session.tableNumber} • {session.restaurantName}</p>
        </div>
        <div className="status-pill">
          <span /> ORDERING
        </div>
      </section>

      <section className="items-list">
        {cartItems.map((item) => (
          <article className="item-card" key={item.menuItemId}>
            <div className="item-details">
              <div className="item-heading">
                <h2>{item.menuItem?.name}</h2>
                <button
                  className="remove-button"
                  aria-label={`Remove ${item.menuItem?.name}`}
                  onClick={() => updateCartQuantity(item.menuItemId, 0)}
                >
                  <X size={19} />
                </button>
              </div>
              <span className="unit-price">
                {"\u20A6"}{item.menuItem?.price.toLocaleString()} each
              </span>
              <div className="item-controls">
                <div className="stepper">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => updateCartQuantity(item.menuItemId, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => updateCartQuantity(item.menuItemId, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <strong>
                  {"\u20A6"}{(item.menuItem?.price * item.quantity).toLocaleString()}
                </strong>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="card notes-card">
        <div className="section-label">
          <div>
            <Edit3 size={20} />
            <h2>Kitchen Note</h2>
          </div>
          <span>Optional</span>
        </div>
        <p>Allergies, spice level, or anything the kitchen should know</p>
        <textarea
          value={kitchenNote}
          onChange={(e) => setKitchenNote(e.target.value)}
          placeholder="e.g., no pepper please"
          rows={2}
        />
      </section>

      <section className="card summary-card">
        <h2>Order Summary</h2>
        <div className="total-row">
          <div>
            <h3>Total Due</h3>
            <span>Pay at table before you leave</span>
          </div>
          <strong>{"\u20A6"}{cartTotal.toLocaleString()}</strong>
        </div>
      </section>

      <div className="reassurance">
        <div>
          <ShieldCheck size={19} />
        </div>
        <p>Freshly made to order once submitted.</p>
      </div>

      {error && <p className="input-error">{error}</p>}

      <button className="submit-button" disabled={submitting} onClick={handleSubmit}>
        <span>
          <UtensilsCrossed size={23} /> {submitting ? "Submitting..." : "Submit Order"}
        </span>
        <strong>
          {"\u20A6"}{cartTotal.toLocaleString()} <ArrowRight size={18} />
        </strong>
      </button>
    </div>
  );
}
