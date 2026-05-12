<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Refundable Deposit - Hotel Puri Asih</title>
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
            margin-bottom: 16px;
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

        /* ===== DISCLAIMER BOX ===== */
        .disclaimer {
            background-color: #fffbeb;
            border: 1px solid #f59e0b;
            border-left: 5px solid #f59e0b;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 18px;
            font-size: 11px;
        }
        .disclaimer .disclaimer-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 4px;
            font-size: 11px;
        }
        .disclaimer p {
            color: #78350f;
            line-height: 1.5;
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
        .status-active    { color: #1d4ed8; font-weight: bold; }
        .status-refunded  { color: #065f46; font-weight: bold; }
        .status-forfeited { color: #991b1b; font-weight: bold; }

        /* ===== EXPIRING TAG ===== */
        .expiring-tag {
            color: #dc2626;
            font-size: 9px;
            font-weight: bold;
            display: block;
            margin-top: 2px;
        }

        /* ===== RINGKASAN ===== */
        .summary-section {
            margin-bottom: 20px;
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
        .summary-grid {
            display: flex;
            gap: 0;
        }
        .summary-card {
            flex: 1;
            padding: 8px 12px;
            border-right: 1px solid #dde4f0;
        }
        .summary-card:last-child { border-right: none; }
        .summary-card .s-label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 3px;
        }
        .summary-card .s-count {
            font-size: 10px;
            color: #aaa;
        }
        .summary-card .s-value {
            font-size: 12px;
            font-weight: bold;
        }
        .s-active    .s-value { color: #1d4ed8; }
        .s-refunded  .s-value { color: #065f46; }
        .s-forfeited .s-value { color: #991b1b; }

        .summary-divider {
            border: none;
            border-top: 1px solid #dde4f0;
            margin: 10px 0;
        }
        .summary-total-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            font-weight: bold;
            color: #1a1a1a;
            padding: 0 12px 10px;
        }
        .summary-note {
            font-size: 10px;
            color: #888;
            font-style: italic;
            padding: 0 12px 10px;
        }

        /* ===== FOOTER ===== */
        .footer {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px solid #dde4f0;
            padding-top: 14px;
        }
        .footer-left { font-size: 10px; color: #888; line-height: 1.6; }
        .footer-note { font-size: 10px; color: #aaa; font-style: italic; margin-top: 4px; }

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
        <h2>Laporan Refundable Deposit</h2>
        <p>
            @if(!empty($date_from) && !empty($date_to))
                Periode: {{ \Carbon\Carbon::parse($date_from)->format('d/m/Y') }}
                s/d {{ \Carbon\Carbon::parse($date_to)->format('d/m/Y') }}
            @else
                Semua Periode
            @endif
        </p>
    </div>

    {{-- ===== DISCLAIMER BOX ===== --}}
    <div class="disclaimer">
        <div class="disclaimer-title">&#9888; PERHATIAN: Deposit Bukan Pemasukan Hotel</div>
        <p>
            Deposit adalah uang jaminan tamu yang bersifat sementara dan BUKAN merupakan pemasukan hotel.
            Laporan ini bersifat informatif untuk pemantauan jaminan tamu dan tidak mempengaruhi
            kalkulasi keuangan operasional hotel.
        </p>
    </div>

    {{-- ===== INFO SECTION ===== --}}
    <div class="info-section">
        <div>
            <div class="info-row">
                <span class="info-label">Total Data</span>
                <span>: {{ count($deposits) }} deposit</span>
            </div>
        </div>
        <div style="text-align: right;">
            <div class="info-row">Dicetak: {{ now()->format('d/m/Y H:i') }}</div>
            <div class="info-row" style="color: #888;">Puri Asih Cashbook</div>
        </div>
    </div>

    {{-- ===== TABEL DEPOSIT ===== --}}
    @if(count($deposits) > 0)
        @php
            $methodMap = [
                'tunai'        => 'Tunai',
                'transfer'     => 'Transfer',
                'qris'         => 'QRIS',
                'kartu_kredit' => 'Kartu Kredit',
            ];
            $activeDeposits    = $deposits->where('status', 'active');
            $refundedDeposits  = $deposits->where('status', 'refunded');
            $forfeitedDeposits = $deposits->where('status', 'forfeited');
            $totalAll          = $deposits->sum('amount');
        @endphp

        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width: 28px;">No</th>
                    <th style="width: 68px;">Tanggal</th>
                    <th>Tamu</th>
                    <th class="text-center" style="width: 45px;">Kamar</th>
                    <th style="width: 68px;">Check-In</th>
                    <th style="width: 68px;">Check-Out</th>
                    <th class="text-right" style="width: 85px;">Jumlah (Rp)</th>
                    <th style="width: 70px;">Metode</th>
                    <th class="text-center" style="width: 80px;">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($deposits as $index => $dep)
                @php
                    $isExpiring = $dep->status === 'active'
                        && \Carbon\Carbon::parse($dep->check_out_date)->lte(\Carbon\Carbon::tomorrow());
                @endphp
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ \Carbon\Carbon::parse($dep->created_at)->format('d/m/Y') }}</td>
                    <td>
                        {{ $dep->guest_name }}
                        @if($isExpiring)
                            <span class="expiring-tag">&#9888; Jatuh Tempo!</span>
                        @endif
                    </td>
                    <td class="text-center">{{ $dep->room_number }}</td>
                    <td>{{ \Carbon\Carbon::parse($dep->check_in_date)->format('d/m/Y') }}</td>
                    <td>{{ \Carbon\Carbon::parse($dep->check_out_date)->format('d/m/Y') }}</td>
                    <td class="text-right">{{ number_format($dep->amount, 0, ',', '.') }}</td>
                    <td>{{ $methodMap[$dep->payment_method] ?? $dep->payment_method }}</td>
                    <td class="text-center">
                        @if($dep->status === 'active')
                            <span class="status-active">Aktif</span>
                        @elseif($dep->status === 'refunded')
                            <span class="status-refunded">Dikembalikan</span>
                        @else
                            <span class="status-forfeited">Hangus</span>
                        @endif
                    </td>
                </tr>
                @if($dep->note && $dep->status === 'forfeited')
                <tr>
                    <td></td>
                    <td colspan="8" style="font-size: 10px; color: #991b1b; padding-top: 1px; padding-bottom: 5px; font-style: italic;">
                        Alasan hangus: {{ $dep->note }}
                    </td>
                </tr>
                @endif
                @endforeach
            </tbody>
        </table>

        {{-- ===== RINGKASAN ===== --}}
        <div class="summary-section">
            <div class="summary-title">Ringkasan Deposit</div>
            <div class="summary-grid">
                <div class="summary-card s-active">
                    <div class="s-label">Total Deposit Aktif</div>
                    <div class="s-count">{{ $activeDeposits->count() }} tamu</div>
                    <div class="s-value">Rp {{ number_format($activeDeposits->sum('amount'), 0, ',', '.') }}</div>
                </div>
                <div class="summary-card s-refunded">
                    <div class="s-label">Total Dikembalikan</div>
                    <div class="s-count">{{ $refundedDeposits->count() }} tamu</div>
                    <div class="s-value">Rp {{ number_format($refundedDeposits->sum('amount'), 0, ',', '.') }}</div>
                </div>
                <div class="summary-card s-forfeited">
                    <div class="s-label">Total Hangus</div>
                    <div class="s-count">{{ $forfeitedDeposits->count() }} tamu</div>
                    <div class="s-value">Rp {{ number_format($forfeitedDeposits->sum('amount'), 0, ',', '.') }}</div>
                </div>
            </div>
            <hr class="summary-divider">
            <div class="summary-total-row">
                <span>TOTAL DEPOSIT TERCATAT</span>
                <span>Rp {{ number_format($totalAll, 0, ',', '.') }}</span>
            </div>
            <div class="summary-note">
                * Total di atas bukan merupakan bagian dari laporan keuangan hotel
            </div>
        </div>

    @else
        <p class="no-data">Tidak ada data deposit untuk periode yang dipilih.</p>
    @endif

    {{-- ===== FOOTER ===== --}}
    <div class="footer">
        <div class="footer-left">
            <p>Dicetak pada: {{ now()->format('d/m/Y H:i:s') }}</p>
            <p>Sistem: Puri Asih Cashbook</p>
            <p class="footer-note">* Laporan ini terpisah dari laporan keuangan utama</p>
        </div>
    </div>

</body>
</html>
