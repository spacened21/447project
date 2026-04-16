import { useState } from "react";
import { useNavigate } from "react-router-dom";

function InventoryPage({ inventoryItems, onLoadInventory, message, error }) {
  const navigate = useNavigate();
  const [placeholderMessage, setPlaceholderMessage] = useState("");

  return (
    <div className="page-wrapper">
      <div className="dashboard-container">
        <h1>Inventory</h1>

        <div className="button-row">
          <button
            onClick={() => {
              setPlaceholderMessage("");
              onLoadInventory();
            }}
          >
            View Inventory
          </button>

          <button
            onClick={() =>
              setPlaceholderMessage("Add item functionality coming soon.")
            }
          >
            Add Items
          </button>

          <button
            onClick={() =>
              setPlaceholderMessage("Delete item functionality coming soon.")
            }
          >
            Delete Items
          </button>
        </div>

        <div className="button-row">
          <button
            className="secondary-button small-button"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>

        {placeholderMessage && <p className="success">{placeholderMessage}</p>}
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <div className="inventory-section">
          {inventoryItems.length === 0 ? (
            <p>No inventory items loaded yet.</p>
          ) : (
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Supplier</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr key={item.item_id}>
                    <td>{item.item_id}</td>
                    <td>{item.name}</td>
                    <td>{item.description}</td>
                    <td>{item.type}</td>
                    <td>{item.quantity}</td>
                    <td>${item.price}</td>
                    <td>{item.supplier}</td>
                    <td>{item.created_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryPage;