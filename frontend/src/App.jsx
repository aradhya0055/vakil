import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";
const CASES_PER_PAGE = 12;
const emptyForm = {
  case_number: "",
  case_title: "",
  client_name: "",
  status: "Open",
  next_hearing_date: "",
  notes: "",
};

function getDaysUntil(dateValue) {
  if (!dateValue) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hearingDate = new Date(`${dateValue}T00:00:00`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.round(
    (hearingDate.getTime() - today.getTime()) /
      millisecondsPerDay
  );
}

function getHearingInformation(dateValue, caseStatus) {
  if (caseStatus === "Closed") {
    return {
      label: "Case closed",
      className: "hearing-closed",
    };
  }

  const daysUntil = getDaysUntil(dateValue);

  if (daysUntil === null) {
    return {
      label: "No hearing scheduled",
      className: "hearing-unscheduled",
    };
  }

  if (daysUntil < 0) {
    return {
      label: `Overdue by ${Math.abs(daysUntil)} day(s)`,
      className: "hearing-overdue",
    };
  }

  if (daysUntil === 0) {
    return {
      label: "Hearing today",
      className: "hearing-urgent",
    };
  }

  if (daysUntil <= 7) {
    return {
      label: `Hearing in ${daysUntil} day(s)`,
      className: "hearing-urgent",
    };
  }

  return {
    label: `Hearing in ${daysUntil} day(s)`,
    className: "hearing-upcoming",
  };
}

function App() {
  const [cases, setCases] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadCases();
  }, []);

  const statistics = useMemo(() => {
    const upcomingHearings = cases.filter((legalCase) => {
      const daysUntil = getDaysUntil(
        legalCase.next_hearing_date
      );

      return (
        legalCase.status !== "Closed" &&
        daysUntil !== null &&
        daysUntil >= 0 &&
        daysUntil <= 7
      );
    }).length;

    return {
      total: cases.length,
      open: cases.filter(
        (legalCase) => legalCase.status === "Open"
      ).length,
      pending: cases.filter(
        (legalCase) => legalCase.status === "Pending"
      ).length,
      closed: cases.filter(
        (legalCase) => legalCase.status === "Closed"
      ).length,
      upcoming: upcomingHearings,
    };
  }, [cases]);

  const visibleCases = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return cases
      .filter((legalCase) => {
        const matchesStatus =
          statusFilter === "All" ||
          legalCase.status === statusFilter;

        const searchableText = [
          legalCase.case_number,
          legalCase.case_title,
          legalCase.client_name,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          normalizedSearch === "" ||
          searchableText.includes(normalizedSearch);

        return matchesStatus && matchesSearch;
      })
      .sort((firstCase, secondCase) => {
        if (!firstCase.next_hearing_date) {
          return 1;
        }

        if (!secondCase.next_hearing_date) {
          return -1;
        }

        return firstCase.next_hearing_date.localeCompare(
          secondCase.next_hearing_date
        );
      });
  }, [cases, searchTerm, statusFilter]);
    const totalPages = Math.max(
    1,
    Math.ceil(visibleCases.length / CASES_PER_PAGE)
  );

    const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const firstCaseIndex =
    (safeCurrentPage - 1) * CASES_PER_PAGE;

  const paginatedCases = visibleCases.slice(
    firstCaseIndex,
    firstCaseIndex + CASES_PER_PAGE
  );

 
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
    setSubmitting(true);

    const requestBody = {
      ...formData,
      next_hearing_date:
        formData.next_hearing_date || null,
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
        throw new Error(
          data.detail || "Could not create case"
        );
      }

      setCases((currentCases) => [
        ...currentCases,
        data,
      ]);
      setFormData(emptyForm);
      setMessage(
        `Case ${data.case_number} created successfully`
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
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
        throw new Error(
          data.detail || "Could not delete case"
        );
      }

      setCases((currentCases) =>
        currentCases.filter(
          (legalCase) =>
            legalCase.case_number !== caseNumber
        )
      );

      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleStatusChange(
    caseNumber,
    newStatus
  ) {
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

      setMessage(
        `Case ${caseNumber} updated successfully`
      );
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">
            Legal Operations Command Center
          </p>
          <h1>Vakil</h1>
          <p>
            Track cases, hearings and legal workload
            from one place.
          </p>
        </div>

        <div className="system-status">
          <span className="status-dot" />
          System operational
        </div>
      </header>

      <section className="dashboard">
        <article className="stat-card">
          <span>Total cases</span>
          <strong>{statistics.total}</strong>
        </article>

        <article className="stat-card stat-open">
          <span>Open</span>
          <strong>{statistics.open}</strong>
        </article>

        <article className="stat-card stat-pending">
          <span>Pending</span>
          <strong>{statistics.pending}</strong>
        </article>

        <article className="stat-card stat-closed">
          <span>Closed</span>
          <strong>{statistics.closed}</strong>
        </article>

        <article className="stat-card stat-urgent">
          <span>Due in 7 days</span>
          <strong>{statistics.upcoming}</strong>
        </article>
      </section>

      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <section className="case-form-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">New matter</p>
            <h2>Add a legal case</h2>
          </div>
        </div>

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
            Initial status
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
              placeholder="Add important case notes"
            />
          </label>

          <button
            className="primary-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create case"}
          </button>
        </form>
      </section>

      <section className="case-list-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Case portfolio</p>
            <h2>Active case workspace</h2>
          </div>

          <span className="result-count">
            {visibleCases.length} result(s)
          </span>
        </div>

        <div className="case-controls">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => {
             setSearchTerm(event.target.value);
             setCurrentPage(1);
}}
            placeholder="Search cases, clients or case numbers"
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
}}
          >
            <option value="All">All statuses</option>
            <option value="Open">Open</option>
            <option value="Pending">Pending</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {loading && <p>Loading cases...</p>}

        {!loading && visibleCases.length === 0 && (
          <div className="empty-state">
            <h3>No matching cases</h3>
            <p>
              Change the search or filter, or add a new
              legal case.
            </p>
          </div>
        )}

        <div className="case-grid">
          {paginatedCases.map((legalCase) => {
            const hearingInformation =
              getHearingInformation(
                legalCase.next_hearing_date,
                legalCase.status
              );

            return (
              <article
                className="case-card"
                key={legalCase.id}
              >
                <div className="case-card-heading">
                  <div>
                    <span className="case-number">
                      {legalCase.case_number}
                    </span>
                    <h3>{legalCase.case_title}</h3>
                  </div>

                  <span
                    className={`hearing-badge ${hearingInformation.className}`}
                  >
                    {hearingInformation.label}
                  </span>
                </div>

                <div className="case-details">
                  <p>
                    <span>Client</span>
                    <strong>
                      {legalCase.client_name}
                    </strong>
                  </p>

                  <p>
                    <span>Next hearing</span>
                    <strong>
                      {legalCase.next_hearing_date ||
                        "Not scheduled"}
                    </strong>
                  </p>
                </div>

                <p className="case-notes">
                  {legalCase.notes ||
                    "No notes have been added."}
                </p>

                <div className="case-actions">
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
                      <option value="Pending">
                        Pending
                      </option>
                      <option value="Closed">
                        Closed
                      </option>
                    </select>
                  </label>

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() =>
                      handleDelete(
                        legalCase.case_number
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
                    })}
        </div>

        <div className="pagination">
  <button
    type="button"
    disabled={safeCurrentPage === 1}
    onClick={() =>
      setCurrentPage(safeCurrentPage - 1)
    }
  >
    Previous
  </button>

  <span>
    Page {safeCurrentPage} of {totalPages}
  </span>

  <button
    type="button"
    disabled={safeCurrentPage === totalPages}
    onClick={() =>
      setCurrentPage(safeCurrentPage + 1)
    }
  >
    Next
  </button>
</div>
      </section>
    </main>
  );
}

export default App;