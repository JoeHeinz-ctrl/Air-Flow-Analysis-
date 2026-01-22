export default function Card({ title, children }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      {title && <h3 className="font-semibold mb-3">{title}</h3>}
      {children}
    </div>
  );
}
