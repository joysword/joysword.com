<?php
/**
 * insert half hour information into database for Fall 2012 CS424 Project 4 Group 4 at UIC
 * 
 * @author  Shi Yin
 * @version 1.0
 * @package main
 */
 
$db = 'p4';
$con = mysql_connect('project4dbinstance.chestadraypc.us-east-1.rds.amazonaws.com','windy','windywindy');
if (!$con) {
	die("could not connect: ". mysql_error());
}
else {
	echo "connected!";
}
mysql_select_db($db);

for ($hour=0;$hour<24;$hour++) {
	for ($min=0;$min<29;$min++) {
		$sql = "UPDATE microblog SET `halfhour` = $hour*2 WHERE `hour`=$hour AND `min`=$min";
		mysql_query($sql);
	}
	for ($min=30;$min<60;$min++) {
		$sql = "UPDATE microblog SET `halfhour` = $hour*2+1 WHERE `hour`=$hour AND `min`=$min";
		mysql_query($sql);
	}
}
echo mysql_error();
mysql_close($con);
?>
