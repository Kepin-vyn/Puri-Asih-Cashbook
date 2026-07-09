import { Navigate } from "react-router-dom";

/**
 * /manager/laporan → redirect to /manager/monthly-report
 * MonthlyReportPage sudah memiliki UI laporan bulanan yang lengkap.
 */
const ReportPage = () => <Navigate to="/manager/monthly-report" replace />;

export default ReportPage;
