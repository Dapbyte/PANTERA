<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResolveKendalaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tanggal_resolved' => ['nullable', 'date', 'before_or_equal:today'],
            'catatan_penyelesaian' => ['required', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'tanggal_resolved.before_or_equal' => 'Tanggal penyelesaian tidak boleh di masa depan.',
            'catatan_penyelesaian.required' => 'Catatan solusi penanganan wajib diisi.',
        ];
    }
}
