<?php
foreach (glob(__DIR__ . '/*') as $file) {
    if (pathinfo($file, PATHINFO_EXTENSION) === 'php') continue;
    $size = getimagesize($file);
    echo basename($file) . ': ' . $size[0] . ' x ' . $size[1] . ' px; ' . round(filesize($file) / 1024, 1) . " KB\n";
}
