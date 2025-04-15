import UnitCountSix from "./child/UnitCountSix";
import LatestAppointmentsOne from "./child/LatestAppointmentsOne";

const DashBoardLayerEight = () => {
  return (
    <>
      <div className='row gy-4'>
        <div className='col-xxxl-9'>
          <div className='row gy-4'>
            {/* UnitCountSix */}
            <UnitCountSix />
            {/* LatestAppointmentsOne */}
            <LatestAppointmentsOne />
          </div>
        </div>
    
      </div>
    </>
  );
};

export default DashBoardLayerEight;
