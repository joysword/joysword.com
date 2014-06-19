<?php
$are = "457o bjhi x:t:ettgtost 47";
$you = split(":",$are);
$bored = $you[1];
for($i=0;$i<strlen($you[0]);$i++)
{
$bored .= $you[2][$i].$you[0][strlen($you[0])-$i-1];
}
echo $bored;
?>