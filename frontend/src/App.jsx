import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const emptyForm = {
  case_number: "",
  case_title: "",
  client_name: "",
  status: "Open",
  next_hearing_date: "",
  notes: "",
};

function App() {
  const [cases, setCases] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch(`${API_URL}/cases`);

        if (!response.ok) {
          throw new Error("Could not load cases");
        }

        const data = await response.json();
        setCases(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadCases();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const requestBody = {
      ...formData,
      next_hearing_date: formData.next_hearing_date || null,
      notes: formData.notes || null,
    };

    try {
      const response = await fetch(`${API_URL}/cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not create case");
      }

      setCases((currentCases) => [...currentCases, data]);
      setFormData(emptyForm);
      setMessage("Case created successfully");
    } catch (error) {
      setError(error.message);
    }
  }
  async function handleDelete(caseNumber) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${caseNumber}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/cases/${caseNumber}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not delete case");
      }

      setCases((currentCases) =>
        currentCases.filter(
          (legalCase) => legalCase.case_number !== caseNumber
        )
      );

      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    }
  }
    async function handleStatusChange(caseNumber, newStatus) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/cases/${caseNumber}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const updatedCase = await response.json();

      if (!response.ok) {
        throw new Error(
          updatedCase.detail || "Could not update case"
        );
      }

      setCases((currentCases) =>
        currentCases.map((legalCase) =>
          legalCase.case_number === caseNumber
            ? updatedCase
            : legalCase
        )
      );

      setMessage(`Case ${caseNumber} updated successfully`);
    } catch (error) {
      setError(error.message);
    }
  }
  return (
    <main>
      <header>
        <h1>Vakil</h1>
        <p>Legal Case Tracker</p>
      </header>

      <section>
        <h2>Add a new case</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Case number
            <input
              name="case_number"
              value={formData.case_number}
              onChange={handleChange}
              placeholder="CASE-103"
              required
            />
          </label>

          <label>
            Case title
            <input
              name="case_title"
              value={formData.case_title}
              onChange={handleChange}
              placeholder="ABC Ltd vs XYZ Ltd"
              required
            />
          </label>

          <label>
            Client name
            <input
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              placeholder="ABC Ltd"
              required
            />
          </label>

          <label>
            Status
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </label>

          <label>
            Next hearing date
            <input
              type="date"
              name="next_hearing_date"
              value={formData.next_hearing_date}
              onChange={handleChange}
            />
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add case notes"
            />
          </label>

          <button type="submit">Create case</button>
        </form>

        {message && <p>{message}</p>}
        {error && <p>{error}</p>}
      </section>

      <section>
        <h2>Cases</h2>

        {loading && <p>Loading cases...</p>}

        {!loading && !error && cases.length === 0 && (
          <p>No cases have been added yet.</p>
        )}
        
 {cases.map((legalCase) => (
  <article key={legalCase.id}>
    <h3>{legalCase.case_title}</h3>
    <p>Case number: {legalCase.case_number}</p>
    <p>Client: {legalCase.client_name}</p>
    <label>
  Status
  <select
    value={legalCase.status}
    onChange={(event) =>
      handleStatusChange(
        legalCase.case_number,
        event.target.value
      )
    }
  >
    <option value="Open">Open</option>
    <option value="Pending">Pending</option>
    <option value="Closed">Closed</option>
  </select>
</label>
    <p>
      Next hearing:{" "}
      {legalCase.next_hearing_date || "Not scheduled"}
    </p>
    <p>{legalCase.notes || "No notes"}</p>

    <button
      type="button"
      onClick={() => handleDelete(legalCase.case_number)}
    >
      Delete
    </button>
  </article>
))}
        
      </section>
    </main>
  );
}

export default App;