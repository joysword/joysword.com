<?php
/**
 * insert speed information into database for Fall 2012 CS424 Project 3 Group 2 at UIC
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

if (mysql_query("CREATE TABLE speed (`id` int(11) NOT NULL AUTO_INCREMENT, `code` int(11), `speed` varchar(255), PRIMARY KEY (`id`))"))
	{
		echo "database created!\n";
	}
	echo mysql_error();
mysql_query("INSERT INTO speed(code,speed) VALUES (-1,'Blank')");
mysql_query("INSERT INTO speed(code,speed) VALUES (0,'Stopped Motor Vehicle In-Transport')");

for ($i=1; $i<=99;$i++ ) {
    $sql= "INSERT INTO speed(code,speed) VALUES ($i,'0".$i." MPH' )";
	mysql_query($sql);
}
for ($i=100; $i<=151;$i++ ) {
    $sql= "INSERT INTO speed(code,speed) VALUES ($i,'".$i." MPH' )";
	mysql_query($sql);
}
mysql_query("INSERT INTO speed(code, speed) VALUES (997, 'Greater than 151 MPH')");
mysql_query("INSERT INTO speed(code, speed) VALUES (998, 'Not Reported')");
mysql_query("INSERT INTO speed(code, speed) VALUES (999, 'Unknown')");
echo mysql_error();
echo "success!\n";
mysql_close($con);
?>
