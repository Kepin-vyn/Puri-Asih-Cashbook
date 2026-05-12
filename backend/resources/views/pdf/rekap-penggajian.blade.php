<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Rekap Penggajian {{ $period }} - Hotel Puri Asih</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #222;
            padding: 28px 32px;
        }

        /* ===== HEADER ===== */
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 14px;
            border-bottom: 2px solid #1a2e4a;
        }
        .header h1 { font-size: 17px; font-weight: bold; letter-spacing: 1.5px; color: #1a2e4a; }
        .header h2 { font-size: 13px; font-weight: bold; margin-top: 3px; color: #333; }
        .header .period { font-size: 11px; color: #555; margin-top: 3px; }

        /* ===== TABLE ===== */
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        thead tr { background-color: #1a2e4a; color: #fff; }
        thead th { padding: 8px 10px; text-align: left; font-size: 10px; }
        tbody tr:nth-child(even) { background-color: #f5f7fa; }
        tbody td { padding: 7px 10px; font-size: 10px; border-bottom: 1px solid #e0e0e0; }
        .text-right  { text-align: right; }
        .text-center { text-align: center; }

        /* ===== TOTAL ROW ===== */
        .total-row td {
            background-color: #1a2e4a !important;
            color: #fff;
            font-weight: bold;
            font-size: 11px;
            border-top: 2px solid #1a2e4a;
        }

        /* ===== SUMMARY BOX ===== */
        .summary-box {
            margin-top: 20px;
            border: 1px solid #ddd;
            padding: 12px 16px;
            background-color: #f9f9f9;
            width: 320px;
            margin-left: auto;
        }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 11px; }
        .summary-total { font-size: 13px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 6px; margin-top: 4px; }

        /* ===== FOOTER ===== */
        .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 14px; }
        .footer-meta { font-size: 9px; color: #888; margin-bottom: 20px; }
        .signature-row { display: flex; justify-content: flex-end; }
        .signature-box { text-align: center; width: 200px; }
        .sig-label { font-size: 10px; color: #555; }
        .sig-line { margin-top: 55px; border-top: 1px solid #333; padding-top: 4px; }
        .sig-name { font-size: 10px; font-weight: bold; }
        .sig-role { font-size: 9px; color: #777; }
    </style>
</head>
<body>

{{-- ===== HEADER ===== --}}
<div class="header">
    <h1>HOTEL PURI ASIH</h1>
    <h2>REKAP PENGGAJIAN BULAN {{ strtoupper($period) }}</h2>
    <div class="period">Periode: {{ $period }}</div>
</div>

{{-- ===== TABEL REKAP ===== --}}
@if(count($payrolls) > 0)
<table>
    <thead>
        <tr>
            <th class="text-center" style="width:30px;">No</th>
            <th>Nama Staff</th>
            <th style="width:70px;">Shift</th>
            <th class="text-center" style="width:50px;">Hadir</th>
            <th class="text-center" style="width:50px;">Libur</th>
            <th class="text-center" style="width:50px;">Alpha</th>
            <th class="text-center" style="width:60px;">Hari Bayar</th>
            <th class="text-right" style="width:110px;">Total Gaji (Rp)</th>
        </tr>
    </thead>
    <tbody>
        @foreach($payrolls as $i => $payroll)
        <tr>
            <td class="text-center">{{ $i + 1 }}</td>
            <td>{{ $payroll->user->name ?? '-' }}</td>
            <td>{{ ucfirst($payroll->user->shift ?? '-') }}</td>
            <td class="text-center">{{ $payroll->total_present - min($payroll->total_leave, 6) }}</td>
            <td class="text-center">{{ $payroll->total_leave }}</td>
            <td class="text-center">{{ $payroll->total_absent }}</td>
            <td class="text-center">{{ $payroll->total_present }}</td>
            <td class="text-right">{{ number_format($payroll->total_salary, 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr class="total-row">
            <td colspan="7" class="text-right">TOTAL PENGELUARAN GAJI</td>
            <td class="text-right">{{ number_format($total_gaji, 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>

<div class="summary-box">
    <div class="summary-row">
        <span>Jumlah Staff</span>
        <span>{{ count($payrolls) }} orang</span>
    </div>
    <div class="summary-row summary-total">
        <span>Total Pengeluaran Gaji</span>
        <span>Rp {{ number_format($total_gaji, 0, ',', '.') }}</span>
    </div>
</div>
@else
<p style="text-align:center; padding:30px; color:#999; font-style:italic;">
    Tidak ada data payroll untuk periode ini.
</p>
@endif

{{-- ===== FOOTER ===== --}}
<div class="footer">
    <div class="footer-meta">
        Dicetak oleh sistem Puri Asih Cashbook pada {{ $generated_at }}
    </div>
    <div class="signature-row">
        <div class="signature-box">
            <div class="sig-label">Manager Hotel Puri Asih</div>
            <div class="sig-line">
                <div class="sig-name">( ________________________ )</div>
                <div class="sig-role">Manager</div>
            </div>
        </div>
    </div>
</div>

</body>
</html>
