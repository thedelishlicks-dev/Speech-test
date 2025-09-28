import React, { useState, useEffect, useRef } from 'react';

interface AnimatedViewProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

const AnimatedView: React.FC<AnimatedViewProps> = ({ isVisible, children, className = '', duration = 500 }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration); // This should match the CSS transition duration

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const style = {
    transition: `opacity ${duration}ms ease-in-out`,
    opacity: isVisible && shouldRender ? 1 : 0,
  };

  return shouldRender ? (
    <div style={style} className={className}>
      {children}
    </div>
  ) : null;
};

export default AnimatedView;
