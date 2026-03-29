import "./globals.css";

export const metadata = {
  title: "Simmer",
  description: "Meal planning for your household",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
