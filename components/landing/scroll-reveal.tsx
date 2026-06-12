"use client";

import { useEffect, useRef } from "react";
import { useLoader } from "@/context/LoaderContext";

export function ScrollReveal() {
  const { appLoading } = useLoader();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Wait until the AppLoader has finished
    if (appLoading) return;

    // Allow the browser to process the layout change from 'display: none' to 'display: block'
    const timeoutId = setTimeout(() => {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
            }
          });
        },
        { 
          threshold: 0.1, 
          rootMargin: "0px 0px -20px 0px" 
        }
      );

      // Observe all elements with the scroll-animate class
      const elements = document.querySelectorAll(".scroll-animate");
      elements.forEach((el) => observerRef.current?.observe(el));
      
      // Fallback: Manually show the first element (Hero section) immediately
      // to guarantee it never gets stuck invisible if the user is already at the top.
      if (elements.length > 0 && window.scrollY < 100) {
        elements[0].classList.add("is-visible");
      }
      
    }, 150); // 150ms delay for browser layout paint

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [appLoading]);

  return null;
}
