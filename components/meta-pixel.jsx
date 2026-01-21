"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function MetaPixel() {
    const pathname = usePathname();

    useEffect(() => {
        let attempts = 0;
        const track = () => {
            if (window.fbq) {
                window.fbq("track", "PageView");
            } else if (attempts < 10) {
                attempts++;
                setTimeout(track, 200);
            } else {
                console.warn("Meta Pixel: fbq not detected after retries");
            }
        };
        track();
    }, [pathname]);

    return null;
}
