import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bell, Check, Clock3, HandHelping, ShieldCheck, Table2, Wifi } from "lucide-react";
import { getRestaurants } from "../api/client";
import { useOrderSession } from "../context/OrderSessionContext";
import { useRole } from "../context/RoleContext"; // 1. Import useRole
import "./StartSession.css";

const restaurantImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB32XUTRZo3s_zAuqIKBaGe5sTDIiIPXz6fXNXDEnMBuu_4x7BrDKbTBKsQbV_rSNiz96Fznk3gFXYwnp05qkSycuKUxVj6kYFYEyIrapHfVR7sMR-oYzrduZfWisUt0rojwQxrwSlrrJOPQpye4svY_-q6ueMYeVYcdzJClswJY8IamRwrtfQn53vd7aT-DJ8TUfuWfWlGzcsYtQUdc9TH0k4N9xW7JU78Fr5LDWglyfhHXhZGclo2pQ";

export default function StartSession() {
  const navigate = useNavigate();
  const { startSession } = useOrderSession();
  const { updateUserName } = useRole(); // 2. Extract updateUserName from context

  const [restaurant, setRestaurant] = useState(null);
  const [tableNumber, setTableNumber] = useState("07");
  const [customerName, setCustomerName] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    setSessionTime(
      String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0")
    );

    getRestaurants()
      .then((restaurants) => {
        if (restaurants.length > 0) setRestaurant(restaurants[0]);
      })
      .catch(() => setError("Could not load restaurant details."))
      .finally(() => setLoading(false));
  }, []);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const handleStartOrdering = () => {
    if (!customerName.trim()) {
      setError("Please enter your name to start your order.");
      return;
    }
    if (!tableNumber.trim()) {
      setError("Please enter your table number.");
      return;
    }
    if (!restaurant) {
      setError("Restaurant details are still loading - try again in a moment.");
      return;
    }

    // 3. Save the name into context (which updates the Header immediately and persists via localStorage)
    updateUserName(customerName.trim());

    startSession({
      restaurantId: restaurant.id || restaurant._id,
      restaurantName: restaurant.name,
      tableNumber: tableNumber.trim(),
      customerName: customerName.trim(),
    });
    navigate("/menu");
  };

  if (loading) {
    return (
      <div className="page start-session">
        <p>Loading restaurant details...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="main-content">
        <div className="content-wrap">
          <div className="session-pill">
            <span className="session-label">
              <span className="status-dot pulse" /> Customer Session Active
            </span>
            <span className="table-chip">
              <Table2 size={16} /> TABLE {tableNumber || "--"}
            </span>
          </div>

          <section className="welcome-card">
            <div className="welcome-heading">
              <div>
                <span className="eyebrow">DINE-IN ORDER</span>
                <h1>{restaurant ? restaurant.name : "Restaurant unavailable"}</h1>
                <p>{restaurant && restaurant.address ? restaurant.address : "Address unavailable"}</p>
              </div>
              <div className="table-badge">
                <span>TABLE</span>
                <strong>{tableNumber || "--"}</strong>
              </div>
            </div>

            <div className="restaurant-photo">
              <img src={restaurantImage} alt="Restaurant interior" />
              <div className="photo-shade" />
              <div className="photo-caption">
                <span className="confirmed">
                  <ShieldCheck size={17} /> Seat Confirmed
                </span>
              </div>
            </div>
          </section>

          <div className="session-inputs">
            <label>
              Your name
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ada Obi"
              />
            </label>
            <label>
              Table number
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. 07"
              />
            </label>
            {error && <p className="input-error">{error}</p>}
          </div>

          <div className="info-grid">
            <section className="info-card">
              <div className="info-top">
                <span className="info-icon wifi-icon">
                  <Wifi size={21} />
                </span>
                <span className="status-tag green">Free</span>
              </div>
              <div className="info-text">
                <span>Guest Wi-Fi</span>
                <strong>Restaurant-Guest</strong>
                <p>Pass: <b>copper2026</b></p>
              </div>
            </section>
            <section className="info-card">
              <div className="info-top">
                <span className="info-icon">
                  <Clock3 size={21} />
                </span>
                <span className="status-tag coral">Open</span>
              </div>
              <div className="info-text">
                <span>Session Started</span>
                <strong>{sessionTime || "--:--"}</strong>
              </div>
            </section>
          </div>

          <div className="kitchen-note">
            <HandHelping size={22} className="note-icon" />
            <div>
              <strong>Direct Kitchen Firing</strong>
              <p>Add dishes directly from your phone. Each order transmits directly to the kitchen.</p>
            </div>
          </div>

          <div className="actions">
            <button className="primary-button" onClick={handleStartOrdering}>
              Start Ordering <ArrowRight size={23} />
            </button>
            <button className="assistance-button" onClick={() => showNotice("A server will be with you shortly.")}>
              <Bell size={18} /> Need assistance now?
            </button>
          </div>
        </div>
      </main>

      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
    </div>
  );
}