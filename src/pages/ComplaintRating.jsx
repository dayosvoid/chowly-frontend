import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrder, submitComplaint } from "../api/client";
 
/**
 * NOTE: This renders only the <main> content of the mockup. The fixed
 * <header> (logo / Customer-Waiter switch / avatar) and the bottom
 * <nav> bar are assumed to live in a shared Layout that wraps every
 * page (same assumption used for the ServiceCall screen), so they
 * aren't duplicated here.
 *
 * Needs the Material Symbols font loaded once, globally:
 *   <link rel="preconnect" href="https://fonts.googleapis.com" />
 *   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
 *   <link
 *     href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
 *     rel="stylesheet"
 *   />
 * plus the custom Tailwind tokens from the design system configured
 * in tailwind.config.js.
 */
 
const RATING_LABELS = {
  0: "Tap a star to rate",
  1: "Could Be Better",
  2: "Fair Dining",
  3: "Good & Savory",
  4: "Very Good!",
  5: "Exceptional Hospitality!",
};
 
const INITIAL_TAGS = [
  { label: "Delicious food", icon: "restaurant" },
  { label: "Fast service", icon: "bolt" },
  { label: "Friendly staff", icon: "sentiment_satisfied" },
  { label: "Atmosphere", icon: "local_fire_department" },
  { label: "Beverage craft", icon: "redeem" },
  { label: "Wine pairing", icon: "wine_bar" },
  { label: "Spotless table", icon: "sanitizer" },
];
 
