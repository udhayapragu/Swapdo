/** Demo affordances (one-click demo logins) are on in development, or when DEMO_MODE=true. */
export const demoModeEnabled = () => process.env.DEMO_MODE === "true" || process.env.NODE_ENV !== "production";
