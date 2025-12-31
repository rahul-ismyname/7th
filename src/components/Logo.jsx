import React from 'react';

export default function Logo({ className = "w-10 h-10", color = "currentColor" }) {
    // Unique ID for the mask to prevent conflicts if multiple logos are on page (though React usually handles this, SVGs can be tricky)
    const maskId = React.useId();

    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <mask id={maskId}>
                {/* White background reveals the shape */}
                <rect width="100" height="100" fill="white" />

                {/* Black W hides/cuts out the shape */}
                <path
                    d="M 28 38 L 39 68 L 50 42 L 61 68 L 72 38"
                    stroke="black"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
            </mask>

            {/* Ticket Shape */}
            {/* Outline: Rounded Rect with side notches at y=50 */}
            <path
                d="
                    M 15 20
                    H 85 
                    A 10 10 0 0 1 95 30 
                    V 42
                    A 8 8 0 0 0 95 58
                    V 70
                    A 10 10 0 0 1 85 80
                    H 15
                    A 10 10 0 0 1 5 70
                    V 58
                    A 8 8 0 0 0 5 42
                    V 30
                    A 10 10 0 0 1 15 20
                    Z
                "
                fill={color}
                mask={`url(#${maskId})`}
            />
        </svg>
    );
}
