<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Pengeluaran - Hotel Puri Asih</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #333; padding: 30px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
        .header h2 { font-size: 14px; font-weight: normal; margin-top: 4px; }
        .header p  { font-size: 11px; color: #555; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        thead tr { background-color: #2c3e50; color: #fff; }
        thead th { padding: 8px 10px; text-align: left; font-size: 11px; }
        tbody tr:nth-child(even) { background-color: #f5f5f5; }
        tbody td { padding: 7px 10px; font-size: 11px; border-bottom: 1px solid #ddd; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row { background-color: #f8e8e8 !important; font-weight: bold; }
        .total-row td { border-top: 2px solid #2c3e50; border-bottom: 2px solid #2c3e50; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
        .footer-left { font-size: 10px; color: #888; }
        .signature-box { text-align: center; width: 180px; }
        .signature-box .signature-name { font-size: 11px; font-weight: bold; margin-top: 60px; border-top: 1px solid #333; padding-top: 4px; }
        .signature-box .signature-label { font-size: 10px; color: #555; }
        .status-badge { padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .status-auto_approved { background-color: #d1fae5; color: #065f46; }
        .status-approved { background-color: #d1fae5; color: #065f46; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-rejected { background-color: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>

    <div class="header">
        <h1>HOTEL PURI ASIH</h1>
        <h2>Laporan Pengeluaran</h2>
        <p>
            @if($date_from && $date_to)
                Periode: {{ \Carbon\Carbon::parse($date_from)->format('d/m/Y') }} s/d {{ \Carbon\Carbon::parse($date_to)->format('d/m/Y') }}
            @else
                Semua Periode
            @endif
        </p>
    </div>

    @if(count($expenses) > 0)
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:35px;">No</th>
                    <th>Deskripsi</th>
                    <th>Staff</th>
                    <th>Metode</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th class="text-right">Total (Rp)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($expenses as $index => $exp)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $exp->description }}</td>
                    <td>{{ $exp->user->name ?? '-' }}</td>
                    <td>{{ ucfirst(str_replace('_', ' ', $exp->payment_method)) }}</td>
                    <td class="text-center">
                        <span class="status-badge status-{{ $exp->status }}">
                            {{ $exp->status == 'auto_approved' ? 'Auto Approved' : ucfirst($exp->status) }}
                        </span>
                    </td>
                    <td>{{ \Carbon\Carbon::parse($exp->created_at)->format('d/m/Y') }}</td>
                    <td class="text-right">{{ number_format($exp->total_price, 0, ',', '.') }}</td>
                </tr>
                @endforeach

                <tr class="total-row">
                    <td colspan="6" class="text-right">TOTAL PENGELUARAN (Hanya Disetujui)</td>
                    <td class="text-right">{{ number_format($total_amount, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>
    @else
        <p style="text-align: center; padding: 30px; color: #888;">Tidak ada data pengeluaran.</p>
    @endif

    <div class="footer">
        <div class="footer-left">
            <p>Dicetak oleh sistem Puri Asih Cashbook</p>
            <p>{{ now()->format('d/m/Y H:i:s') }}</p>
        </div>
        <div class="signature-box">
            <div class="signature-name">Manager</div>
        </div>
    </div>

</body>
</html>
