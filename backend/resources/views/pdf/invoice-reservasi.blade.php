<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $reservation->invoice_number }} - Hotel Puri Asih</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #333; padding: 40px; }

        /* ===== HEADER ===== */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1F3864; }
        .hotel-info h1 { font-size: 22px; font-weight: bold; color: #1F3864; letter-spacing: 1px; }
        .hotel-info p  { font-size: 10px; color: #666; margin-top: 3px; line-height: 1.5; }
        .invoice-box { text-align: right; }
        .invoice-box .invoice-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .invoice-box .invoice-number { font-size: 20px; font-weight: bold; color: #1F3864; margin-top: 2px; }
        .invoice-box .invoice-date { font-size: 10px; color: #666; margin-top: 4px; }

        /* ===== STATUS BADGE ===== */
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-top: 6px; }
        .status-checkin  { background: #dbeafe; color: #1e40af; }
        .status-checkout { background: #d1fae5; color: #065f46; }
        .status-cancel   { background: #fee2e2; color: #991b1b; }
        .status-noshow   { background: #f3f4f6; color: #4b5563; }

        /* ===== SECTION TITLE ===== */
        .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1F3864; margin-bottom: 8px; }

        /* ===== GUEST & ROOM INFO ===== */
        .info-grid { display: flex; gap: 30px; margin-bottom: 25px; }
        .info-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; }
        .info-row { display: flex; margin-bottom: 5px; font-size: 11px; }
        .info-label { width: 120px; color: #888; flex-shrink: 0; }
        .info-value { font-weight: 600; color: #333; }

        /* ===== RINCIAN HARGA ===== */
        .price-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .price-table th { background: #1F3864; color: white; padding: 10px 14px; text-align: left; font-size: 11px; }
        .price-table td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        .price-table .text-right { text-align: right; }
        .price-table tr:nth-child(even) td { background: #f8fafc; }
        .price-table .total-row td { border-top: 2px solid #1F3864; font-weight: bold; font-size: 13px; background: #eff6ff; }
        .price-table .highlight { color: #1F3864; }
        .price-table .danger { color: #dc2626; }

        /* ===== PAYMENT INFO ===== */
        .payment-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 14px; margin-bottom: 25px; }
        .payment-info p { font-size: 11px; margin-bottom: 3px; }

        /* ===== FOOTER ===== */
        .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .footer-left { font-size: 10px; color: #888; }
        .signature-box { text-align: center; }
        .signature-name { font-size: 11px; font-weight: bold; margin-top: 55px; border-top: 1px solid #333; padding-top: 4px; min-width: 150px; }
        .signature-label { font-size: 10px; color: #666; }

        /* ===== NOTE ===== */
        .note-box { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; }
        .note-box p { font-size: 10px; color: #713f12; }
    </style>
</head>
<body>

    {{-- ===== HEADER ===== --}}
    <div class="header">
        <div class="hotel-info">
            <h1>HOTEL PURI ASIH</h1>
            <p>
                Jl. Raya Hotel No. 1, Bandung, Jawa Barat<br>
                Telp: (022) 123-4567 &nbsp;|&nbsp; Email: info@puriasih.com
            </p>
        </div>
        <div class="invoice-box">
            <div class="invoice-label">Invoice</div>
            <div class="invoice-number">{{ $reservation->invoice_number }}</div>
            <div class="invoice-date">Tanggal: {{ now()->format('d/m/Y') }}</div>
            <div>
                @php
                    $statusMap = ['checkin' => 'Check-In', 'checkout' => 'Check-Out', 'cancel' => 'Dibatalkan', 'noshow' => 'No Show'];
                @endphp
                <span class="status-badge status-{{ $reservation->status }}">
                    {{ $statusMap[$reservation->status] ?? $reservation->status }}
                </span>
            </div>
        </div>
    </div>

    {{-- ===== DATA TAMU & KAMAR ===== --}}
    <div class="section-title">Informasi Tamu & Kamar</div>
    <div class="info-grid">
        {{-- Data Tamu --}}
        <div class="info-box">
            <div class="section-title">Data Tamu</div>
            <div class="info-row">
                <span class="info-label">Nama Tamu</span>
                <span class="info-value">{{ $reservation->guest_name }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Nomor Kamar</span>
                <span class="info-value">{{ $reservation->room_number }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Sumber</span>
                <span class="info-value">
                    @php
                        $sourceMap = ['walk_in' => 'Walk In', 'tiket' => 'Tiket.com', 'booking' => 'Booking.com'];
                    @endphp
                    {{ $sourceMap[$reservation->source] ?? $reservation->source }}
                </span>
            </div>
            @if($reservation->remarks)
            <div class="info-row">
                <span class="info-label">Keterangan</span>
                <span class="info-value">{{ $reservation->remarks }}</span>
            </div>
            @endif
        </div>

        {{-- Data Tanggal --}}
        <div class="info-box">
            <div class="section-title">Tanggal Menginap</div>
            <div class="info-row">
                <span class="info-label">Tgl. Reservasi</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($reservation->reservation_date)->format('d/m/Y') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Check-In</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($reservation->check_in_date)->format('d/m/Y') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Check-Out</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($reservation->check_out_date)->format('d/m/Y') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Durasi</span>
                <span class="info-value">
                    @php
                        $nights = \Carbon\Carbon::parse($reservation->check_in_date)
                                    ->diffInDays(\Carbon\Carbon::parse($reservation->check_out_date));
                    @endphp
                    {{ $nights }} malam
                </span>
            </div>
        </div>
    </div>

    {{-- ===== RINCIAN PEMBAYARAN ===== --}}
    <div class="section-title">Rincian Pembayaran</div>
    <table class="price-table">
        <thead>
            <tr>
                <th>Keterangan</th>
                <th class="text-right">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Harga Kamar ({{ $nights }} malam)</td>
                <td class="text-right highlight">Rp {{ number_format($reservation->room_price, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Down Payment / DP</td>
                <td class="text-right">- Rp {{ number_format($reservation->down_payment, 0, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td>
                    <strong>Sisa Tagihan yang Harus Dibayar</strong>
                </td>
                <td class="text-right {{ $reservation->remaining_balance > 0 ? 'danger' : '' }}">
                    <strong>Rp {{ number_format($reservation->remaining_balance, 0, ',', '.') }}</strong>
                </td>
            </tr>
        </tbody>
    </table>

    {{-- ===== INFO PEMBAYARAN ===== --}}
    <div class="payment-info">
        @php
            $methodMap = ['tunai' => 'Tunai', 'transfer' => 'Transfer Bank', 'qris' => 'QRIS', 'kartu_kredit' => 'Kartu Kredit'];
            $statusMap2 = ['dp' => 'Down Payment (DP)', 'lunas' => 'Lunas'];
        @endphp
        <p><strong>Metode Pembayaran:</strong> {{ $methodMap[$reservation->payment_method] ?? $reservation->payment_method }}</p>
        <p><strong>Status Pembayaran:</strong> {{ $statusMap2[$reservation->payment_status] ?? $reservation->payment_status }}</p>
        <p><strong>Dicatat oleh:</strong> {{ $reservation->user->name ?? '-' }}</p>
    </div>

    {{-- ===== KETERANGAN ===== --}}
    <div class="note-box">
        <p>
            Invoice ini merupakan bukti reservasi yang sah dari Hotel Puri Asih.
            Mohon simpan dengan baik sebagai bukti pembayaran Anda.
            Hubungi kami di (022) 123-4567 jika ada pertanyaan.
        </p>
    </div>

    {{-- ===== FOOTER ===== --}}
    <div class="footer">
        <div class="footer-left">
            <p>Dicetak pada: {{ now()->format('d/m/Y H:i:s') }}</p>
            <p>Hotel Puri Asih &copy; {{ now()->year }}</p>
        </div>
        <div class="signature-box">
            <div class="signature-name">{{ $reservation->user->name ?? 'Front Office' }}</div>
            <div class="signature-label">Petugas Front Office</div>
        </div>
    </div>

</body>
</html>
