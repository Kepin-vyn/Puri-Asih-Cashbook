<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Daily Report - Hotel Puri Asih</title>
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

        /* ===== SUMMARY BOX ===== */
        .summary-box {
            border: 2px solid #2c3e50;
            padding: 15px 20px;
            margin-bottom: 25px;
            background-color: #f8f9fa;
        }
        .summary-box h3 { font-size: 13px; margin-bottom: 10px; color: #2c3e50; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
        .summary-divider { border-top: 1px dashed #999; margin: 8px 0; }
        .summary-total { font-size: 13px; font-weight: bold; color: #2c3e50; }

        /* ===== TABLE ===== */
        .section-title { font-size: 13px; font-weight: bold; margin: 20px 0 8px 0; color: #2c3e50; border-bottom: 1px solid #2c3e50; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        thead tr { background-color: #2c3e50; color: #fff; }
        thead th { padding: 8px 10px; text-align: left; font-size: 11px; }
        tbody tr:nth-child(even) { background-color: #f5f5f5; }
        tbody td { padding: 7px 10px; font-size: 11px; border-bottom: 1px solid #ddd; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row { background-color: #e8f4f8 !important; font-weight: bold; }
        .total-row td { border-top: 2px solid #2c3e50; border-bottom: 2px solid #2c3e50; }

        /* ===== SHIFT DETAIL ===== */
        .shift-detail { margin-bottom: 20px; padding: 12px 16px; border: 1px solid #ddd; background-color: #fafafa; }
        .shift-detail h4 { font-size: 12px; color: #2c3e50; margin-bottom: 8px; }
        .shift-info-row { display: flex; margin-bottom: 3px; font-size: 11px; }
        .shift-info-label { width: 140px; font-weight: bold; }
        .shift-info-value { flex: 1; }

        /* ===== FOOTER ===== */
        .footer { margin-top: 40px; }
        .footer-print { font-size: 10px; color: #888; margin-bottom: 30px; }
        .signature-section { display: flex; justify-content: space-between; margin-top: 10px; }
        .signature-box { text-align: center; width: 200px; }
        .signature-box .signature-label { font-size: 11px; margin-bottom: 70px; }
        .signature-box .signature-name { font-size: 11px; font-weight: bold; border-top: 1px solid #333; padding-top: 4px; }
        .signature-box .signature-role { font-size: 10px; color: #555; }
    </style>
</head>
<body>

    {{-- ===== HEADER ===== --}}
    <div class="header">
        <h1>HOTEL PURI ASIH</h1>
        <h2>DAILY REPORT - {{ $tanggal }}</h2>
    </div>

    {{-- ===== RINGKASAN HARIAN ===== --}}
    <div class="summary-box">
        <h3>RINGKASAN KEUANGAN HARIAN</h3>
        <div class="summary-row">
            <span>Total Pemasukan KAS</span>
            <span>Rp {{ number_format($total_kas, 0, ',', '.') }}</span>
        </div>
        <div class="summary-row">
            <span>Total Pemasukan Reservasi</span>
            <span>Rp {{ number_format($total_reservasi, 0, ',', '.') }}</span>
        </div>
        <div class="summary-row">
            <span>Total Pengeluaran</span>
            <span>Rp {{ number_format($total_pengeluaran, 0, ',', '.') }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row summary-total">
            <span>Saldo Harian</span>
            <span>Rp {{ number_format($saldo_harian, 0, ',', '.') }}</span>
        </div>
    </div>

    {{-- ===== TABEL RINGKASAN PER SHIFT ===== --}}
    <div class="section-title">Ringkasan Per Shift</div>
    @php
        $typeLabels = ['pagi' => 'Pagi', 'siang' => 'Siang', 'malam' => 'Malam'];
    @endphp
    <table>
        <thead>
            <tr>
                <th class="text-center" style="width:35px;">No</th>
                <th>Shift</th>
                <th>Front Office</th>
                <th>Jam Mulai</th>
                <th>Jam Selesai</th>
                <th class="text-right">Pemasukan (Rp)</th>
                <th class="text-right">Pengeluaran (Rp)</th>
                <th class="text-right">Saldo (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($shift_summaries as $index => $item)
            @php
                $s = $item['shift'];
                $sum = $item['summary'];
            @endphp
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $typeLabels[$s->type] ?? $s->type }}</td>
                <td>{{ $s->user->name ?? '-' }}</td>
                <td>{{ $s->started_at ? $s->started_at->format('H:i') : '-' }}</td>
                <td>{{ $s->ended_at ? $s->ended_at->format('H:i') : 'Aktif' }}</td>
                <td class="text-right">{{ number_format($sum['total_pemasukan'], 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($sum['total_pengeluaran'], 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($sum['saldo_akhir'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="5" class="text-right">TOTAL KESELURUHAN</td>
                <td class="text-right">{{ number_format($total_pemasukan, 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($total_pengeluaran, 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($saldo_harian, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    {{-- ===== DETAIL PER SHIFT ===== --}}
    <div class="section-title">Detail Per Shift</div>
    @foreach($shift_summaries as $index => $item)
    @php
        $s = $item['shift'];
        $sum = $item['summary'];
    @endphp
    <div class="shift-detail">
        <h4>Shift {{ $typeLabels[$s->type] ?? $s->type }} — {{ $s->user->name ?? '-' }}</h4>
        <div class="shift-info-row">
            <span class="shift-info-label">Waktu</span>
            <span class="shift-info-value">: {{ $s->started_at ? $s->started_at->format('H:i') : '-' }} - {{ $s->ended_at ? $s->ended_at->format('H:i') : 'Masih berjalan' }}</span>
        </div>
        <div class="shift-info-row">
            <span class="shift-info-label">Transaksi KAS</span>
            <span class="shift-info-value">: {{ $sum['kas']['count'] }} transaksi — Rp {{ number_format($sum['kas']['total'], 0, ',', '.') }}</span>
        </div>
        <div class="shift-info-row">
            <span class="shift-info-label">Reservasi</span>
            <span class="shift-info-value">: {{ $sum['reservations']['count'] }} reservasi — Rp {{ number_format($sum['reservations']['total'], 0, ',', '.') }}</span>
        </div>
        <div class="shift-info-row">
            <span class="shift-info-label">Pengeluaran</span>
            <span class="shift-info-value">: {{ $sum['expenses']['count'] }} pengeluaran — Rp {{ number_format($sum['expenses']['total'], 0, ',', '.') }}</span>
        </div>
        <div class="shift-info-row">
            <span class="shift-info-label">Deposit Masuk</span>
            <span class="shift-info-value">: {{ $sum['deposits']['masuk']['count'] }} — Rp {{ number_format($sum['deposits']['masuk']['total'], 0, ',', '.') }}</span>
        </div>
        <div class="shift-info-row">
            <span class="shift-info-label">Deposit Keluar</span>
            <span class="shift-info-value">: {{ $sum['deposits']['keluar']['count'] }} — Rp {{ number_format($sum['deposits']['keluar']['total'], 0, ',', '.') }}</span>
        </div>
        <div class="shift-info-row" style="margin-top: 5px; font-weight: bold;">
            <span class="shift-info-label">Saldo Akhir Shift</span>
            <span class="shift-info-value">: Rp {{ number_format($sum['saldo_akhir'], 0, ',', '.') }}</span>
        </div>
    </div>
    @endforeach

    {{-- ===== FOOTER ===== --}}
    <div class="footer">
        <div class="footer-print">
            Dicetak pada: {{ now()->format('d/m/Y H:i:s') }} | Sistem Puri Asih Cashbook
        </div>
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-label">Dibuat oleh:</div>
                <div class="signature-name">___________________</div>
                <div class="signature-role">Front Office</div>
            </div>
            <div class="signature-box">
                <div class="signature-label">Diketahui:</div>
                <div class="signature-name">___________________</div>
                <div class="signature-role">Manager</div>
            </div>
        </div>
    </div>

</body>
</html>
