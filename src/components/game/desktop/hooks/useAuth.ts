"use client";

import { useEffect, useState } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user/me");
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserEmail(data.email);
          setSubscriptionStatus(data.subscription_status || "free");
        } else {
          setIsAuthenticated(false);
          setUserEmail(null);
          setSubscriptionStatus(null);
        }
      } catch (error) {
        console.error("Failed to check auth status:", error);
        setIsAuthenticated(false);
        setUserEmail(null);
        setSubscriptionStatus(null);
      }
    };

    checkAuth();
  }, []);

  return {
    isAuthenticated,
    userEmail,
    subscriptionStatus,
  };
}

