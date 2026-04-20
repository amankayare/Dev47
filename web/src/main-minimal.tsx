import { createRoot } from "react-dom/client";

// Minimal React test
function MinimalApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 React is Working!</h1>
      <p>This is a minimal React application to test if the framework is loading correctly.</p>
      <button 
        onClick={() => alert('React event handling works!')}
        style={{
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  console.log("Creating React root...");
  createRoot(root).render(<MinimalApp />);
  console.log("React app rendered!");
} else {
  console.error("Root element not found!");
}
