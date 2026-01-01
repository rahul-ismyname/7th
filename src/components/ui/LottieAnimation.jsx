"use client";

import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

export function LottieAnimation({
    animationData,
    loop = true,
    autoplay = true,
    className
}) {
    // If no animation data provided, return null to prevent errors
    if (!animationData) return null;

    return (
        <div className={cn("flex items-center justify-center", className)}>
            <Lottie
                animationData={animationData}
                loop={loop}
                autoplay={autoplay}
                className="w-full h-full"
            />
        </div>
    );
}
