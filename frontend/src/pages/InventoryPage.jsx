import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.webp";

const EMPTY_FORM = {
  name: "",
  description: "",
  type: "material",
  quantity: "",
  price: "",
  supplier: "",
};

function InventoryPage({
  inventoryItems,
  onLoadInventory,
  onAddItem,
  onDeleteItem,
  message,
  error,
}) {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const success = await onAddItem({
      name: formValues.name,
      description: formValues.description,
      type: formValues.type,
      quantity: Number(formValues.quantity),
      price: formValues.price,
      supplier: formValues.supplier,
    });

    setSubmitting(false);

    if (success) {
      setFormValues(EMPTY_FORM);
      setShowAddForm(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="dashboard-container">
        <img src={logo} alt="Logo" className="logo" />
        <h1>Inventory</h1>

        <div className="button-row">
          <button
            onClick={() => {
              setShowAddForm(false);
              setDeleteMode(false);
              onLoadInventory();
            }}
          >
            View Inventory
          </button>

          <button
            onClick={() => {
              setDeleteMode(false);
              setShowAddForm((prev) => !prev);
            }}
          >
            {showAddForm ? "Cancel Add" : "Add Items"}
          </button>

          <button
            onClick={() => {
              setShowAddForm(false);
              setDeleteMode((prev) => !prev);
            }}
          >
            {deleteMode ? "Done Deleting" : "Delete Items"}
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

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        {showAddForm && (
          <form className="add-item-form" onSubmit={handleSubmitAdd}>
            <h2>Add New Item</h2>

            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              value={formValues.name}
              onChange={handleFieldChange}
              required
            />

            <label htmlFor="description">Description</label>
            <input
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleFieldChange}
              required
            />

            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formValues.type}
              onChange={handleFieldChange}
            >
              <option value="material">Material</option>
              <option value="equipment">Equipment</option>
            </select>

            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              step="1"
              value={formValues.quantity}
              onChange={handleFieldChange}
              required
            />

            <label htmlFor="price">Price</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formValues.price}
              onChange={handleFieldChange}
              required
            />

            <label htmlFor="supplier">Supplier</label>
            <input
              id="supplier"
              name="supplier"
              value={formValues.supplier}
              onChange={handleFieldChange}
              required
            />

            <button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Submit"}
            </button>
          </form>
        )}

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
                  {deleteMode && <th>Actions</th>}
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
                    {deleteMode && (
                      <td>
                        <button
                          className="small-button"
                          onClick={() => onDeleteItem(item.item_id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
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
