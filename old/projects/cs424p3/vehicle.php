<?php
/**
 * insert vehicle type information into database for Fall 2012 CS424 Project 3 Group 2 at UIC
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

if (mysql_query("CREATE TABLE vehicletype (`id` int(11) NOT NULL AUTO_INCREMENT, `code` int(11), `type` varchar(255), `value_` int(11), PRIMARY KEY (`id`))"))
	{
		echo "database created!\n";
	}
echo mysql_error();

mysql_query("INSERT INTO `vehicletype`(`code`,`type`) VALUES (-1,'Blank')");

for ($i=1; $i<=9;$i++ ) {
    $sql= "INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES ($i,'Automobile',1 )";
	mysql_query($sql);
}
for ($i=10; $i<=19;$i++ ) {
    $sql= "INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES ($i,'Utility Vehicle',2 )";
	mysql_query($sql);
}
for ($i=20; $i<=29;$i++ ) {
    $sql= "INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES ($i,'Van',3 )";
	mysql_query($sql);
}
for ($i=30; $i<=48;$i++ ) {
    $sql= "INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES ($i,'Pickup/Light Truck',4 )";
	mysql_query($sql);
}
mysql_query("INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES (49,'Unknown Light Vehicle',5 )");

for ($i=50; $i<=59;$i++ ) {
    $sql= "INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES ($i,'Bus',6 )";
	mysql_query($sql);
}
for ($i=60; $i<=79;$i++ ) {
    $sql= "INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES ($i,'Truck',7 )";
	mysql_query($sql);
}
for ($i=80; $i<=89;$i++ ) {
    $sql= "INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES ($i,'Motorcyle',8 )";
	mysql_query($sql);
}
for ($i=90; $i<=97;$i++ ) {
    $sql= "INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES ($i,'Other',9 )";
	mysql_query($sql);
}

mysql_query("INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES (98,'Not Reported',10 )");
mysql_query("INSERT INTO `vehicletype`(`code`,`type`, `value_`) VALUES (99,'Unknown',11 )");

echo mysql_error();
echo "success!\n";
mysql_close($con);
?>
