<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan KAS Harian - Hotel Puri Asih</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #333;
            padding: 30px;
        }

        /* ===== HEADER ===== */
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
        .header h2 { font-size: 14px; font-weight: normal; margin-top: 4px; }
        .header p  { font-size: 11px; color: #555; margin-top: 2px; }

        /* ===== INFO SECTION ===== */
        .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-box { width: 48%; }
        .info-row { display: flex; margin-bottom: 4px; font-size: 11px; }
        .info-label { width: 110px; font-weight: bold; }
        .info-value { flex: 1; }

        /* ===== TABLE ===== */
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        thead tr { background-color: #2c3e50; color: #fff; }
        thead th { padding: 8px 10px; text-align: left; font-size: 11px; }
        tbody tr:nth-child(even) { background-color: #f5f5f5; }
        tbody td { padding: 7px 10px; font-size: 11px; border-bottom: 1px solid #ddd; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* ===== TOTAL ROW ===== */
        .total-row { background-color: #e8f4f8 !important; font-weight: bold; }
        .total-row td { border-top: 2px solid #2c3e50; border-bottom: 2px solid #2c3e50; }

        /* ===== SUMMARY BOX ===== */
        .summary-box {
            border: 1px solid #ddd;
            padding: 12px 16px;
            margin-bottom: 30px;
            background-color: #f9f9f9;
            width: 300px;
            margin-left: auto;
        }
        .summary-box .summary-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .summary-box .summary-total { font-size: 13px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 6px; margin-top: 4px; }

        /* ===== FOOTER ===== */
        .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
        .footer-left { font-size: 10px; color: #888; }
        .signature-box { text-align: center; width: 180px; }
        .signature-box .signature-name { font-size: 11px; font-weight: bold; margin-top: 60px; border-top: 1px solid #333; padding-top: 4px; }
        .signature-box .signature-label { font-size: 10px; color: #555; }

        /* ===== NO DATA ===== */
        .no-data { text-align: center; padding: 30px; color: #888; font-style: italic; }
    </style>
</head>
<body>

    {{-- ===== HEADER ===== --}}
    <div class="header">
        <h1>HOTEL PURI ASIH</h1>
        <h2>Laporan KAS Harian</h2>
        <p>
            @if($date_from && $date_to)
                Periode: {{ \Carbon\Carbon::parse($date_from)->format('d/m/Y') }}
                s/d {{ \Carbon\Carbon::parse($date_to)->format('d/m/Y') }}
            @else
                Semua Periode
            @endif
        </p>
    </div>

    {{-- ===== INFO SECTION ===== --}}
    <div class="info-section">
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Staff</span>
                <span class="info-value">: {{ $staff_name ?? 'Semua Staff' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Shift</span>
                <span class="info-value">: {{ $shift_label ?? 'Semua Shift' }}</span>
            </div>
        </div>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Tanggal Cetak</span>
                <span class="info-value">: {{ now()->format('d/m/Y H:i') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Total Transaksi</span>
                <span class="info-value">: {{ count($transactions) }} transaksi</span>
            </div>
        </div>
    </div>

    {{-- ===== TABEL TRANSAKSI ===== --}}
    @if(count($transactions) > 0)
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:35px;">No</th>
                    <th>Nama Tamu</th>
                    <th>No Kamar</th>
                    <th>Jenis Transaksi</th>
                    <th>Metode Bayar</th>
                    <th>Tanggal</th>
                    <th class="text-right">Jumlah (Rp)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($transactions as $index => $trx)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $trx->guest_name }}</td>
                    <td class="text-center">{{ $trx->room_number ?? '-' }}</td>
                    <td>
                        @php
                            $typeLabels = ['reservasi' => 'Reservasi', 'checkin' => 'Check-In', 'pelunasan' => 'Pelunasan'];
                        @endphp
                        {{ $typeLabels[$trx->transaction_type] ?? $trx->transaction_type }}
                    </td>
                    <td>
                        @php
                            $methodLabels = ['tunai' => 'Tunai', 'transfer' => 'Transfer', 'qris' => 'QRIS', 'kartu_kredit' => 'Kartu Kredit'];
                        @endphp
                        {{ $methodLabels[$trx->payment_method] ?? $trx->payment_method }}
                    </td>
                    <td>{{ \Carbon\Carbon::parse($trx->created_at)->format('d/m/Y') }}</td>
                    <td class="text-right">{{ number_format($trx->amount, 0, ',', '.') }}</td>
                </tr>
                @endforeach

                {{-- Total Row --}}
                <tr class="total-row">
                    <td colspan="6" class="text-right">TOTAL PEMASUKAN</td>
                    <td class="text-right">{{ number_format($total_amount, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

        {{-- Summary Box --}}
        <div class="summary-box">
            <div class="summary-row summary-total">
                <span>Total Pemasukan KAS</span>
                <span>Rp {{ number_format($total_amount, 0, ',', '.') }}</span>
            </div>
        </div>
    @else
        <p class="no-data">Tidak ada data transaksi untuk periode yang dipilih.</p>
    @endif

    {{-- ===== FOOTER ===== --}}
    <div class="footer">
        <div class="footer-left">
            <p>Dicetak oleh sistem Puri Asih Cashbook</p>
            <p>{{ now()->format('d/m/Y H:i:s') }}</p>
        </div>
        <div class="signature-box">
            <div class="signature-name">{{ $staff_name ?? '___________________' }}</div>
            <div class="signature-label">Staff / Manager</div>
        </div>
    </div>

</body>
</html>
