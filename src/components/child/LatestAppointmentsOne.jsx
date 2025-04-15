import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from '../../supabaseClient'
import $ from "jquery";
import "datatables.net-dt";

const LatestAppointmentsOne = () => {

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
    <div className='col-xxl-8'>
      <div className='card h-100'>
        <div className='card-header border-bottom bg-base py-16 px-24 d-flex align-items-center justify-content-between'>
          <h6 className='text-lg fw-semibold mb-0'>Latest Appointments</h6>
          <Link
            to='/admin-appointments'
            className='text-primary-600 hover-text-primary d-flex align-items-center gap-1'
          >
            View All
            <iconify-icon
              icon='solar:alt-arrow-right-linear'
              className='icon'
            />
          </Link>
        </div>
        <div className='card-body p-0'>
          <div className='table-responsive scroll-sm'>
            <table className='table bordered-table mb-0 rounded-0 border-0'>
              <thead>
                <tr>
                  <th scope='col' className='bg-transparent rounded-0'>
                    Name
                  </th>
                  <th scope='col' className='bg-transparent rounded-0'>
                    ID
                  </th>
                  <th scope='col' className='bg-transparent rounded-0'>
                    Date
                  </th>
          
                </tr>
              </thead>
              <tbody>
               {appointments.map((element,index)=>(
                 <tr key={index}>
                 <td>{element.name}</td>
                 <td>{element.email}</td>
                 <td>{element.phone}</td>
                
               </tr>
               ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestAppointmentsOne;
