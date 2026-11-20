<?php

namespace App\Enums;

enum VideoStatus: string
{
    case None = 'none';
    case Uploading = 'uploading';
    case Ready = 'ready';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this){
            self::None => 'Belum ada video',
            self::Uploading => 'Mengunggah',
            self::Ready => 'Siap',
            self::Failed => 'Gagal',
        };
    }
}
