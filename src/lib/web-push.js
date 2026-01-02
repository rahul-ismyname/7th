import webPush from 'web-push';

if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys are missing. Push notifications will not work.");
} else {
    webPush.setVapidDetails(
        `mailto:${process.env.EMAIL_USER || 'admin@waitly.app'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export { webPush };
