<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Keuangan Bulanan - Hotel Puri Asih</title>
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
        .summary-note { font-size: 10px; color: #888; font-style: italic; margin-top: 8px; }

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

        /* ===== NO DATA ===== */
        .no-data { text-align: center; padding: 15px; color: #888; font-style: italic; font-size: 11px; }

        /* ===== FOOTER ===== */
        .footer { margin-top: 40px; }
        .footer-disclaimer { font-size: 10px; color: #888; font-style: italic; margin-bottom: 5px; }
        .footer-print { font-size: 10px; color: #888; margin-bottom: 30px; }
        .signature-box { text-align: center; width: 200px; margin-left: auto; }
        .signature-box .signature-label { font-size: 11px; margin-bottom: 70px; }
        .signature-box .signature-name { font-size: 11px; font-weight: bold; border-top: 1px solid #333; padding-top: 4px; }
        .signature-box .signature-role { font-size: 10px; color: #555; }
    </style>
</head>
<body>

    {{-- ===== HEADER ===== --}}
    <div class="header">
        <h1>HOTEL PURI ASIH</h1>
        <h2>LAPORAN KEUANGAN BULANAN</h2>
        <p>Periode: {{ $period }}</p>
    </div>

    {{-- ===== RINGKASAN EKSEKUTIF ===== --}}
    <div class="summary-box">
        <h3>RINGKASAN KEUANGAN BULAN {{ strtoupper($period) }}</h3>
        <div class="summary-row">
            <span>Total Pemasukan KAS ({{ $summary['kas_count'] }} transaksi)</span>
            <span>{{ $summary['total_pemasukan_kas_formatted'] }}</span>
        </div>
        <div class="summary-row">
            <span>Total Pemasukan Reservasi OTT ({{ $summary['reservasi_count'] }} reservasi)</span>
            <span>{{ $summary['total_pemasukan_reservasi_formatted'] }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row" style="font-weight: bold;">
            <span>Total Pemasukan</span>
            <span>{{ $summary['total_pemasukan_formatted'] }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row">
            <span>Total Pengeluaran ({{ $summary['pengeluaran_count'] }} pengeluaran)</span>
            <span>{{ $summary['total_pengeluaran_formatted'] }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row summary-total">
            <span>SALDO BERSIH BULAN</span>
            <span>{{ $summary['saldo_bersih_formatted'] }}</span>
        </div>
        <p class="summary-note">* Deposit tidak termasuk dalam laporan keuangan karena bukan merupakan pemasukan hotel.</p>
    </div>

    {{-- ===== TABEL DETAIL PEMASUKAN KAS ===== --}}
    <div class="section-title">Detail Pemasukan KAS</div>
    @if(count($kas) > 0)
        @php
            $typeLabels = ['reservasi' => 'Reservasi', 'checkin' => 'Check-In', 'pelunasan' => 'Pelunasan'];
            $methodLabels = ['tunai' => 'Tunai', 'transfer' => 'Transfer', 'qris' => 'QRIS', 'kartu_kredit' => 'Kartu Kredit'];
        @endphp
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:30px;">No</th>
                    <th>Tanggal</th>
                    <th>Shift</th>
                    <th>FO</th>
                    <th>Tamu</th>
                    <th>Jenis</th>
                    <th>Metode</th>
                    <th class="text-right">Jumlah (Rp)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($kas as $index => $trx)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $trx->created_at->format('d/m/Y') }}</td>
                    <td>{{ ucfirst($trx->shift->type ?? '-') }}</td>
                    <td>{{ $trx->user->name ?? '-' }}</td>
                    <td>{{ $trx->guest_name }}</td>
                    <td>{{ $typeLabels[$trx->transaction_type] ?? $trx->transaction_type }}</td>
                    <td>{{ $methodLabels[$trx->payment_method] ?? $trx->payment_method }}</td>
                    <td class="text-right">{{ number_format($trx->amount, 0, ',', '.') }}</td>
                </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="7" class="text-right">SUBTOTAL PEMASUKAN KAS</td>
                    <td class="text-right">{{ number_format($summary['total_pemasukan_kas'], 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>
    @else
        <p class="no-data">Tidak ada transaksi KAS pada periode ini.</p>
    @endif

    {{-- ===== TABEL DETAIL RESERVASI OTT ===== --}}
    <div class="section-title">Detail Reservasi</div>
    @if(count($reservations) > 0)
        @php
            $statusLabels = ['pending' => 'Pending', 'checkin' => 'Check-In', 'checkout' => 'Check-Out', 'cancelled' => 'Batal'];
        @endphp
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:30px;">No</th>
                    <th>Tanggal</th>
                    <th>Invoice</th>
                    <th>Tamu</th>
                    <th>Kamar</th>
                    <th>Sumber</th>
                    <th class="text-right">Total (Rp)</th>
                    <th class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($reservations as $index => $rsv)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $rsv->created_at->format('d/m/Y') }}</td>
                    <td>{{ $rsv->invoice_number ?? '-' }}</td>
                    <td>{{ $rsv->guest_name }}</td>
                    <td class="text-center">{{ $rsv->room_number }}</td>
                    <td>{{ ucfirst($rsv->source ?? '-') }}</td>
                    <td class="text-right">{{ number_format($rsv->room_price, 0, ',', '.') }}</td>
                    <td class="text-center">{{ $statusLabels[$rsv->status] ?? $rsv->status }}</td>
                </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="6" class="text-right">SUBTOTAL RESERVASI</td>
                    <td class="text-right">{{ number_format($summary['total_pemasukan_reservasi'], 0, ',', '.') }}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    @else
        <p class="no-data">Tidak ada reservasi pada periode ini.</p>
    @endif

    {{-- ===== TABEL DETAIL PENGELUARAN ===== --}}
    <div class="section-title">Detail Pengeluaran (Sudah Disetujui)</div>
    @if(count($expenses) > 0)
        @php
            $expStatusLabels = ['auto_approved' => 'Auto', 'approved' => 'Disetujui'];
        @endphp
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:30px;">No</th>
                    <th>Tanggal</th>
                    <th>FO</th>
                    <th>Keterangan</th>
                    <th class="text-right">Total (Rp)</th>
                    <th class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($expenses as $index => $exp)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $exp->created_at->format('d/m/Y') }}</td>
                    <td>{{ $exp->user->name ?? '-' }}</td>
                    <td>{{ $exp->description }}</td>
                    <td class="text-right">{{ number_format($exp->total_price, 0, ',', '.') }}</td>
                    <td class="text-center">{{ $expStatusLabels[$exp->status] ?? $exp->status }}</td>
                </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="4" class="text-right">SUBTOTAL PENGELUARAN</td>
                    <td class="text-right">{{ number_format($summary['total_pengeluaran'], 0, ',', '.') }}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    @else
        <p class="no-data">Tidak ada pengeluaran pada periode ini.</p>
    @endif

    {{-- ===== FOOTER ===== --}}
    <div class="footer">
        <div class="footer-disclaimer">Laporan ini digenerate otomatis oleh sistem Puri Asih Cashbook.</div>
        <div class="footer-print">Dicetak pada: {{ now()->format('d/m/Y H:i:s') }}</div>
        <div class="signature-box">
            <div class="signature-label">Diketahui oleh:</div>
            <div class="signature-name">___________________</div>
            <div class="signature-role">Manager</div>
        </div>
    </div>

</body>
</html>
