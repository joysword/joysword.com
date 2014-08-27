<?php 
/*
程序作用：加载了常用类，所有control层文件必须包含该文件
*/

/**************项目所在目录的物理路径********/
define("D_P", __FILE__ ? dirname(__FILE__)."/" : realpath('./')."/");

//后台管理目录的物理路径
define("B_P", __FILE__ ? dirname(__FILE__)."/" : realpath('./')."/");

/****************加载配置文件****************/
$config = include D_P."config/config.php";

/****************加载常用类并配置************/
require_once(D_P."include/mysql.class.php");
require_once(D_P."include/Smarty-2.6.19/Smarty.class.php");

//定义smarty对象
$smarty = new Smarty();

$smarty->left_delimiter		= $config['TP_LEFT_DELIMITER'];
$smarty->right_delimiter	= $config['TP_RIGHT_DELIMITER'];
$smarty->caching			= $config['TP_CACHE'] ? 3 : 0;
$smarty->cache_lifetime		= $config['TP_CACHE_LIFETIME'];
$smarty->template_dir		= D_P.$config['TP_TEMPLATE_DIR'];
$smarty->compile_dir		= D_P.$config['TP_COMPILE_DIR'];
$smarty->cache_dir			= D_P.$config['TP_CACHE_DIR'];

//定义mysql对象
$db = new MySql($config['DB_HOST'], $config['DB_USER'], $config['DB_PWD'], 
				$config['DB_PORT'], $config['DB_PCONNECT'], $config['WEB_DEBUG'],
				$config['DB_CHARSET']);

$db->SelectDB($config['DB_NAME']);


/****************加载常用函数****************/
require_once(D_P."common/common.func.php");

/****************定义相关变量****************/
$isDebug  = $config["WEB_DEBUG"];
$curScript = substr($_SERVER['PHP_SELF'], strrpos($_SERVER['PHP_SELF'],"/") + 1);
$pageSize = $config["pageSize"];
$pageNum = $config["pageNum"];
/*********************相关设置****************/
function_exists('date_default_timezone_set') && date_default_timezone_set('America/Chicago');
session_start();

/*********************登陆及权限****************/

if(!get_magic_quotes_gpc()){
	AddS($_POST);
	AddS($_GET);
	AddS($_COOKIE);
}

$beginMicroTime = GetMicrotime();
?>