export default function ComplaintRating() {
  const { orderId } = useParams();
  const navigate = useNavigate();
 
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
 
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState(INITIAL_TAGS.map((tag) => ({ ...tag, active: false })));
  const [notes, setNotes] = useState("");
  const [hostRequested, setHostRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
 
  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setLoadError("Could not load order."))
      .finally(() => setLoading(false));
  }, [orderId]);
 
  const toggleTag = (label) => {
    setTags((current) => current.map((tag) => (tag.label === label ? { ...tag, active: !tag.active } : tag)));
  };
 
  const handleSubmit = async () => {
    if (rating === 0) {
      setSubmitError("Please select a star rating first.");
      return;
    }
 
    setSubmitting(true);
    setSubmitError("");
 
    const activeTags = tags.filter((t) => t.active).map((t) => t.label);
    const description = [activeTags.join(", "), notes.trim()].filter(Boolean).join(" — ") || undefined;
 
    try {
      await submitComplaint(orderId, { description, rating });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
 
  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center relative w-full pt-20 pb-28 bg-surface">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading order...</p>
      </main>
    );
  }
 
  if (!order) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center relative w-full pt-20 pb-28 bg-surface">
        <p className="font-body-md text-body-md text-error">{loadError || "Order not found."}</p>
      </main>
    );
  }
 
  const primaryChefName = order.items?.find((item) => item.chef)?.chef?.fullName;
 
  return (
    <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface">
      <div className="flex flex-col w-full px-screen-margin-mobile pb-gutter-2xl">
        {/* Role Status Pill & Order Context Ribbon */}
        <div className="flex items-center justify-between gap-gutter-sm mb-gutter-lg mt-gutter-xs">
          <div className="inline-flex items-center gap-gutter-xs bg-surface-container-high px-gutter-md py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label-sm text-label-sm text-on-surface uppercase font-bold tracking-wider">Customer Mode Active</span>
          </div>
          <span className="font-label-sm text-label-sm text-primary font-bold bg-primary-fixed px-gutter-sm py-0.5 rounded-full">
            Order #{String(order.id).slice(-6).toUpperCase()}
          </span>
        </div>
 
        {/* Header Card with Warm Visual Texture */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-gutter-lg shadow-sm mb-gutter-lg">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-primary-fixed/30 pointer-events-none blur-xl" />
          <div className="flex items-start gap-gutter-md relative z-10">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                restaurant
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-gutter-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">{order.restaurantName}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Table {order.tableNumber}</span>
              </div>
              <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface tracking-tight mt-0.5">Rate Your Experience</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Help our culinary and service staff craft even better moments for your table.
              </p>
            </div>
          </div>
        </div>
 
        {/* Main Feedback Form Card */}
        <div className="bg-surface-container-lowest rounded-xl p-gutter-lg shadow-sm flex flex-col gap-gutter-xl mb-gutter-xl">
          {/* Star Rating Interactive Block */}
          <div className="flex flex-col items-center justify-center text-center py-gutter-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold mb-1">Overall Dining Score</span>
            <div className="h-8 flex items-center justify-center mb-gutter-sm">
              <span className="font-headline-sm text-headline-sm text-primary font-bold transition-all duration-200 ease-out">
                {RATING_LABELS[rating]}
              </span>
            </div>
            <div aria-label="Rating out of 5 stars" className="flex items-center justify-center gap-gutter-sm" role="radiogroup">
              {[1, 2, 3, 4, 5].map((value) => {
                const filled = value <= rating;
                const starLabels = {
                  1: "Needs Improvement",
                  2: "Fair",
                  3: "Good",
                  4: "Very Good",
                  5: "Exceptional",
                };
                return (
                  <button
                    key={value}
                    aria-label={`${value} star${value === 1 ? "" : "s"} - ${starLabels[value]}`}
                    aria-checked={value === rating}
                    role="radio"
                    className={`star-btn w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all touch-manipulation focus:outline-none ${
                      filled ? "text-tertiary-container" : "text-surface-dim"
                    }`}
                    type="button"
                    onClick={() => setRating(value)}
                  >
                    <span
                      className="material-symbols-outlined text-[36px] star-icon"
                      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}` }}
                    >
                      star
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between w-full max-w-[280px] px-gutter-xs mt-gutter-xs font-label-sm text-label-sm text-on-surface-variant">
              <span>Subtle &amp; honest</span>
              <span>Pure joy</span>
            </div>
          </div>
 
          {/* Quick Feedback Tags Selection */}
          <div className="flex flex-col gap-gutter-sm">
            <div className="flex items-center justify-between">
              <label className="font-label-lg text-label-lg text-on-surface font-semibold">What stood out most?</label>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Tap to tag</span>
            </div>
            <div className="flex flex-wrap gap-gutter-sm">
              {tags.map((tag) => (
                <button
                  key={tag.label}
                  className={`tag-chip flex items-center gap-gutter-xs px-gutter-md py-gutter-sm rounded-full font-label-md text-label-md active:scale-95 transition-all touch-manipulation ${
                    tag.active
                      ? "active bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                  type="button"
                  aria-pressed={tag.active}
                  onClick={() => toggleTag(tag.label)}
                >
                  <span className="material-symbols-outlined text-[16px]">{tag.icon}</span>
                  <span>{tag.label}</span>
                </button>
              ))}
            </div>
          </div>
 
          {/* Complaint & Feedback Specifics Textarea */}
          <div className="flex flex-col gap-gutter-xs">
            <div className="flex items-center justify-between">
              <label className="font-label-lg text-label-lg text-on-surface font-semibold" htmlFor="feedback-notes">
                Complaint or Specific Feedback <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">(Optional)</span>
              </label>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{notes.length}/300</span>
            </div>
            <div className="relative rounded-xl bg-surface-container-low p-gutter-xs transition-focus focus-within:bg-surface-container-lowest shadow-inner">
              <textarea
                className="w-full bg-transparent p-gutter-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none resize-none leading-relaxed"
                id="feedback-notes"
                maxLength={300}
                placeholder="Tell us how we can improve, or report any issue with food temperature, missing items, or service..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant px-1 mt-0.5">
              Staff supervisor reviews every note instantly to address immediate table concerns.
            </p>
          </div>
 
          {/* Manager Attention Quick Toggle for Urgent Matters */}
          <div className="bg-surface-container-low rounded-xl p-gutter-md flex items-center justify-between gap-gutter-md">
            <div className="flex items-center gap-gutter-sm min-w-0">
              <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-title-md text-title-md text-on-surface truncate">Need tableside resolution?</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">Notify lead host to drop by Table {order.tableNumber}</span>
              </div>
            </div>
            <button
              className={`px-gutter-md py-gutter-sm rounded-full font-label-md text-label-md transition-all touch-manipulation flex-shrink-0 ${
                hostRequested ? "bg-secondary text-on-secondary" : "bg-surface-container-highest text-on-surface hover:bg-secondary hover:text-on-secondary"
              }`}
              type="button"
              onClick={() => setHostRequested((current) => !current)}
            >
              {hostRequested ? "Requested ✓" : "Request"}
            </button>
          </div>
 
          {submitError && <p className="font-body-sm text-body-sm text-error px-1">{submitError}</p>}
 
          {/* Primary Action Section */}
          <div className="pt-gutter-xs flex flex-col gap-gutter-sm">
            <button
              className={`w-full h-12 rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-gutter-xs shadow-md active:scale-[0.99] transition-all touch-manipulation ${
                submitted ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary active:bg-primary-container"
              }`}
              type="button"
              disabled={submitting || submitted}
              onClick={handleSubmit}
            >
              {submitted ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Feedback Received</span>
                </>
              ) : submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Review</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
            <div className="flex items-center justify-center gap-gutter-xs py-gutter-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
              <span className="font-label-sm text-label-sm">Discreetly logged to {order.restaurantName} Quality Desk</span>
            </div>
          </div>
        </div>
 
        {/* Food & Ambiance Photographic Cards (Visual Richness) */}
        <div className="grid grid-cols-2 gap-gutter-md mb-gutter-lg">
          <div className="flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
            <img
              className="w-full h-24 object-cover"
              alt="Warm artisanal dining room with copper pendant lights and candlelight"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7jVU2Lv2sIpXrVYSU-Bj-x09o8c8Hn_3WK96q2Id7OctiFCFNHZAO3z47hq-wb9aRKvU38OVXYYZLOpsF7bKSTXuCfWLi52aaBpFWDRUDqT-BKzUZA74tbBxrA-vpEDul8qjhsf0VWiEcUdk6kDuPBLPv-PqkfAx06fCfavNCJKcAwOemxHHxg7EzA6zL5zL3XeBlS6gwIlj8j54GXEioXtKEBLJo_Ycv_qNawfXbjigm_lfGzTVaaA"
            />
            <div className="p-gutter-sm flex flex-col">
              <span className="font-label-sm text-label-sm font-bold text-on-surface">Evening Atmosphere</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Acoustics &amp; warmth</span>
            </div>
          </div>
          <div className="flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
            <img
              className="w-full h-24 object-cover"
              alt="Artfully plated bistro entree on handmade stoneware with seasonal puree"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPRicBkd2UCDMXdtt_tf3nC9-5aupWEtGRN3Zo4TKoYYIEkiI1-FnoUaCRqxua0wmJzXLhPMFcggE9CY7NbNkn_5FOQPu1w1aBDxEDmW9YEjES3x9ibdDNyiGdE-ce0ajmaSG84KenV3fRYoPe47GcDWnjJFoSQCA-RCgWcvm9fCaTPpCPKAIJF-9TYJQMb-MFXLCBUHDNOzLJqWeqU7sibk7c48LFhlaup5ETedgHKdkw6ZQyF_J0Fw"
            />
            <div className="p-gutter-sm flex flex-col">
              <span className="font-label-sm text-label-sm font-bold text-on-surface">Kitchen Precision</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Plate temperature &amp; craft</span>
            </div>
          </div>
        </div>
 
        {/* Delightful Toast (shown once feedback is submitted) */}
        {submitted && (
          <div className="bg-secondary text-on-secondary rounded-xl p-gutter-lg shadow-xl flex items-center gap-gutter-md transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                volunteer_activism
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-md text-title-md font-bold">Thank you kindly!</span>
              <span className="font-body-sm text-body-sm text-secondary-fixed-dim">
                {primaryChefName
                  ? `Your rating is shared with ${primaryChefName} and your table steward.`
                  : "Your rating is shared with the kitchen and your table steward."}
              </span>
            </div>
          </div>
        )}
 
        {submitted && (
          <button
            className="w-full mt-gutter-lg h-12 rounded-xl bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 hover:bg-surface-container-highest"
            type="button"
            onClick={() => navigate("/start")}
          >
            Start a New Session
          </button>
        )}
      </div>
    </main>
  );
}
 