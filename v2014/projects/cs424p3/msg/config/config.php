<?php 
/*
程序作用：加载了常用类，所有control层文件必须包含该文件
*/

return $config = array(
	
	/*网站配置*/
	"WEB_DEBUG" => 1,				     //设置为1，用于debug版本
	"pageSize"=>10,
	"pageNum"=>5,

	/*数据库配置*/
	'DB_HOST'	=>'joyswordcom.ipagemysql.com',
	'DB_NAME'	=>'msg',
	'DB_USER'	=>'cs424',
	'DB_PWD'	=>'cs424',
	'DB_PORT'	=>'3306',
	'DB_CHARSET'=>'UTF8',
	'DB_PCONNECT'  => 0,
		/*smarty配置*/
	"TP_LEFT_DELIMITER"		=> '{#',	  //不可修改
	"TP_RIGHT_DELIMITER"	=> '#}',
	"TP_FORCE_COMPILE"		=> true,	  //设置为true，用于debug版本
	"TP_CACHE"				=> false,	  //设置为false，用于debug版本
	"TP_CACHE_LIFETIME"		=> 0,
	"TP_CACHE_DIR"			=> "cache/",
	"TP_TEMPLATE_DIR"		=> "template/",
	"TP_COMPILE_DIR"		=> "cache/",
)
?>