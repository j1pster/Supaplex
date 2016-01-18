<?php

define("LEVEL_SIZE", 1536);
define("NUMBER_OF_LEVELS", 111);
define("LEVEL_WIDTH", 60);
define("LEVEL_HEIGHT", 24);
define("TILE_INFO", 1440);
define("UNUSED", 1444);
define("GRAVITY", 1445);
define("UNKNOWN", 1446);
define("TITLE", 1468);
define("FREEZE_ZONKS", 1469);

$bytes = file_get_contents ('./files/LEVELS.DAT');
$ints = unpack("c*", $bytes);
$hex = array_map('dechex', $ints);
$level_map = array();
$level_info = array();
$level_data = array();
//$levels_data = array_chunk($hex, LEVEL_SIZE);
if(isset($_GET['level']))
{
    $level = $_GET["level"] - 1;
}
else 
{
    $level = 0;
}
for($i = 0; $i < LEVEL_HEIGHT; $i++)
{
    $currentRow = array(); 
    for($j = 0; $j < LEVEL_WIDTH; $j++)
    {
        $currentIndex = ($level * LEVEL_SIZE) + ($i * LEVEL_WIDTH) + $j + 1;
        $currentRow += array((string)$j => $hex[$currentIndex]);
    }
    $level_map += array("row" + (string)$i => $currentRow);
    unset($currentLevel);
}

$level_data += array("grid" => $level_map);

for($i = 0; $i < 96; $i++)
{
    $currentIndex2 = ($level * LEVEL_SIZE) + TILE_INFO + $i + 1;
    $level_info += array((string)$i => $hex[$currentIndex2]);
}

$level_data += array("info" => $level_info);


echo(json_encode($level_data));

?>