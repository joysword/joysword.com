<?php
require_once('global.php');
$action='main';
extract($_GET);
$allow=array('main','add');
if (in_array($action,$allow)) 
{
    include(D_P.'model/'.$action.".model.php");
}
?>