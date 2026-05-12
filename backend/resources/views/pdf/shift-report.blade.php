<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Shift Report - Hotel Puri Asih</title>
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

        /* ===== INFO SECTION ===== */
        .info-section { margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 4px; font-size: 11px; }
        .info-label { width: 160px; font-weight: bold; }
        .info-value { flex: 1; }

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

        /* ===== NOTE ===== */
        .note { font-size: 10px; color: #888; font-style: italic; margin-top: 5px; margin-bottom: 15px; }

        /* ===== FOOTER ===== */
        .footer { margin-top: 40px; }
        .footer-print { font-size: 10px; color: #888; margin-bottom: 30px; }
        .signature-section { display: flex; justify-content: space-between; margin-top: 10px; }
        .signature-box { text-align: center; width: 200px; }
        .signature-box .signature-label { font-size: 11px; margin-bottom: 70px; }
        .signature-box .signature-name { font-size: 11px; font-weight: bold; border-top: 1px solid #333; padding-top: 4px; }
        .signature-box .signature-role { font-size: 10px; color: #555; }

        /* ===== NO DATA ===== */
        .no-data { text-align: center; padding: 15px; color: #888; font-style: italic; font-size: 11px; }
    </style>
</head>
<body>

    {{-- ===== HEADER ===== --}}
    <div class="header">
        <h1>HOTEL PURI ASIH</h1>
        <h2>SHIFT REPORT</h2>
    </div>

    {{-- ===== INFO SHIFT ===== --}}
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Staff</span>
            <span class="info-value">: {{ $shift['staff_name'] ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Shift</span>
            <span class="info-value">: {{ $shift['type_label'] ?? '-' }} ({{ $shift['started_at'] ?? '-' }} - {{ $shift['ended_at'] ?? 'Masih berjalan' }})</span>
        </div>
        <div class="info-row">
            <span class="info-label">Tanggal</span>
            <span class="info-value">: {{ $shift['tanggal'] ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Diserahkan kepada</span>
            <span class="info-value">: {{ $shift['handover_to_name'] ?? '-' }}</span>
        </div>
        @if($shift['handover_note'] ?? null)
        <div class="info-row">
            <span class="info-label">Catatan Serah Terima</span>
            <span class="info-value">: {{ $shift['handover_note'] }}</span>
        </div>
        @endif
    </div>

    {{-- ===== RINGKASAN KEUANGAN ===== --}}
    <div class="summary-box">
        <h3>RINGKASAN KEUANGAN</h3>
        <div class="summary-row">
            <span>Total Pemasukan KAS</span>
            <span>Rp {{ number_format($summary['kas']['total'] ?? 0, 0, ',', '.') }}</span>
        </div>
        <div class="summary-row">
            <span>Total Pemasukan Reservasi</span>
            <span>Rp {{ number_format($summary['reservations']['total'] ?? 0, 0, ',', '.') }}</span>
        </div>
        <div class="summary-row">
            <span>Total Pengeluaran</span>
            <span>Rp {{ number_format($summary['expenses']['total'] ?? 0, 0, ',', '.') }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row summary-total">
            <span>Saldo Akhir Shift</span>
            <span>Rp {{ number_format($summary['saldo_akhir'] ?? 0, 0, ',', '.') }}</span>
        </div>
    </div>

    {{-- ===== TABEL DETAIL KAS ===== --}}
    <div class="section-title">Detail Transaksi KAS</div>
    @if(count($kas) > 0)
        @php
            $typeLabels = ['reservasi' => 'Reservasi', 'checkin' => 'Check-In', 'pelunasan' => 'Pelunasan'];
            $methodLabels = ['tunai' => 'Tunai', 'transfer' => 'Transfer', 'qris' => 'QRIS', 'kartu_kredit' => 'Kartu Kredit'];
        @endphp
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:35px;">No</th>
                    <th>Tamu</th>
                    <th>Jenis</th>
                    <th>Metode Bayar</th>
                    <th class="text-right">Jumlah (Rp)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($kas as $index => $trx)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $trx->guest_name }}</td>
                    <td>{{ $typeLabels[$trx->transaction_type] ?? $trx->transaction_type }}</td>
                    <td>{{ $methodLabels[$trx->payment_method] ?? $trx->payment_method }}</td>
                    <td class="text-right">{{ number_format($trx->amount, 0, ',', '.') }}</td>
                </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="4" class="text-right">TOTAL KAS</td>
                    <td class="text-right">{{ number_format($summary['kas']['total'] ?? 0, 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>
    @else
        <p class="no-data">Tidak ada transaksi KAS pada shift ini.</p>
    @endif

    {{-- ===== TABEL DETAIL PENGELUARAN ===== --}}
    <div class="section-title">Detail Pengeluaran</div>
    @if(count($expenses) > 0)
        @php
            $statusLabels = ['auto_approved' => 'Auto', 'pending' => 'Pending', 'approved' => 'Disetujui', 'rejected' => 'Ditolak'];
        @endphp
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:35px;">No</th>
                    <th>Keterangan</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Harga (Rp)</th>
                    <th class="text-right">Total (Rp)</th>
                    <th class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($expenses as $index => $exp)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $exp->description }}</td>
                    <td class="text-center">{{ $exp->quantity }}</td>
                    <td class="text-right">{{ number_format($exp->price_per_item, 0, ',', '.') }}</td>
                    <td class="text-right">{{ number_format($exp->total_price, 0, ',', '.') }}</td>
                    <td class="text-center">{{ $statusLabels[$exp->status] ?? $exp->status }}</td>
                </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="4" class="text-right">TOTAL PENGELUARAN</td>
                    <td class="text-right">{{ number_format($summary['expenses']['total'] ?? 0, 0, ',', '.') }}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    @else
        <p class="no-data">Tidak ada pengeluaran pada shift ini.</p>
    @endif

    {{-- ===== TABEL DETAIL RESERVASI ===== --}}
    <div class="section-title">Detail Reservasi</div>
    @if(count($reservations) > 0)
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:35px;">No</th>
                    <th>Invoice</th>
                    <th>Tamu</th>
                    <th>Kamar</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th class="text-right">Total (Rp)</th>
                    <th>Sumber</th>
                </tr>
            </thead>
            <tbody>
                @foreach($reservations as $index => $rsv)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $rsv->invoice_number ?? '-' }}</td>
                    <td>{{ $rsv->guest_name }}</td>
                    <td class="text-center">{{ $rsv->room_number }}</td>
                    <td>{{ $rsv->check_in_date ? \Carbon\Carbon::parse($rsv->check_in_date)->format('d/m/Y') : '-' }}</td>
                    <td>{{ $rsv->check_out_date ? \Carbon\Carbon::parse($rsv->check_out_date)->format('d/m/Y') : '-' }}</td>
                    <td class="text-right">{{ number_format($rsv->room_price, 0, ',', '.') }}</td>
                    <td>{{ ucfirst($rsv->source ?? '-') }}</td>
                </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="6" class="text-right">TOTAL RESERVASI</td>
                    <td class="text-right">{{ number_format($summary['reservations']['total'] ?? 0, 0, ',', '.') }}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    @else
        <p class="no-data">Tidak ada reservasi pada shift ini.</p>
    @endif

    {{-- ===== TABEL DETAIL DEPOSIT ===== --}}
    <div class="section-title">Detail Deposit (Informasi)</div>
    @if(count($deposits) > 0)
        @php
            $depositStatusLabels = ['active' => 'Aktif', 'refunded' => 'Dikembalikan', 'forfeited' => 'Hangus'];
        @endphp
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width:35px;">No</th>
                    <th>Tamu</th>
                    <th>Kamar</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th class="text-right">Jumlah (Rp)</th>
                    <th class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($deposits as $index => $dep)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $dep->guest_name }}</td>
                    <td class="text-center">{{ $dep->room_number }}</td>
                    <td>{{ $dep->check_in_date ? \Carbon\Carbon::parse($dep->check_in_date)->format('d/m/Y') : '-' }}</td>
                    <td>{{ $dep->check_out_date ? \Carbon\Carbon::parse($dep->check_out_date)->format('d/m/Y') : '-' }}</td>
                    <td class="text-right">{{ number_format($dep->amount, 0, ',', '.') }}</td>
                    <td class="text-center">{{ $depositStatusLabels[$dep->status] ?? $dep->status }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        <p class="note">* Deposit bukan merupakan pemasukan hotel. Deposit dicatat sebagai informasi dan akan dikembalikan kepada tamu saat check-out.</p>
    @else
        <p class="no-data">Tidak ada deposit pada shift ini.</p>
    @endif

    {{-- ===== FOOTER ===== --}}
    <div class="footer">
        <div class="footer-print">
            Dicetak pada: {{ now()->format('d/m/Y H:i:s') }} | Sistem Puri Asih Cashbook
        </div>
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-label">Dibuat oleh:</div>
                <div class="signature-name">{{ $shift['staff_name'] ?? '___________________' }}</div>
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
