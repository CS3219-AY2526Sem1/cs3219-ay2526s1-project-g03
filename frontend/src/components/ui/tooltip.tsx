// import React, { useState, useEffect, useRef } from 'react';
// import '../../styles/tooltip.css'; // Import a CSS file to style the tooltip

// interface TooltipProps {
//   children: React.ReactNode;
//   content: React.ReactNode;
//   side?: 'top' | 'bottom' | 'left' | 'right';
// }

// const Tooltip: React.FC<TooltipProps> = ({ children, content, side = 'top' }) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const tooltipRef = useRef<HTMLDivElement>(null);
//   const triggerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleMouseEnter = () => setIsVisible(true);
//     const handleMouseLeave = () => setIsVisible(false);

//     triggerRef.current?.addEventListener('mouseenter', handleMouseEnter);
//     triggerRef.current?.addEventListener('mouseleave', handleMouseLeave);

//     return () => {
//       triggerRef.current?.removeEventListener('mouseenter', handleMouseEnter);
//       triggerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
//     };
//   }, []);

//   useEffect(() => {
//     if (tooltipRef.current && triggerRef.current) {
//       const triggerRect = triggerRef.current.getBoundingClientRect();
//       const tooltipRect = tooltipRef.current.getBoundingClientRect();

//       let style = {};
//       if (side === 'top') {
//         style = {
//           top: `${triggerRect.top - tooltipRect.height - 10}px`,
//           left: `${triggerRect.left + window.scrollX}px`,
//         };
//       } else if (side === 'bottom') {
//         style = {
//           top: `${triggerRect.bottom + 10}px`,
//           left: `${triggerRect.left + window.scrollX}px`,
//         };
//       } else if (side === 'left') {
//         style = {
//           top: `${triggerRect.top + window.scrollY}px`,
//           left: `${triggerRect.left - tooltipRect.width - 10}px`,
//         };
//       } else if (side === 'right') {
//         style = {
//           top: `${triggerRect.top + window.scrollY}px`,
//           left: `${triggerRect.right + 10}px`,
//         };
//       }

//       tooltipRef.current.style.cssText = `
//         visibility: ${isVisible ? 'visible' : 'hidden'};
//         ${style.cssText}
//       `;
//     }
//   }, [isVisible, side]);

//   return (
//     <div>
//       <div ref={triggerRef} className="tooltip-trigger">
//         {children}
//       </div>
//       {isVisible && (
//         <div ref={tooltipRef} className={`tooltip-content ${side}`}>
//           {content}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Tooltip;