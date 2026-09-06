import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ShoppingBag, Clock3 } from "lucide-react";
import { getMenuItems } from "../api/client";
import { useOrderSession } from "../context/OrderSessionContext";
import "./Menu.css";

export default function Menu() {
  const navigate = useNavigate();
  const { session, registerMenuItems, addToCart, cartCount, cartTotal } = useOrderSession();

  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("food"); // "food" | "drink"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session.restaurantId) {
      navigate("/start");
      return;
    }

    getMenuItems(session.restaurantId)
      .then((data) => {
        setItems(data);
        registerMenuItems(data);
      })
      .catch(() => setError("Could not load the menu. Please try again."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.restaurantId]);

  const filteredItems = useMemo(
    () => items.filter((item) => item.type === activeTab),
    [items, activeTab]
  );

  if (loading) {
    return (
      <div className="page menu">
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page menu">
        <p className="input-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="page menu">
      <div className="menu-tabs">
        <button
          className={activeTab === "food" ? "menu-tab active" : "menu-tab"}
          onClick={() => setActiveTab("food")}
        >
          Food
        </button>
        <button
          className={activeTab === "drink" ? "menu-tab active" : "menu-tab"}
          onClick={() => setActiveTab("drink")}
        >
          Drinks
        </button>
      </div>

      <div className="menu-list">
        {filteredItems.map((item) => {
          const id = item.id || item._id;
          return (
            <div className="menu-card" key={id}>
              {item.imageUrl && <img className="menu-card-image" src={item.imageUrl} alt={item.name} />}
              <div className="menu-card-info">
                <h3>{item.name}</h3>
                <div className="menu-card-meta">
                  <span className="menu-price">{"\u20A6"}{item.price.toLocaleString()}</span>
                  <span className="menu-prep-time">
                    <Clock3 size={14} /> {item.avgPrepTimeMinutes} mins
                  </span>
                </div>
              </div>
              <button className="add-button" onClick={() => addToCart(id)}>
                <Plus size={18} /> Add
              </button>
            </div>
          );
        })}
        {filteredItems.length === 0 && <p>No items in this category yet.</p>}
      </div>

      {cartCount > 0 && (
        <button className="floating-cart" onClick={() => navigate("/cart")}>
          <ShoppingBag size={20} />
          <span>{cartCount} item{cartCount > 1 ? "s" : ""}</span>
          <span>{"\u20A6"}{cartTotal.toLocaleString()}</span>
        </button>
      )}
    </div>
  );
}