import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Badminton Scores",
  description: "Track doubles badminton match scores and player rankings",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
          {children}
        </main>
        <footer className="text-center text-xs text-slate-400 py-4">
          Badminton Scores &mdash; doubles tracker
        </footer>
      </body>
    </html>
  );
}
