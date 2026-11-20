<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->unsignedInteger('position')->default(1);

            // Penanganan video: none | uploading | ready | failed
            $table->string('video_status', 20)->default('none');
            $table->string('video_path', 500)->nullable();          // path relatif pada disk privat
            $table->string('video_original_name')->nullable();
            $table->string('video_mime', 100)->nullable();
            $table->unsignedBigInteger('video_size')->nullable();   // byte
            $table->string('video_error', 500)->nullable();

            $table->timestamps();

            $table->index(['course_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
