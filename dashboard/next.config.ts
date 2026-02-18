import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: "https://membership-backend-1054327025113.us-central1.run.app",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "1054327025113-765gvg5r9kjci5kbucurijnp0ih1ap7e.apps.googleusercontent.com",
    NEXT_PUBLIC_BOT_USERNAME: "FTGateBot",
  },
};

export default nextConfig;
