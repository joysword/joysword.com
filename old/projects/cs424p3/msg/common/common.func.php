<?php 
/*
 +----------------------------------------------------------
 * 截取UTF8字符串
 +----------------------------------------------------------
 * @参数 string $string     要截取的字符串
 * 		 string $length     要截取的字符个数，是按英文字符计算的。
 *       string $suffix     后缀
 +----------------------------------------------------------
 * @return string
 +----------------------------------------------------------
 */
function SubUTF8($string, $length=10, $suffix="...")
{
	$index = 0;         //索引，每加1表示移向下一个字节。
	$number = 0;        //按英文计算的字符宽度数。一个中文按两个英文字符算
	//只要还没有索引到字串的最后一个字节并且还没有达到所要的宽度，就继续
	while ($index<strlen($string) && $number<$length)
	{
		if (ord($string[$index]) > 127)   //中文
		{
			$index += 3;
			$number += 2;
		}
		else
		{
			++$index;
			++$number;
		}
	}
	//结果可能会多截取一个英文字符宽度，或者刚好符合，不会少截。
	if (isset($string[$index]))
	{
		return substr($string, 0, $index).'...';
	}
	else
	{
		return substr($string, 0, $index);
	}
}

/**
 +----------------------------------------------------------
 * 去掉文件名中的扩展名
 +----------------------------------------------------------
 * @参数 string $filename 文件名
 +----------------------------------------------------------
 * @return string
 +----------------------------------------------------------
 */
function TrimExt($fileName)
{
	return preg_replace("/\.[a-z]+$/i", "", $fileName);
}

/**
 +----------------------------------------------------------
 * 获取文件名中的后缀
 +----------------------------------------------------------
 * @参数 string $filename 文件名
 +----------------------------------------------------------
 * @return string
 +----------------------------------------------------------
 */
function GetExt($fileName)
{
	if(preg_match("/(\.)([a-z]+)$/i", $fileName, $result))
		return $result[2];
}

/**
 +----------------------------------------------------------
 * 转意特殊字符，输入是数组
 +----------------------------------------------------------
 * @参数 array $array 引用传递
 +----------------------------------------------------------
 * @return void
 +----------------------------------------------------------
 */
function AddS(&$array)
{
	foreach($array as $key=>$value){
		if(!is_array($array[$key])){
			$array[$key] = addslashes(trim($value));
		}
		else{
			AddS($array[$key]);
		}
	}
}

/**
 +----------------------------------------------------------
 * 去掉对特殊字符的转意，输入是数组
 +----------------------------------------------------------
 * @参数 array $array 引用传递
 +----------------------------------------------------------
 * @return void
 +----------------------------------------------------------
 */
function StripS(&$array)
{
	foreach($array as $key=>$value){
		if(!is_array($array[$key])){
			$array[$key] = stripslashes($value);
		}
		else{
			StripS($array[$key]);
		}
	}
}

/**
 +----------------------------------------------------------
 * 将html标签转化为其对应实体，其实失去意思
 +----------------------------------------------------------
 * @参数 array $array
 +----------------------------------------------------------
 * @return void
 +----------------------------------------------------------
 */
function HtmlEntitie(&$array)
{
	if (!is_array($array)) 
	{
	    $array = htmlspecialchars($array);
		return;
	}
	foreach($array as $key=>$value){
		if(!is_array($array[$key])){
			$array[$key] = htmlspecialchars($value);
		}
		else{
			HtmlEntitie($array[$key]);
		}
	}	
}


function Htmlentitie_decode(&$array)
{
	if (!is_array($array)) 
	{
	    $array = htmlspecialchars_decode($array);
		return;
	}
	foreach($array as $key=>$value){
		if(!is_array($array[$key])){
			$array[$key] = htmlspecialchars_decode($value);
		}
		else{
			HtmlEntitie($array[$key]);
		}
	}
} 

/**
 +----------------------------------------------------------
 * 得到当前脚本所在目录的物理路径
 +----------------------------------------------------------
 * @参数 void
 +----------------------------------------------------------
 * @return string
 +----------------------------------------------------------
 */
function GetCurDir()
{
	return realpath("./");
}

