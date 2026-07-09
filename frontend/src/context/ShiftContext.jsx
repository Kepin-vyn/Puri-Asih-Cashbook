import { createContext, useContext, useState, useCallback } from "react";

const ShiftContext = createContext(null);

/**
 * ShiftProvider — Context global untuk status shift aktif FO.
 * Memungkinkan semua halaman FO mengetahui perubahan shift
 * tanpa harus menunggu React Query refetch.
 */
export const ShiftProvider = ({ children }) => {
  // null = belum diketahui, true = ada shift aktif, false = tidak ada
  const [shiftStatus, setShiftStatus] = useState(null);

  const markShiftStarted = useCallback(() => {
    setShiftStatus(true);
  }, []);

  const markShiftEnded = useCallback(() => {
    setShiftStatus(false);
  }, []);

  const resetShiftStatus = useCallback(() => {
    setShiftStatus(null);
  }, []);

  return (
    <ShiftContext.Provider
      value={{
        shiftStatus,
        markShiftStarted,
        markShiftEnded,
        resetShiftStatus,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export const useShiftContext = () => {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error("useShiftContext harus digunakan di dalam ShiftProvider");
  }
  return context;
};
