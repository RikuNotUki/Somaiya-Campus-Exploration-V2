export default function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame flex flex-col p-6" style={{ fontFamily: "var(--font-sans)" }}>
      {children}
    </div>
  );
}
