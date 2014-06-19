<?php
/**
 * insert alcohol information into database for Fall 2012 CS424 Project 3 Group 2 at UIC
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
	echo "connected!";
}
mysql_select_db($db);

if (mysql_query("CREATE TABLE alcohol (`id` int(11) NOT NULL AUTO_INCREMENT, `code` int(11), `result` varchar(255), PRIMARY KEY (`id`))"))
	{
		echo "database created!";
	}
	echo mysql_error();
mysql_query("INSERT INTO alcohol(code,result) VALUES (-1,'Blank')");

for ($i=0; $i<=93;$i++ ) {
    $sql= "INSERT INTO alcohol(code,result) VALUES ($i,'".$i*0.01." % BAC')";
	mysql_query($sql);
}

mysql_query("INSERT INTO alcohol(code, result) VALUES (94, '0.94+ % BAC')");
mysql_query("INSERT INTO alcohol(code, result) VALUES (95, 'Test Refused')");
mysql_query("INSERT INTO alcohol(code, result) VALUES (96, 'None Given')");
mysql_query("INSERT INTO alcohol(code, result) VALUES (97, 'AC Test Performed, Results Unknown')");
mysql_query("INSERT INTO alcohol(code, result) VALUES (98, 'Positive Reading with No Actual Value')");
mysql_query("INSERT INTO alcohol(code, result) VALUES (99, 'Unknown if tested')");
echo mysql_error();
mysql_close($con);
?>
