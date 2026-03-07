"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallback() {
    const router = useRouter();
    const supabase = createClient();
    const [status, setStatus] = useState("Authenticating...");

    useEffect(() => {
        // Check if we have an access token hash from Supabase implicit flow
        if (typeof window !== "undefined" && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");

            if (accessToken && refreshToken) {
                setStatus("Redirecting to the App...");

                // Are we coming from Expo Go? We can check query params, or we can just offer a multi-purpose link.
                // For Expo testing, we'll try to explicitly use the exp:// scheme if passed
                const urlParams = new URLSearchParams(window.location.search);
                let redirectApp = urlParams.get("redirect_to") || "guffgaff://auth/callback";

                // Try automatic redirection
                const appLink = `${redirectApp}#access_token=${accessToken}&refresh_token=${refreshToken}`;
                window.location.replace(appLink);

                // Fallback timeout in case redirect fails (user can click manually or standard flow continues)
                setTimeout(() => {
                    setStatus("If you are not redirected automatically, please press the button below.");
                }, 2500);
                return;
            }
        }

        // Default Web Auth handling: Let Supabase establish the session normally
        const handleAuth = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data.session) {
                router.replace("/feed");
            } else {
                setStatus("Authentication failed. Please try again or return to the app.");
            }
        };

        handleAuth();
    }, [router, supabase]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
            <h1 className="text-2xl font-bold tracking-tight mb-4">{status}</h1>
            {status.includes("not redirected") && (
                <button
                    onClick={() => {
                        const hashParams = new URLSearchParams(window.location.hash.substring(1));
                        const at = hashParams.get("access_token");
                        const rt = hashParams.get("refresh_token");
                        const urlParams = new URLSearchParams(window.location.search);
                        let redirectApp = urlParams.get("redirect_to") || "guffgaff://auth/callback";
                        window.location.href = `${redirectApp}#access_token=${at}&refresh_token=${rt}`;
                    }}
                    className="mt-6 bg-[#E12B28] hover:bg-[#C92220] transition-colors text-white font-medium py-3 px-8 rounded-full"
                >
                    Open In App
                </button>
            )}
        </div>
    );
}
