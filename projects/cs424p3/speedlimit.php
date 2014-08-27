<?php
/**
 * insert speed limit information into database for Fall 2012 CS424 Project 3 Group 2 at UIC
 * 
 * @author  Shi Yin
 * @version 1.0
 * @package main
 */
 
$db = 'car-crash';
$con = mysql_connect('178.63.199.31:0','cs424-p3','idontknow');
if (!$con) {
	die("could not connect: ". mysql_error());
}
else {
	echo "connected!\n";
}
mysql_select_db($db);

if (mysql_query("CREATE TABLE speedlimit (`id` int(11) NOT NULL AUTO_INCREMENT, `code` int(11), `limit` varchar(255), `value_` int(11), PRIMARY KEY (`id`))"))
	{
		echo "database created!\n";
	}
	echo mysql_error();
mysql_query("INSERT INTO speedlimit(code,limit) VALUES (-1,'Blank')");
mysql_query("INSERT INTO speedlimit(code,limit) VALUES (0,'No statutory Limit/Non-Trafficway Area')");

for ($i=100; $i<=95;$i=$i+5 ) {
    $sql= "INSERT INTO speedlimit(code,limit, value_) VALUES ($i,'".$i." MPH',$i )";
	mysql_query($sql);
}
mysql_query("INSERT INTO speedlimit(code, limit, value_) VALUES (96, '96 MPH', 96)");
mysql_query("INSERT INTO speedlimit(code, limit, value_) VALUES (97, '97 MPH', 97)");
mysql_query("INSERT INTO speedlimit(code, limit) VALUES (98, 'Not Reported')");
mysql_query("INSERT INTO speedlimit(code, limit) VALUES (99, 'Unknown')");
echo mysql_error();
echo "success!\n";
mysql_close($con);
?>