/**
 +----------------------------------------------------------
 * 得到网站根目录的物理路径(即apache配置的Document Root值)
 +----------------------------------------------------------
 * @参数 void
 +----------------------------------------------------------
 * @return string
 +----------------------------------------------------------
 */
function GetRootDir()
{
	$sRealPath = realpath( './' ) ;

	$sSelfPath = $_SERVER['PHP_SELF'] ;
	$sSelfPath = substr( $sSelfPath, 0, strrpos( $sSelfPath, '/' ) ) ;

	return substr( $sRealPath, 0, strlen( $sRealPath ) - strlen( $sSelfPath ) ) ;
}

/**
 +----------------------------------------------------------
 * 从文件的完整路径中得到文件名字，即取出最后一个“/”之后的子串
 +----------------------------------------------------------
 * @参数 string
 +----------------------------------------------------------
 * @return string
 +----------------------------------------------------------
 */
function GetNameFromPath($path)
{
	return substr($path,strrpos($path,'/') + 1);
}

/**
 +----------------------------------------------------------
 * 得到访问者的ip
 +----------------------------------------------------------
 * @参数 void
 +----------------------------------------------------------
 * @return string
 +----------------------------------------------------------
 */
function GetClientIP()
{
	if($_SERVER){
		if(isset($_SERVER["HTTP_X_FORWARDED_FOR"])){
			$ip = $_SERVER["HTTP_X_FORWARDED_FOR"];
		} 
		elseif(isset($_SERVER["HTTP_CLIENT_IP"])){
			$ip = $_SERVER["HTTP_CLIENT_IP"];
		}
		else{
			$ip = $_SERVER["REMOTE_ADDR"];
		}
	}
	else{
		if(getenv("HTTP_X_FORWARDED_FOR")){
			$ip = getenv("HTTP_X_FORWARDED_FOR");
		}
		elseif(getenv("HTTP_CLIENT_IP")){
			$ip = getenv("HTTP_CLIENT_IP");
		}
		else {
			$ip = getenv("REMOTE_ADDR");
		}
	}

	return $ip;
}

/**
 +----------------------------------------------------------
 * 得到当前的时间戳，精确到ms
 +----------------------------------------------------------
 * @参数 void
 +----------------------------------------------------------
 * @return float
 +----------------------------------------------------------
 */
function GetMicrotime()
{
	list($usec, $sec) = explode(" ", microtime());
	return ((float)$usec + (float)$sec);
}

/**
 +----------------------------------------------------------
 * 将数据库中保存的文件路径进行rawurlencode
 +----------------------------------------------------------
 * @参数 string
 +----------------------------------------------------------
 * @return string
 +----------------------------------------------------------
 */
function SplitUrlEncode($str)
{
	$arr = explode('/',$str);
	$res = "";
	for($i = 0; $i < count($arr); $i++)
	{
		if(empty($arr[$i]))
			continue;
		$res .= "/";
		$res .= rawurlencode($arr[$i]);		
	}
	$str[0] != '/' && $res[0] == '/' && $res = substr($res,1);
	return $res;
}

/**
 +----------------------------------------------------------
 * 高亮显示搜索关键词
 +----------------------------------------------------------
 * @参数 string $key, string $oldStr
 +----------------------------------------------------------
 * @return string
 +----------------------------------------------------------
 */
function HighLightKeyWord($keyWord, $oldStr)
{
	$newStr = $oldStr;
	strlen($keyWord) > 0 && $newStr = preg_replace("/".$keyWord."/i", "<b><font color='red'>".$keyWord."</font></b>", $oldStr);
	return $newStr;
}

/**
 +----------------------------------------------------------
 * 获取当前脚本的url
 +----------------------------------------------------------
 * @参数 void
 +----------------------------------------------------------
 * @return string
 +----------------------------------------------------------
 */
function GetCurUrl()
{
	$url =  "http://".$_SERVER ['HTTP_HOST'].$_SERVER['PHP_SELF'];
	if(!empty($_GET)){
		$url .= "?";
		foreach($_GET as $key=>$value){
			$url .= $key."=".$value."&";
		}		
		return substr($url, 0, -1);
	}
	return $url;
}

