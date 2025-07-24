'use client';

import { useEffect } from 'react';

export const ParallaxElements = () => {
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const parallaxElements = document.querySelectorAll('.floating-circle');
      parallaxElements.forEach((element, index) => {
        const speed = 0.5 + index * 0.1;
        if (element instanceof HTMLElement) {
          element.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none -z-10">
      <div className="floating-circle absolute w-24 h-24 top-[20%] right-[10%] rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-float delay-[-2s]" />
      <div className="floating-circle absolute w-16 h-16 top-[60%] left-[5%] rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-float delay-[-4s]" />
      <div className="floating-circle absolute w-20 h-20 bottom-[20%] right-[30%] rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-float delay-[-1s]" />
    </div>
  );
}; 