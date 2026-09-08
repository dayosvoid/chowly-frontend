import { createContext, useContext, useState } from "react";

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [role, setRole] = useState("customer");
  // Initialize user name from localStorage or default to "Customer"
  const [userName, setUserName] = useState(() => localStorage.getItem("chowly_user_name") || "Customer");

  const toggleRole = () => {
    setRole((prev) => (prev === "customer" ? "waiter" : "customer"));
  };

  const updateUserName = (name) => {
    setUserName(name);
    localStorage.setItem("chowly_user_name", name);
  };

  return (
    <RoleContext.Provider value={{ role, toggleRole, userName, updateUserName }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}