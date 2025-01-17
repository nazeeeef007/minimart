import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';

interface AuditLog {
  _id: string;
  actionType: string;
  actionCategory: string;
  description: string;
  userId: string;
  timestamp: string;
  metadata: any;
  changeDetails: any;
  ipAddress: string;
  sessionId: string;
  status: string;
}

const ClipboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="size-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
    />
  </svg>
);

const DownloadButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
</svg>

)

const AuditLog: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showModal) {
      fetchAuditLogs();
    }
  }, [showModal]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/auditLogs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('API Response:', response.data);
      if (Array.isArray(response.data)) {
        setLogs(response.data);
      } else if (response.data.auditLogs) {
        setLogs(response.data.auditLogs);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setShowModal(false);

  const downloadExcel = () => {
    if (logs.length === 0) {
      alert('No logs available to download.');
      return;
    }
  
    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(logs);
    const workbook = XLSX.utils.book_new();
  
    // Add formatting: Adjust column widths
    const columnWidths = Object.keys(logs[0] || {}).map(() => ({ wch: 50 })); // Default width for all columns
    worksheet['!cols'] = columnWidths;
  
    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AuditLogs');
  
    // Save the workbook as a file
    XLSX.writeFile(workbook, 'AuditLogs.xlsx');
  };
  

  return (
    <>
      <button
        className="bg-blue-600 text-white hover:bg-blue-700 border border-transparent py-1 px-3 rounded-lg shadow-md focus:outline-none flex items-center"
        onClick={() => setShowModal(true)}
        title="Audit Logs"
      >
        <ClipboardIcon />
      </button>

      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <div
            className="fixed inset-0 bg-black opacity-50 z-40"
            aria-hidden="true"
          ></div>

          <DialogContent
            className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl overflow-auto max-h-[80vh] z-50"
          >
            <div className="flex items-center  mb-1 space-x-3">
            <DialogTitle className="text-2xl font-semibold text-gray-800">
              Audit Logs
            </DialogTitle>

            <button
              className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded-lg"
              onClick={downloadExcel}
              title="Download Logs"
            >
              <DownloadButton />
            </button>
          </div>


            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-t-transparent border-gray-500 rounded-full"></div>
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <div className="space-y-4">
                {logs.length > 0 ? (
                  <ul className="space-y-4">
                    {logs.map((log) => (
                      <li
                        key={log._id}
                        className="border p-4 rounded-lg shadow-sm bg-gray-50 hover:bg-gray-100 transition"
                      >
                        <div>
                          <strong className="text-lg text-gray-900">
                            {log.actionType}
                          </strong>
                          <p className="text-sm text-gray-800">
                            Category: {log.actionCategory}
                          </p>
                          <p className="text-sm text-gray-800">
                            Description: {log.description}
                          </p>
                          <p className="text-sm text-gray-800">Status: {log.status}</p>
                          <p className="text-sm text-gray-800">
                            IP Address: {log.ipAddress}
                          </p>
                          <p className="text-sm text-gray-800">
                            Session ID: {log.sessionId}
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            <small>{new Date(log.timestamp).toLocaleString()}</small>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-800">No audit logs found.</p>
                )}
              </div>
            )}

            <DialogFooter className="mt-4 flex justify-between space-x-2">
              <button
                className="bg-red-500 hover:bg-gray-400 text-black py-2 px-4 rounded-lg"
                onClick={handleClose}
              >
                Close
              </button>
              
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AuditLog;
