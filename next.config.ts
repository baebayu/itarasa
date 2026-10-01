import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  // Biarkan settingan asli lu di sini kalau ada
};

export default withPWA(nextConfig);