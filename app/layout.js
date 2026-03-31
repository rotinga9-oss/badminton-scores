import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Score Tracker",
  description: "Track match scores and player rankings",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>
        <footer className="text-center text-xs text-slate-400 py-4">
          Score Tracker
        </footer>
      </body>
    </html>
  );
}
