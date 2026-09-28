import './App.css';

function App() {
  return (
    <div className="app-container">
      <main className="hero-section">
        <div className="header-badge">
          <span className="status-dot"></span>
          <span>Project ID: P_022 • Agile Capstone</span>
        </div>

        <h1 className="hero-title">Retail Inventory Management System</h1>

        <p className="hero-subtitle">
          An industry-oriented full-stack web application designed for scalable
          management of products, warehouses, inventory, procurement, and fulfillment.
        </p>

        <div className="meta-grid">
          <div className="meta-card">
            <div className="card-tag">Frontend</div>
            <div className="card-title">React + Vite</div>
            <div className="card-desc">Modern component-driven UI with clean modular folder architecture.</div>
          </div>

          <div className="meta-card">
            <div className="card-tag">Backend</div>
            <div className="card-title">Node.js + Express</div>
            <div className="card-desc">Clean layered MVC architecture: Routes → Controllers → Services → Models.</div>
          </div>

          <div className="meta-card">
            <div className="card-tag">Database</div>
            <div className="card-title">MySQL</div>
            <div className="card-desc">Relational data store (to be configured in upcoming sprint).</div>
          </div>
        </div>

        <div className="status-banner">
          <strong>Initial Setup Active:</strong> Foundation phase established. Business modules, authentication, and database schemas will be developed incrementally.
        </div>
      </main>

      <footer className="footer">
        Retail Inventory Management System • Project ID: P_022 • Agile Capstone
      </footer>
    </div>
  );
}

export default App;
