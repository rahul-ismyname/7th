import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        importScripts: ["/sw-push.js"],
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
};

export default withPWA(nextConfig);
