<?php

function moon_clipboard_title($value)
{
    return trim(strip_tags((string) $value));
}

function moon_clipboard_storage_path($name)
{
    return __DIR__ . '/notes/' . ltrim((string) $name, '/');
}
