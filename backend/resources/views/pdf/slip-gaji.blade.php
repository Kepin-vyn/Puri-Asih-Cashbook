<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Slip Gaji - {{ $staff->name }} - {{ $period }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #222;
            padding: 40px 50px;
        }

        /* ===== HEADER ===== */
        .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #1a2e4a;
        }
        .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 1.5px; color: #1a2e4a; }
        .header h2 { font-size: 14px; font-weight: bold; margin-top: 4px; color: #333; }
        .header .period { font-size: 12px; color: #555; margin-top: 3px; }

        /* ===== SECTION TITLE ===== */
        .section-title {
            font-size: 11px;
            font-weight: bold;
            background-color: #1a2e4a;
            color: #fff;
            padding: 6px 10px;
            margin-top: 20px;
            margin-bottom: 0;
        }

        /* ===== DATA TABLE ===== */
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table td {
            padding: 7px 10px;
            border: 1px solid #ddd;
            font-size: 11px;
        }
        .data-table .label { width: 50%; background-color: #f5f7fa; font-weight: bold; }
        .data-table .value { width: 50%; }
        .data-table .value-right { text-align: right; font-weight: bold; }
        .data-table .total-row td {
            background-color: #1a2e4a;
            color: #fff;
            font-weight: bold;
            font-size: 13px;
        }
        .data-table .separator td {
            background-color: #e8edf3;
            border-top: 2px solid #1a2e4a;
        }

        /* ===== FOOTER ===== */
        .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box { text-align: center; width: 200px; }
        .signature-box .sig-label { font-size: 11px; color: #555; margin-bottom: 4px; }
        .signature-box .sig-line {
            margin-top: 60px;
            border-top: 1px solid #333;
            padding-top: 5px;
        }
        .signature-box .sig-name { font-size: 11px; font-weight: bold; }
        .signature-box .sig-role { font-size: 10px; color: #777; }

        .generated { font-size: 9px; color: #aaa; text-align: center; margin-top: 30px; }
    </style>
</head>
<body>

{{-- ===== HEADER ===== --}}
<div class="header">
    <h1>HOTEL PURI ASIH</h1>
    <h2>SLIP GAJI</h2>
    <div class="period">Periode: {{ $period }}</div>
</div>

{{-- ===== DATA KARYAWAN ===== --}}
<div class="section-title">DATA KARYAWAN</div>
<table class="data-table">
    <tr>
        <td class="label">Nama</td>
        <td class="value">{{ $staff->name }}</td>
    </tr>
    <tr>
        <td class="label">Jabatan</td>
        <td class="value">Front Office</td>
    </tr>
    <tr>
        <td class="label">Shift</td>
        <td class="value">{{ ucfirst($staff->shift ?? '-') }}</td>
    </tr>
    <tr>
        <td class="label">Periode</td>
        <td class="value">{{ $period }}</td>
    </tr>
</table>

{{-- ===== RINCIAN KEHADIRAN ===== --}}
<div class="section-title">RINCIAN KEHADIRAN</div>
<table class="data-table">
    <tr>
        <td class="label">Total Hari Hadir</td>
        <td class="value">{{ $attendance['total_hadir'] }} hari</td>
    </tr>
    <tr>
        <td class="label">Total Hari Libur</td>
        <td class="value">{{ $attendance['total_libur'] }} hari</td>
    </tr>
    <tr>
        <td class="label">Total Hari Sakit</td>
        <td class="value">{{ $attendance['total_sakit'] }} hari</td>
    </tr>
    <tr>
        <td class="label">Total Hari Izin</td>
        <td class="value">{{ $attendance['total_izin'] }} hari</td>
    </tr>
    <tr>
        <td class="label">Total Hari Alpha</td>
        <td class="value">{{ $attendance['total_alpha'] }} hari</td>
    </tr>
    <tr class="separator">
        <td class="label">Libur Dihitung (maks. 6 hari)</td>
        <td class="value">{{ $attendance['libur_dibayar'] }} hari</td>
    </tr>
    <tr>
        <td class="label" style="font-weight:bold; background-color:#e8edf3;">Hari Dihitung untuk Pembayaran</td>
        <td class="value" style="font-weight:bold; background-color:#e8edf3;">{{ $attendance['hari_bayar'] }} hari</td>
    </tr>
</table>

{{-- ===== RINCIAN GAJI ===== --}}
<div class="section-title">RINCIAN GAJI</div>
<table class="data-table">
    <tr>
        <td class="label">Gaji Harian</td>
        <td class="value-right">Rp {{ number_format($payroll->daily_rate, 0, ',', '.') }}</td>
    </tr>
    <tr>
        <td class="label">Hari Dibayar</td>
        <td class="value-right">{{ $payroll->total_present }} hari</td>
    </tr>
    <tr class="total-row">
        <td>TOTAL GAJI</td>
        <td class="value-right">Rp {{ number_format($payroll->total_salary, 0, ',', '.') }}</td>
    </tr>
</table>

{{-- ===== FOOTER ===== --}}
<div class="footer">
    <div class="signature-box">
        <div class="sig-label">Diterima oleh:</div>
        <div class="sig-line">
            <div class="sig-name">{{ $staff->name }}</div>
            <div class="sig-role">Front Office</div>
        </div>
    </div>
    <div class="signature-box">
        <div class="sig-label">Disetujui oleh:</div>
        <div class="sig-line">
            <div class="sig-name">( ________________________ )</div>
            <div class="sig-role">Manager Hotel Puri Asih</div>
        </div>
    </div>
</div>

<div class="generated">
    Dicetak oleh sistem Puri Asih Cashbook pada {{ $generated_at }}
</div>

</body>
</html>
