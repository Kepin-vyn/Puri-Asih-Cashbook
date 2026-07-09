<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Pengeluaran Operasional - Hotel Puri Asih</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #1a1a1a;
            padding: 28px 32px;
        }

        /* ===== HEADER ===== */
        .header {
            text-align: center;
            margin-bottom: 18px;
            border-bottom: 2px solid #1a1a1a;
            padding-bottom: 14px;
        }
        .header h1 {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .header h2 {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p {
            font-size: 11px;
            color: #555;
            margin-top: 3px;
        }

        /* ===== INFO SECTION ===== */
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
            font-size: 11px;
        }
        .info-row { margin-bottom: 3px; }
        .info-label { font-weight: bold; display: inline-block; width: 100px; }

        /* ===== TABLE ===== */
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        thead tr { background-color: #2E74B5; color: #ffffff; }
        thead th {
            padding: 8px 9px;
            text-align: left;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        tbody tr:nth-child(even) { background-color: #F5F9FF; }
        tbody tr:nth-child(odd)  { background-color: #ffffff; }
        tbody td {
            padding: 6px 9px;
            font-size: 11px;
            border-bottom: 1px solid #dde4f0;
            vertical-align: top;
        }
        .text-right  { text-align: right; }
        .text-center { text-align: center; }

        /* ===== STATUS TEXT ===== */
        .status-auto_approved { color: #065f46; font-weight: bold; }
        .status-approved      { color: #1d4ed8; font-weight: bold; }
        .status-pending       { color: #92400e; font-weight: bold; }
        .status-rejected      { color: #991b1b; font-weight: bold; }

        /* ===== RINGKASAN ===== */
        .summary-section {
            margin-top: 8px;
            margin-bottom: 24px;
            margin-left: auto;
            width: 340px;
            border: 1px solid #dde4f0;
            border-radius: 4px;
            overflow: hidden;
        }
        .summary-title {
            background-color: #2E74B5;
            color: #fff;
            font-size: 11px;
            font-weight: bold;
            padding: 6px 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-body { padding: 10px 12px; }
        .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 5px;
        }
        .summary-row .label { color: #555; }
        .summary-row .count { color: #888; font-size: 10px; margin-left: 4px; }
        .summary-divider {
            border: none;
            border-top: 1px solid #dde4f0;
            margin: 8px 0;
        }
        .summary-total {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            font-weight: bold;
            color: #1a1a1a;
        }

        /* ===== FOOTER ===== */
        .footer {
            margin-top: 28px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px solid #dde4f0;
            padding-top: 14px;
        }
        .footer-left { font-size: 10px; color: #888; line-height: 1.6; }
        .signature-box { text-align: center; width: 180px; }
        .signature-space { height: 56px; }
        .signature-line {
            border-top: 1px solid #333;
            padding-top: 4px;
            font-size: 11px;
            font-weight: bold;
        }
        .signature-label { font-size: 10px; color: #555; margin-top: 2px; }

        /* ===== NO DATA ===== */
        .no-data {
            text-align: center;
            padding: 40px;
            color: #888;
            font-style: italic;
            font-size: 12px;
        }
    </style>
</head>
<body>

    {{-- ===== HEADER ===== --}}
    <div class="header">
        <h1>HOTEL PURI ASIH</h1>
        <h2>Laporan Pengeluaran Operasional</h2>
        <p>
            @if(!empty($date_from) && !empty($date_to))
                Periode: {{ \Carbon\Carbon::parse($date_from)->format('d/m/Y') }}
                s/d {{ \Carbon\Carbon::parse($date_to)->format('d/m/Y') }}
            @else
                Semua Periode
            @endif
        </p>
    </div>

    {{-- ===== INFO SECTION ===== --}}
    <div class="info-section">
        <div>
            <div class="info-row">
                <span class="info-label">Staff</span>
                <span>: {{ $staff_name ?? 'Semua Staff' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Total Data</span>
                <span>: {{ count($expenses) }} pengeluaran</span>
            </div>
        </div>
        <div style="text-align: right;">
            <div class="info-row">Dicetak: {{ now()->format('d/m/Y H:i') }}</div>
            <div class="info-row" style="color: #888;">Puri Asih Cashbook</div>
        </div>
    </div>

    {{-- ===== TABEL PENGELUARAN ===== --}}
    @if(count($expenses) > 0)
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width: 28px;">No</th>
                    <th style="width: 68px;">Tanggal</th>
                    <th style="width: 50px;">Shift</th>
                    <th style="width: 90px;">FO</th>
                    <th>Keterangan</th>
                    <th class="text-center" style="width: 30px;">Qty</th>
                    <th class="text-right" style="width: 80px;">Harga/Item</th>
                    <th class="text-right" style="width: 85px;">Total (Rp)</th>
                    <th class="text-center" style="width: 80px;">Status</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $shiftLabels  = ['pagi' => 'Pagi', 'siang' => 'Siang', 'malam' => 'Malam'];
                    $statusLabels = [
                        'auto_approved' => 'Auto Disetujui',
                        'approved'      => 'Disetujui Manager',
                        'pending'       => 'Menunggu',
                        'rejected'      => 'Ditolak',
                    ];
                @endphp

                @foreach($expenses as $index => $exp)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ \Carbon\Carbon::parse($exp->created_at)->format('d/m/Y') }}</td>
                    <td class="text-center">
                        {{ $shiftLabels[$exp->shift->type ?? ''] ?? '-' }}
                    </td>
                    <td>{{ $exp->user->name ?? '-' }}</td>
                    <td>{{ $exp->description }}</td>
                    <td class="text-center">{{ $exp->quantity }}</td>
                    <td class="text-right">{{ number_format($exp->price_per_item, 0, ',', '.') }}</td>
                    <td class="text-right">{{ number_format($exp->total_price, 0, ',', '.') }}</td>
                    <td class="text-center">
                        <span class="status-{{ $exp->status }}">
                            {{ $statusLabels[$exp->status] ?? $exp->status }}
                        </span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

        {{-- ===== RINGKASAN ===== --}}
        @php
            $autoApproved = $expenses->where('status', 'auto_approved');
            $approved     = $expenses->where('status', 'approved');
            $rejected     = $expenses->where('status', 'rejected');
            $pending      = $expenses->where('status', 'pending');
            $totalAktif   = $autoApproved->sum('total_price') + $approved->sum('total_price');
        @endphp

        <div class="summary-section">
            <div class="summary-title">Ringkasan Pengeluaran</div>
            <div class="summary-body">
                <div class="summary-row">
                    <span class="label">
                        Auto Disetujui
                        <span class="count">({{ $autoApproved->count() }} item)</span>
                    </span>
                    <span>Rp {{ number_format($autoApproved->sum('total_price'), 0, ',', '.') }}</span>
                </div>
                <div class="summary-row">
                    <span class="label">
                        Disetujui Manager
                        <span class="count">({{ $approved->count() }} item)</span>
                    </span>
                    <span>Rp {{ number_format($approved->sum('total_price'), 0, ',', '.') }}</span>
                </div>
                <div class="summary-row">
                    <span class="label" style="color: #991b1b;">
                        Ditolak
                        <span class="count">({{ $rejected->count() }} item)</span>
                    </span>
                    <span style="color: #991b1b;">Rp {{ number_format($rejected->sum('total_price'), 0, ',', '.') }}</span>
                </div>
                @if($pending->count() > 0)
                <div class="summary-row">
                    <span class="label" style="color: #92400e;">
                        Menunggu Persetujuan
                        <span class="count">({{ $pending->count() }} item)</span>
                    </span>
                    <span style="color: #92400e;">Rp {{ number_format($pending->sum('total_price'), 0, ',', '.') }}</span>
                </div>
                @endif
                <hr class="summary-divider">
                <div class="summary-total">
                    <span>TOTAL PENGELUARAN AKTIF</span>
                    <span>Rp {{ number_format($totalAktif, 0, ',', '.') }}</span>
                </div>
            </div>
        </div>

    @else
        <p class="no-data">Tidak ada data pengeluaran untuk periode yang dipilih.</p>
    @endif

    {{-- ===== FOOTER ===== --}}
    <div class="footer">
        <div class="footer-left">
            <p>Dicetak pada: {{ now()->format('d/m/Y H:i:s') }}</p>
            <p>Sistem: Puri Asih Cashbook</p>
        </div>
        <div class="signature-box">
            <div class="signature-space"></div>
            <div class="signature-line">Manager</div>
            <div class="signature-label">Hotel Puri Asih</div>
        </div>
    </div>

</body>
</html>