/**
 +----------------------------------------------------------
 * 页面跳转函数,仅供后台管理部分使用
 +----------------------------------------------------------
 * @参数 $content 显示的内容，$goto 跳转到的位置
 +----------------------------------------------------------
 * @return void
 +----------------------------------------------------------
 */
function Redirect($content, $goto,$stop=2)
{
	global $proName;
$html = <<<EOT
	<html><HEAD><TITLE>$proName </TITLE>
	<META http-equiv=Content-Type content="text/html; charset=utf-8">
	<meta http-equiv="refresh" content="$stop;URL=$goto">
	<META http-equiv=Pragma content=no-cache>
	<META http-equiv=Cache-Control content=no-cache>
	<LINK href="images/cp.css" type=text/css rel=stylesheet>
	<style type="text/css">
	<!--
	.STYLE1 {color: #336699}
	.STYLE2 {color: #3366CC}
	-->
	</style>
	</HEAD>
	<BODY topMargin=10 marginheight="10" marginwidth="10">
	<TABLE class=tableoutline cellSpacing=1 cellPadding=4 width="100%" boder="0">
	<TBODY>

	<TR class=tbhead align=middle>
	  <TD align="center" noWrap class="secondalt STYLE1">$content</TD>
	  </TR>
	 <TR class=tbhead align=middle>
	  <TD align="center" noWrap class="secondalt STYLE2">页面将在$stop 秒钟后跳转，如果没有跳转请【<A HREF="$goto">点击</A>】</TD>
	  </TR>
	</TBODY></TABLE>
	<TABLE cellSpacing=0 cellPadding=4 width="100%" border=0>
	<TBODY>
	<TR>
	<TD align=right></TD>
	</TR></TBODY></TABLE>
	<BR>
	<CENTER>$proName</CENTER></BODY></html>
EOT;

	echo $html;
	exit;
}

/**
 +----------------------------------------------------------
 * 登出函数，取自php手册
 +----------------------------------------------------------
 * @参数 void
 +----------------------------------------------------------
 * @return void
 +----------------------------------------------------------
 */
function Logout()
{
	// Unset all of the session variables.
	$_SESSION = array();

	// If it's desired to kill the session, also delete the session cookie.
	// Note: This will destroy the session, and not just the session data!
	if (isset($_COOKIE[session_name()])) {
	   setcookie(session_name(), '', time()-42000, '/');
	}

	// Finally, destroy the session.
	session_destroy();	
}
//----------------测试
//$array = array(
//	'key1' => " ' ",
//	"key2" => ' " ',
//	"key3" => ' \ ',
//	"key4" => array("'",' \ ','"'),
//	"key5" => "<br>",
//	"key6" => array("test<br>")
//
//);
//AddS($array);
//StripS($array);
//HtmlEntitie($array);
//print_r($array);

//echo SplitUrlEncode("测试/测试.rar");



function sidesoft($a,$b)
{
    if ($a['playid'] == $b['playid'])
	{
		return 0;
	}
	return $a['playid'] < $b['playid'] ? -1 : 1;
} 

function writeCache($handle,$result) {
	$cache 	= '';
	$cache .= "<?php\r\n";
	$cache .= "return \$_cache=" . var_export ( $result, TRUE ) . ";\r\n";
	$cache .= "?>\r\n";
	fwrite($handle,$cache);
}

function Cookie($ck_Var,$ck_Value,$ck_Time = 'F'){
	$timestamp = time();
	$ck_Time = $ck_Time == 'F' ? $timestamp - 31536000 : $ck_Time;
	setCookie(CookiePre().'_'.$ck_Var,$ck_Value,$ck_Time);
}

function GetCookie($Var){
    return $_COOKIE[CookiePre().'_'.$Var];
}
function CookiePre(){
	return substr(md5("zhjd"),0,8);
}

function StrCode($string,$action='ENCODE'){
	$anhao = ("zhjd");
	$key	= substr(md5($anhao),18,28);
	$string	= $action == 'ENCODE' ? $string : base64_decode($string);
	$len	= strlen($key);
	$code	= '';
	for($i=0; $i<strlen($string); $i++){
		$k		= $i % $len;
		$code  .= $string[$i] ^ $key[$k];
	}
	$code = $action == 'DECODE' ? $code : base64_encode($code);
	return $code;
}

?>