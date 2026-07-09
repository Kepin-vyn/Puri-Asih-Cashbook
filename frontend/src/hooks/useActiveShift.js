import { useQuery } from "@tanstack/react-query";
import { useShiftContext } from "../context/ShiftContext";
import { QUERY_KEYS } from "../utils/queryKeys";
import shiftService from "../services/shiftService";

/**
 * useActiveShift — Hook terpusat untuk cek status shift aktif.
 * Menggabungkan React Query dengan ShiftContext untuk deteksi
 * yang cepat dan akurat tanpa refresh manual.
 *
 * Returns:
 *   hasActiveShift : boolean — ada shift aktif
 *   hasNoShift     : boolean — tidak ada shift aktif
 *   activeShift    : object | null — data shift aktif
 *   isLoading      : boolean
 */
export const useActiveShift = () => {
  const { shiftStatus } = useShiftContext();

  const { data: activeShiftData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.activeShift,
    queryFn:  shiftService.getActive,
    retry:    false,
    // Jika context sudah tahu ada shift, staleTime lebih panjang
    staleTime: shiftStatus === true
      ? 5 * 60 * 1000  // 5 menit jika sudah tahu ada shift
      : 1 * 60 * 1000, // 1 menit jika belum tahu
  });

  // Prioritas: context > query result
  const hasActiveShift =
    shiftStatus !== null
      ? shiftStatus
      : !!(activeShiftData?.data);

  return {
    hasActiveShift,
    hasNoShift:  !hasActiveShift,
    activeShift: activeShiftData?.data ?? null,
    isLoading,
  };
};
