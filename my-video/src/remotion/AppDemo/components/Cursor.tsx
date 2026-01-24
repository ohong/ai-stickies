import React from 'react';

export const Cursor: React.FC<{ x: number; y: number; click?: boolean }> = ({ x, y, click }) => {
    return (
        <div 
            style={{ 
                position: 'absolute', 
                left: x, 
                top: y,
                pointerEvents: 'none',
                zIndex: 100,
                transform: `scale(${click ? 0.8 : 1})`,
                transition: 'transform 0.1s'
            }}
        >
            <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="black" 
                stroke="white" 
                strokeWidth="2"
                className="drop-shadow-lg"
            >
                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
            </svg>
        </div>
    );
};
