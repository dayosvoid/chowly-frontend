import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Heart,
  LifeBuoy,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
  Wine,
  Zap,
} from "lucide-react";
import { getOrder, submitComplaint } from "../api/client";
import "./ComplaintRating.css";

const ratingLabels = {
  1: "Could Be Better",
  2: "Fair Dining",
  3: "Good & Savory",
  4: "Very Good!",
  5: "Exceptional Hospitality!",
};

const initialTags = [
  { label: "Delicious food", icon: Utensils, active: false },
  { label: "Fast service", icon: Zap, active: false },
  { label: "Friendly staff", icon: MessageCircle, active: false },
  { label: "Atmosphere", icon: Sparkles, active: false },
  { label: "Beverage craft", icon: Sparkles, active: false },
  { label: "Wine pairing", icon: Wine, active: false },
  { label: "Spotless table", icon: ShieldCheck, active: false },
];

export default function ComplaintRating() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState(initialTags);
  const [notes, setNotes] = useState("");
  const [hostRequested, setHostRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setError("Could not load order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const toggleTag = (label) => {
    setTags((current) =>
      current.map((tag) => (tag.label === label ? { ...tag, active: !tag.active } : tag))
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a star rating first.");
      return;
    }

    setSubmitting(true);
    setError("");

    const activeTags = tags.filter((t) => t.active).map((t) => t.label);
    const description = [activeTags.join(", "), notes.trim()].filter(Boolean).join(" — ") || undefined;

    try {
      await submitComplaint(orderId, { description, rating });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page complaint-rating">
        <p>Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page complaint-rating">
        <p className="input-error">{error || "Order not found."}</p>
      </div>
    );
  }

  return (
    <div className="page complaint-rating">
      <div className="context-row">
        <span className="mode-pill">
          <span className="pulse-dot" /> Table {order.tableNumber}
        </span>
        <span className="order-pill">Order #{String(order.id).slice(-6).toUpperCase()}</span>
      </div>

      <section className="intro-card">
        <div className="intro-icon">
          <Utensils size={28} strokeWidth={2.5} />
        </div>
        <div>
          <div className="eyebrow-row">
            <span className="eyebrow">{order.restaurantName}</span>
            <span className="eyebrow-separator">•</span>
            <span className="table-label">Table {order.tableNumber}</span>
          </div>
          <h1>Rate Your Experience</h1>
          <p>Help our kitchen and service staff craft even better moments for your table.</p>
        </div>
      </section>

      <section className="feedback-card">
        <div className="rating-section">
          <span className="section-label">Overall Dining Score</span>
          <div className="rating-title">{rating > 0 ? ratingLabels[rating] : "Tap a star to rate"}</div>
          <div className="stars" role="radiogroup" aria-label="Rating out of 5 stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`star-button ${value <= rating ? "star-filled" : "star-empty"}`}
                onClick={() => {
                  setRating(value);
                  setSubmitted(false);
                }}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                aria-checked={value === rating}
                role="radio"
              >
                <Star size={38} strokeWidth={2.1} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>

        <div className="tag-section">
          <div className="section-heading">
            <h2>What stood out most?</h2>
            <span>Tap to tag</span>
          </div>
          <div className="tag-list">
            {tags.map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                type="button"
                className={`tag-chip ${active ? "tag-chip-active" : ""}`}
                onClick={() => toggleTag(label)}
                aria-pressed={active}
              >
                <Icon size={16} strokeWidth={2.2} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="notes-section">
          <div className="section-heading notes-heading">
            <label htmlFor="feedback-notes">
              Complaint or Specific Feedback <span>(Optional)</span>
            </label>
            <span>{notes.length}/300</span>
          </div>
          <textarea
            id="feedback-notes"
            maxLength={300}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell us how we can improve, or report any issue with food, timing, or service..."
          />
        </div>

        <div className="host-request">
          <div className="host-copy">
            <div className="host-icon">
              <LifeBuoy size={20} />
            </div>
            <div className="host-text">
              <strong>Need tableside resolution?</strong>
              <span>Notify lead host to drop by Table {order.tableNumber}</span>
            </div>
          </div>
          <button
            type="button"
            className={`request-button ${hostRequested ? "request-active" : ""}`}
            onClick={() => setHostRequested((c) => !c)}
          >
            {hostRequested ? (
              <>
                <Check size={15} /> Requested
              </>
            ) : (
              "Request"
            )}
          </button>
        </div>

        {error && <p className="input-error">{error}</p>}

        <div className="submit-area">
          <button
            type="button"
            className={`submit-button ${submitted ? "submit-success" : ""}`}
            onClick={handleSubmit}
            disabled={submitting || submitted}
          >
            {submitted ? (
              <>
                <CheckCircle2 size={20} /> Feedback Received
              </>
            ) : (
              <>
                <span>{submitting ? "Submitting..." : "Submit Review"}</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

        {submitted && (
          <div className="thank-you">
            <div className="thank-icon">
              <Heart size={24} fill="currentColor" />
            </div>
            <div>
              <strong>Thank you kindly!</strong>
              <span>Your feedback has been shared with the team.</span>
            </div>
          </div>
        )}
      </section>

      {submitted && (
        <button className="secondary-action" style={{ marginTop: 16, width: "100%" }} onClick={() => navigate("/start")}>
          Start a New Session
        </button>
      )}
    </div>
  );
}
