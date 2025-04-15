import { useEffect, useState } from "react";
import $ from "jquery";
import "datatables.net-dt";

import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { supabase } from '../supabaseClient'

const TableDataLayer = () => {
  useEffect(() => {
    const table = $("#dataTable").DataTable({
      pageLength: 10,
    });
    return () => {
      table.destroy(true);
    };
  }, []);

  const [appointments, setAppointments] = useState([])
  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error(error)
      else setAppointments(data)
    }

    fetchAppointments()
  }, [])

  return (
    <div className='card basic-data-table'>
      <div className='card-header'>
        <h5 className='card-title mb-0'>Appointments</h5>
      </div>
      <div className='card-body'>
        <table
          className='table bordered-table mb-0'
          id='dataTable'
          data-page-length={10}
        >
          <thead>
            <tr>
              <th scope='col'>
                <div className='form-check style-check d-flex align-items-center'>
                  <input className='form-check-input' type='checkbox' />
                  <label className='form-check-label'>S.L</label>
                </div>
              </th>
              <th scope='col'>Name</th>
              <th scope='col'>email</th>
              <th scope='col' className='dt-orderable-asc dt-orderable-desc'>
                date
              </th>
              <th scope='col'>Package</th>
              <th scope='col'>view/delete</th>
            </tr>
          </thead>
          <tbody>
          
          {appointments?.map((appointment,index)=>(
              <tr key={index}>
              <td>
                <div className='form-check style-check d-flex align-items-center'>
                  <input className='form-check-input' type='checkbox' />
                  <label className='form-check-label'>{index+1}</label>
                </div>
              </td>
              
              <td>
                <div className='d-flex align-items-center'>

                  <h6 className='text-md mb-0 fw-medium flex-grow-1'>
                    {appointment.name}
                  </h6>
                </div>
              </td>
              <td>{appointment.created_at?.split('T')[0]}</td>
              <td>{appointment.date}</td>
              <td>{appointment.package}</td>
              <td>
                <Link
                  to='#'
                  className='w-32-px h-32-px me-8 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center'
                >
                  <Icon icon='iconamoon:eye-light' />
                </Link>
                
                <Link
                  to='#'
                  className='w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center'
                >
                  <Icon icon='mingcute:delete-2-line' />
                </Link>
              </td>
            </tr>
            ))}
           
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableDataLayer;
