<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }}</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230E3B3F'/%3E%3Cpath d='M9 9h14M9 15h14M9 21h8' stroke='%23E9A60F' stroke-width='2.4' stroke-linecap='round'/%3E%3C/svg%3E">
    <script>window.__APP_CONFIG__ = @json($appConfig);</script>
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
</head>
<body>
    <div id="root"></div>
    <noscript>Aplikasi ini membutuhkan JavaScript.</noscript>
</body>
</html>
