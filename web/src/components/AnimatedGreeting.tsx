import { useState, useEffect } from 'react';

interface AnimatedGreetingProps {
  className?: string;
}

const AnimatedGreeting = ({ className }: AnimatedGreetingProps) => {
  const greetings = [
    'Hello,',
    'Namaste,',
    'Bonjour,',
    'Hola,',
    'Konnichiwa,',
    'Guten Tag,',
    'Ciao,',
    'Привет,'
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentGreeting = greetings[currentIndex];
    
    if (isTyping) {
      // Typing effect
      if (displayText.length < currentGreeting.length) {
        const timer = setTimeout(() => {
          setDisplayText(currentGreeting.slice(0, displayText.length + 1));
        }, 100);
        return () => clearTimeout(timer);
      } else {
        // Pause before erasing
        const timer = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      // Erasing effect
      if (displayText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 50);
        return () => clearTimeout(timer);
      } else {
        // Move to next greeting
        setCurrentIndex((prev) => (prev + 1) % greetings.length);
        setIsTyping(true);
      }
    }
  }, [displayText, isTyping, currentIndex, greetings]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default AnimatedGreeting;