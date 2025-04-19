import { useContext, useEffect, useState } from "react";
import $ from "jquery";
import "datatables.net-dt";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import { AppContext } from "../context/AppContext"; // Importing AppContext

const TableDataLayer = () => {
  const { token, loading, setLoading } = useContext(AppContext); // Access loading state from AppContext
  const [appointments, setAppointments] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [viewData, setViewData] = useState(null);


  useEffect(() => {
    fetchAppointments();
    init()

  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    console.log('appoint fetchinf')
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setAppointments(data);
    }

    setLoading(false);
  };

  // Initialize DataTable after data is fetched
  function init() {
    if (appointments.length > 0) {
      const table = $("#dataTable").DataTable({
        pageLength: 10,
        ordering: false,
        destroy: true,
      });
      return () => table.destroy(true);
    }
  }
  useEffect(() => {
    init()

  }, [appointments]);

  // Toggle all
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) {
      const allIds = appointments.map((a) => a.id);
      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  // Toggle individual
  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // View appointment details
  const handleView = (data) => {
    setViewData(data);
  };

  // Delete individual appointment with authentication check
  const handleDelete = async (id) => {
    if (!token) {
      alert("You need to be logged in to delete an appointment.");
      return;
    }

    setLoading(true); // Set loading to true during delete operation

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error.message);
      alert("Failed to delete appointment.");
    } else {
      fetchAppointments(); // Refetch appointments after successful deletion
    }

    setLoading(false); // Set loading to false after delete
  };
  // Delete selected appointments
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    setLoading(true); // Set loading to true during bulk delete operation

    const { error } = await supabase
      .from("appointments")
      .delete()
      .in("id", selectedRows);

    if (!error) {
      setAppointments((prev) =>
        prev.filter((a) => !selectedRows.includes(a.id))
      );
      setSelectedRows([]);
    }

    setLoading(false); // Set loading to false after bulk delete
  };

  return (
    <>
      {loading && (
        <div className="loader">
          {/* Customize loader style as needed */}
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="card basic-data-table">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Appointments</h5>
          <button
            className="btn btn-danger"
            disabled={selectedRows.length === 0}
            onClick={handleBulkDelete}
          >
            Delete Selected
          </button>
        </div>
        <div className="card-body">
          <table className="table bordered-table mb-0" id="dataTable">
            <thead>
              <tr>
                <th>
                  <div className="form-check d-flex align-items-center">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedRows.length === appointments.length &&
                        appointments.length > 0
                      }
                    />
                    <label className="form-check-label">S.L</label>
                  </div>
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Date</th>
                <th>Package</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments?.map((appointment, index) => (
                <tr key={appointment.id}>
                  <td>
                    <div className="form-check d-flex align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedRows.includes(appointment.id)}
                        onChange={() => handleSelectRow(appointment.id)}
                      />
                      <label className="form-check-label">{index + 1}</label>
                    </div>
                  </td>
                  <td>{appointment.name}</td>
                  <td>{appointment.email}</td>

                  {/* <td>{appointment.created_at?.split("T")[0]}</td> */}
                  <td>{appointment.date}</td>
                  <td>{appointment.package}</td>
                  <td style={{display:"flex",gap:"10px"}}>
                    <button
                      onClick={() => handleView(appointment)}
                      className="table-icon view"
                    >
                      <Icon icon="iconamoon:eye-light" />
                    </button>
                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="table-icon dlt"
                    >
                      <Icon icon="mingcute:delete-2-line" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for appointment details */}
      {viewData && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Appointment Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewData(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p><strong>Name:</strong> {viewData.name}</p>
                <p><strong>Email:</strong> {viewData.created_at?.split("T")[0]}</p>
                <p><strong>Date:</strong> {viewData.date}</p>
                <p><strong>Package:</strong> {viewData.package}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewData(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TableDataLayer;
