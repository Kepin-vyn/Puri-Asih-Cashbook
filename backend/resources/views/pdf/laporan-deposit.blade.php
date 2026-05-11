<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Deposit - Hotel Puri Asih</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #333; padding: 30px; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 12px; }
        .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
        .header h2 { font-size: 14px; font-weight: normal; margin-top: 4px; }
        .header p  { font-size: 11px; color: #555; margin-top: 2px; }

        /* Disclaimer Box */
        .disclaimer {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 20px;
            font-size: 11px;
        }
        .disclaimer strong { color: #856404; }
        .disclaimer p { color: #856404; margin-top: 2px; }

        /* Summary Box */
        .summary-grid { display: flex; gap: 12px; margin-bottom: 20px; }
        .summary-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; text-align: center; }
        .summary-card .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-card .value { font-size: 13px; font-weight: bold; margin-top: 3px; }
        .card-active    .value { color: #2563eb; }
        .card-refunded  .value { color: #16a34a; }
        .card-forfeited .value { color: #dc2626; }

        /* Table */
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        thead tr { background-color: #1F3864; color: #fff; }
        thead th { padding: 8px 10px; text-align: left; font-size: 11px; }
        tbody tr:nth-child(even) { background-color: #f8fafc; }
        tbody td { padding: 7px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Status Badge */
        .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .badge-active    { background: #dbeafe; color: #1e40af; }
        .badge-refunded  { background: #d1fae5; color: #065f46; }
        .badge-forfeited { background: #fee2e2; color: #991b1b; }

        /* Expiring tag */
        .expiring-tag { color: #dc2626; font-size: 10px; font-weight: bold; }

        /* Footer */
        .footer { margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        .footer-left { font-size: 10px; color: #888; }
        .signature-box { text-align: center; width: 180px; }
        .signature-box .signature-name { font-size: 11px; font-weight: bold; margin-top: 50px; border-top: 1px solid #333; padding-top: 4px; }
        .signature-box .signature-label { font-size: 10px; color: #555; }
    </style>
</head>
<body>

    {{-- ===== HEADER ===== --}}
    <div class="header">
        <h1>HOTEL PURI ASIH</h1>
        <h2>Laporan Refundable Deposit</h2>
        <p>
            @if($date_from && $date_to)
                Periode: {{ \Carbon\Carbon::parse($date_from)->format('d/m/Y') }}
                s/d {{ \Carbon\Carbon::parse($date_to)->format('d/m/Y') }}
            @else
                Semua Periode
            @endif
        </p>
    </div>

    {{-- ===== DISCLAIMER ===== --}}
    <div class="disclaimer">
        <strong>⚠ PERHATIAN PENTING</strong>
        <p>
            Deposit adalah uang jaminan yang bersifat sementara dan BUKAN merupakan pemasukan hotel.
            Laporan ini terpisah dari laporan keuangan utama dan tidak mempengaruhi kalkulasi kas harian.
        </p>
    </div>

    {{-- ===== SUMMARY ===== --}}
    <div class="summary-grid">
        <div class="summary-card card-active">
            <div class="label">Aktif (Belum Dikembalikan)</div>
            <div class="value">Rp {{ number_format($total_active, 0, ',', '.') }}</div>
        </div>
        <div class="summary-card card-refunded">
            <div class="label">Dikembalikan</div>
            <div class="value">Rp {{ number_format($total_refunded, 0, ',', '.') }}</div>
        </div>
        <div class="summary-card card-forfeited">
            <div class="label">Hangus</div>
            <div class="value">Rp {{ number_format($total_forfeited, 0, ',', '.') }}</div>
        </div>
    </div>

    {{-- ===== TABEL DEPOSIT ===== --}}
    @if(count($deposits) > 0)
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:30px;">No</th>
                    <th>Nama Tamu</th>
                    <th>Kamar</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Metode</th>
                    <th>Status</th>
                    <th class="text-right">Jumlah (Rp)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($deposits as $index => $dep)
                @php
                    $isExpiring = $dep->status === 'active' &&
                        \Carbon\Carbon::parse($dep->check_out_date)->lte(\Carbon\Carbon::tomorrow());
                    $methodMap  = ['tunai' => 'Tunai', 'transfer' => 'Transfer', 'qris' => 'QRIS', 'kartu_kredit' => 'Kartu Kredit'];
                @endphp
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>
                        {{ $dep->guest_name }}
                        @if($isExpiring)
                            <br><span class="expiring-tag">⚠ Jatuh Tempo!</span>
                        @endif
                    </td>
                    <td class="text-center">{{ $dep->room_number }}</td>
                    <td>{{ \Carbon\Carbon::parse($dep->check_in_date)->format('d/m/Y') }}</td>
                    <td>{{ \Carbon\Carbon::parse($dep->check_out_date)->format('d/m/Y') }}</td>
                    <td>{{ $methodMap[$dep->payment_method] ?? $dep->payment_method }}</td>
                    <td class="text-center">
                        <span class="badge badge-{{ $dep->status }}">
                            @if($dep->status === 'active') Aktif
                            @elseif($dep->status === 'refunded') Dikembalikan
                            @else Hangus
                            @endif
                        </span>
                    </td>
                    <td class="text-right">{{ number_format($dep->amount, 0, ',', '.') }}</td>
                </tr>
                @if($dep->note && $dep->status === 'forfeited')
                <tr>
                    <td></td>
                    <td colspan="7" style="font-size: 10px; color: #dc2626; padding-top: 2px; padding-bottom: 6px;">
                        Alasan hangus: {{ $dep->note }}
                    </td>
                </tr>
                @endif
                @endforeach
            </tbody>
        </table>
    @else
        <p style="text-align: center; padding: 30px; color: #888; font-style: italic;">
            Tidak ada data deposit untuk periode yang dipilih.
        </p>
    @endif

    {{-- ===== FOOTER ===== --}}
    <div class="footer">
        <div class="footer-left">
            <p>Dicetak oleh sistem Puri Asih Cashbook</p>
            <p>{{ now()->format('d/m/Y H:i:s') }}</p>
            <p style="margin-top: 4px; color: #aaa; font-style: italic;">
                * Laporan ini terpisah dari laporan keuangan utama
            </p>
        </div>
        <div class="signature-box">
            <div class="signature-name">Manager</div>
            <div class="signature-label">Hotel Puri Asih</div>
        </div>
    </div>

</body>
</html>
