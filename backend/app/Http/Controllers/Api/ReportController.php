<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends BaseApiController
{
    public function daily(Request $request): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
    public function monthly(Request $request): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
    public function exportPdf(Request $request): JsonResponse { return $this->successResponse(null, 'Feature coming soon.'); }
}
