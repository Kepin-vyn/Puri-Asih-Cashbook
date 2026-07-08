import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, RotateCcw, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import roomRateService from "../../services/roomRateService";

const RoomRatePage = () => {
  const queryClient = useQueryClient();
  const [rates, setRates] = useState({});
  const [bulkPrice, setBulkPrice] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all room rates
  const { data, isLoading } = useQuery({
    queryKey: ["room-rates"],
    queryFn: async () => {
      const res = await roomRateService.getAll();
      const map = {};
      (res.data ?? []).forEach((r) => {
        map[r.room_number] = Number(r.price_per_night);
      });
      setRates(map);
      return res;
    },
  });

  // Bulk update mutation
  const bulkMutation = useMutation({
    mutationFn: roomRateService.bulkUpdate,
    onSuccess: (_res) => {
      toast.success("Tarif kamar berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ["room-rates"] });
      setHasChanges(false);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? "Gagal menyimpan tarif."),
  });

  const handleRateChange = (roomNumber, value) => {
    const num = parseInt(value.replace(/\D/g, ""), 10) || 0;
    setRates((prev) => ({ ...prev, [roomNumber]: num }));
    setHasChanges(true);
  };

  const handleBulkApply = () => {
    const num = parseInt(bulkPrice.replace(/\D/g, ""), 10) || 0;
    if (num <= 0) {
      toast.error("Masukkan harga yang valid.");
      return;
    }
    const newRates = { ...rates };
    Object.keys(newRates).forEach((room) => {
      newRates[room] = num;
    });
    setRates(newRates);
    setBulkPrice("");
    setHasChanges(true);
    toast.success(`Harga Rp ${num.toLocaleString("id-ID")} diterapkan ke semua kamar.`);
  };

  const handleSave = () => {
    const payload = Object.entries(rates).map(([room_number, price_per_night]) => ({
      room_number,
      price_per_night,
    }));
    bulkMutation.mutate(payload);
  };

  const handleReset = () => {
    const map = {};
    (data?.data ?? []).forEach((r) => {
      map[r.room_number] = Number(r.price_per_night);
    });
    setRates(map);
    setHasChanges(false);
  };

  // Group rooms by floor
  const floors = {
    "Lantai 1": Object.keys(rates).filter((r) => r.startsWith("1")),
    "Lantai 2": Object.keys(rates).filter((r) => r.startsWith("2")),
    "Lantai 3": Object.keys(rates).filter((r) => r.startsWith("3")),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Tarif Kamar</h1>
          <p className="text-sm text-[#737373] mt-0.5">
            Atur harga per malam untuk setiap kamar. Harga ini akan otomatis digunakan saat staff membuat reservasi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-[#525252] bg-white border border-[#e5e5e5] hover:bg-[#fafafa] px-3 py-2.5 rounded-xl transition-colors "
            >
              <RotateCcw size={15} />
              Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || bulkMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white bg-black hover:bg-[#090909] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all "
          >
            <Save size={15} />
            {bulkMutation.isPending ? "Menyimpan..." : "Simpan Semua"}
          </button>
        </div>
      </div>

      {/* Bulk apply */}
      <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Building2 size={20} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-800">Terapkan Harga Seragam</p>
          <p className="text-xs text-black">Masukkan harga dan terapkan ke semua kamar sekaligus.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={bulkPrice ? `Rp ${Number(bulkPrice).toLocaleString("id-ID")}` : ""}
            onChange={(e) => setBulkPrice(e.target.value.replace(/\D/g, ""))}
            placeholder="Rp 350.000"
            className="w-44 px-3 py-2 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none  focus:ring-blue-400 bg-white"
          />
          <button
            onClick={handleBulkApply}
            className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-[#090909] rounded-xl transition-colors"
          >
            Terapkan
          </button>
        </div>
      </div>

      {/* Room rate grid */}
      {isLoading ? (
        <div className="text-center py-16 text-[#a3a3a3]">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Memuat tarif kamar...</p>
        </div>
      ) : (
        Object.entries(floors).map(([floorName, rooms]) => (
          <div key={floorName} className="bg-white rounded-xl  border border-[#e5e5e5]">
            <div className="p-5 border-b border-[#e5e5e5]">
              <h2 className="font-semibold text-black">{floorName}</h2>
              <p className="text-xs text-[#737373] mt-0.5">{rooms.length} kamar</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {rooms.map((room) => (
                  <div key={room} className="border border-[#e5e5e5] rounded-xl p-3 hover:border-blue-300 transition-colors">
                    <p className="text-xs font-bold text-[#737373] mb-2 text-center">Kamar {room}</p>
                    <input
                      type="text"
                      value={rates[room] ? rates[room].toLocaleString("id-ID") : "0"}
                      onChange={(e) => handleRateChange(room, e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#e5e5e5] rounded-lg text-sm text-center font-semibold focus:outline-none  focus:ring-blue-400"
                    />
                    <p className="text-[10px] text-[#a3a3a3] text-center mt-1">/ malam</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Unsaved changes bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-50 border-t border-amber-200 px-6 py-3 flex items-center justify-between z-40">
          <p className="text-sm text-amber-800">
            Ada perubahan yang belum disimpan.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-[#525252] bg-white border border-[#e5e5e5] hover:bg-[#fafafa] rounded-xl transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={bulkMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-[#090909] rounded-xl transition-colors flex items-center gap-2"
            >
              <Save size={14} />
              {bulkMutation.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomRatePage;
