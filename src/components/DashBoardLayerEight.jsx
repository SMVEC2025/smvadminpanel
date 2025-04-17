import UnitCountSix from "./child/UnitCountSix";
import LatestAppointmentsOne from "./child/LatestAppointmentsOne";
import { useEffect } from "react";
const DashBoardLayerEight = () => {
  useEffect(() => {
    const notify = async () => {
      let permission = await isPermissionGranted();
      if (!permission) {
        const req = await requestPermission();
        permission = req === "granted";
      }

      if (permission) {
        sendNotification({
          title: "SMV Admin Panel",
          body: "New appointment scheduled ✅",
        });
      }
    };

    notify();
  }, []);
    
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
