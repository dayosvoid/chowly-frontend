import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import { Shield, X } from "lucide-react";
import "./Header.css";

export default function Header() {
  const { role, toggleRole, userName } = useRole();
  const navigate = useNavigate();
  const [showWaiterPrompt, setShowWaiterPrompt] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleRoleClick = () => {
    if (role === "customer") {
      setShowWaiterPrompt(true);
    } else {
      toggleRole();
      navigate("/menu");
    }
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pin === "0000") {
      toggleRole();
      setShowWaiterPrompt(false);
      setPin("");
      setError("");
      navigate("/waiter");
    } else {
      setError("Incorrect staff PIN");
    }
  };

  return (
    <>
      <header className="app-header mb-5">
        <div className="app-header__brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          Chowly
        </div>
        <button className="app-header__toggle" onClick={handleRoleClick} type="button">
          <span className={role === "customer" ? "active" : ""}>
            {role === "customer" ? userName : "Customer"}
          </span>
          <span className={role === "waiter" ? "active" : ""}>Waiter</span>
        </button>
      </header>

      {showWaiterPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface text-on-surface w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col gap-4 relative">
            <button 
              onClick={() => { setShowWaiterPrompt(false); setPin(""); setError(""); }} 
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
              type="button"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-title-md font-semibold">Staff Authentication</h3>
                <p className="font-body-sm text-on-surface-variant">Enter PIN to access Waiter dashboard</p>
              </div>
            </div>

            <form onSubmit={handleVerifyPin} className="flex flex-col gap-3 mt-2">
              <input 
                type="password" 
                maxLength="4"
                placeholder="Enter 4-digit PIN" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline/20 text-center text-lg tracking-widest focus:outline-none focus:border-primary"
                autoFocus
              />
              {error && <span className="text-error text-xs text-center font-medium">{error}</span>}
              <button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold hover:bg-primary-container transition-all"
              >
                Access Waiter Mode
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}