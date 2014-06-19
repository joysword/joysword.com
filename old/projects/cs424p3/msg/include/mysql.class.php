<?php 
class MySql
{
	var $debug;			 //标识是否处于调试状态
	var $clientCharset;  //客户端编码

	var $debugInfo;		 //调试信息
	var $queryNum;		 //查询次数
	var $queryTime;		 //所有查询所需时间

	var $linkID;

    /**
     +----------------------------------------------------------
     * 构造函数，执行后会建立数据库连接
     +----------------------------------------------------------
     * @参数 string $host，string $userName,string $passWord
     +----------------------------------------------------------
     * @return void
     +----------------------------------------------------------
     */
	function __construct($host,$userName,$passWord,$port = "3306",$pconnect = 0,$debug=1,$clientCharset="UTF8")
	{
		$this->debug = $debug;
		$this->clientCharset = $clientCharset;

		$this->queryNum = 0;
		$this->debugInfo = array();
		$this->queryTime = 0.0;

		$this->Connect($host,$userName,$passWord,$port,$pconnect);
	}

	function Connect($host,$userName,$passWord,$port = "3306",$pconnect = 0)
	{
		$pconnect == 0 ? $this->linkID = @mysql_connect($host.":".$port,$userName,$passWord,$port)
			           : $this->linkID = @mysql_pconnect($host.":".$port,$userName,$passWord,$port);
		mysql_errno() != 0  && $this->Halt("Connect($pconnect) Mysql failed!");

		$this->clientCharset == "" && $clientCharset = "UTF8";
		$this->Query("SET NAMES '".$this->clientCharset."'");

		return $this->linkID;
	}


    /**
     +----------------------------------------------------------
     * 选择数据库
     +----------------------------------------------------------
     * @参数 string $dbname
     +----------------------------------------------------------
     * @return void
     +----------------------------------------------------------
     */
	function SelectDB($dbname)
	{
		if(!@mysql_select_db($dbname,$this->linkID)){
			$this->Halt("Cannot use datebase $dbname");
		}
	}

    /**
     +----------------------------------------------------------
     * 执行sql语句，返回资源描述符
     +----------------------------------------------------------
     * @参数 string $sql  要执行的sql语句
     +----------------------------------------------------------
     * @return resource
     +----------------------------------------------------------
     */
	function Query($sql)
	{
		//获取执行前时间
		$begintime = $this->GetMicroTime();

		//执行查询
		$res = mysql_query($sql, $this->linkID);

		//获取执行后的时间
		$endtime = $this->GetMicroTime();

		$excuttime = $endtime - $begintime;
		$this->queryTime += $excuttime;

		if($this->debug){
			$this->debugInfo[] = array(
				"sql" => $sql,
				"time" => $excuttime
			);
		}

		$this->queryNum++;
		if(!$res){
			$this->Halt("Query failed,SQL is:".$sql);
		}
		return $res;
	}
	
    /**
     +----------------------------------------------------------
     * 获取select语句所得到的结果集的行数
     +----------------------------------------------------------
     * @参数 resource $res  Query得到的结果资源
     +----------------------------------------------------------
     * @return int
     +----------------------------------------------------------
     */
	function NumRows($res)
	{
		return mysql_num_rows($res);
	}

    /**
     +----------------------------------------------------------
     * 获取前一次 insert，update，delete 操作所影响的记录行数
     +----------------------------------------------------------
     * @参数 void
     +----------------------------------------------------------
     * @return int
     +----------------------------------------------------------
     */
	function AffectedRows()
	{
		return mysql_affected_rows($this->linkID);
	}

    /**
     +----------------------------------------------------------
     * 从结果集中取得一行作为数组
     +----------------------------------------------------------
     * @参数 resource $res(结果集), int $resultType 返回结果的类型
     +----------------------------------------------------------
     * @return array
     +----------------------------------------------------------
     */
	function FetchArray($res, $resultType = MYSQL_ASSOC)
	{
		return mysql_fetch_array($res, $resultType);
	}

    /**
     +----------------------------------------------------------
     * 获取一条select语句所得到的第一条结果数组
     +----------------------------------------------------------
     * @参数 string $sql(sql语句), int $resultType 返回结果的类型
     +----------------------------------------------------------
     * @return array
     +----------------------------------------------------------
     */
	function FetchOneArray($sql, $resultType = MYSQL_ASSOC)
	{
		$res = $this->Query($sql);

		return mysql_fetch_array($res, $resultType);
	}

    /**
     +----------------------------------------------------------
     * 获取一条select语句所得到的第一条结果数组的第一项
     +----------------------------------------------------------
     * @参数 string $sql(sql语句)
     +----------------------------------------------------------
     * @return 不定
     +----------------------------------------------------------
     */
	function FetchFirst($sql)
	{
		$res = $this->Query($sql);

		$result = mysql_fetch_array($res);
		
		return $result[0];
	}

    /**
     +----------------------------------------------------------
     * 获取一条select语句所得到的所有结果数组
     +----------------------------------------------------------
     * @参数 string $sql(sql语句), int $resultType 返回结果的类型
     +----------------------------------------------------------
     * @return array
     +----------------------------------------------------------
     */
	function FetchAllArray($sql, $resultType = MYSQL_ASSOC)
	{
		$res = $this->Query($sql);

		$coll = array();
		while($temp = mysql_fetch_array($res,$resultType)){
			$coll[] = $temp;
		}
		return $coll;
	}

    /**
     +----------------------------------------------------------
     * 获取上一条insert语句中产生的数据库自增的ID号
     +----------------------------------------------------------
     * @参数 void
     +----------------------------------------------------------
     * @return void
     +----------------------------------------------------------
     */
	function InsertedID()
	{
		return mysql_insert_id($this-linkID);
	}


    /**
     +----------------------------------------------------------
     * 释放select语句产生的结果集，仅需在结果集占用较多内存时调用
     +----------------------------------------------------------
     * @参数 resource $res 资源描述符
     +----------------------------------------------------------
     * @return void
     +----------------------------------------------------------
     */
	function FreeResult($res)
	{
		mysql_free_result($res);
	}

    /**
     +----------------------------------------------------------
     * 关闭已经打开的非持久连接，通常不用使用(因为非持久连接，会在脚本结束时自动关闭)
     +----------------------------------------------------------
     * @参数 void
     +----------------------------------------------------------
     * @return void
     +----------------------------------------------------------
     */
	function Close()
	{
		mysql_close($this->linkID);
	}

    /**
     +----------------------------------------------------------
     * 获取数据库执行信息，仅在调试状态可用
     +----------------------------------------------------------
     * @参数 void
     +----------------------------------------------------------
     * @return array
     +----------------------------------------------------------
     */
	function GetDebugInfo()
	{
		if($this->debug){
			$this->debugInfo['TotalTime'] = $this->queryTime;
			return $this->debugInfo;
		}
		return array();
	}


	function GetMicrotime()
	{
		list($usec, $sec) = explode(" ", microtime());
		return ((float)$usec + (float)$sec);
	}

	function Halt($msg)
	{
		if($this->debug){
			$message = "<html>\n<head>\n";
			$message .= "<meta content=\"text/html; charset=UTF-8\" http-equiv=\"Content-Type\">\n";
			$message .= "<STYLE TYPE=\"text/css\">\n";
			$message .=  "<!--\n";
			$message .=  "body,td,p,pre {\n";
			$message .=  "font-family : Verdana, Arial, Helvetica, sans-serif;font-size : 12px;\n";
			$message .=  "}\n";
			$message .=  "</STYLE>\n";
			$message .= "</head>\n";
			$message .= "<body bgcolor=\"#EEEEEE\" text=\"#000000\" link=\"#006699\" vlink=\"#5493B4\">\n";
			$message .= "<font size=10><b>Stuhome</b></font>\n<hr NOSHADE SIZE=1>\n";


			$content = "<p>数据库出错:</p><pre><b>".htmlspecialchars($msg)."</b></pre>\n";
			$content .= "<b>错误信息描述</b>: ".mysql_error()."\n<br>";
			$content .= "<b>错误代码</b>: ".mysql_errno()."\n<br>";
			$content .= "<b>时间</b>: ".date("Y-m-d @ H:i")."\n<br>";
			$content .= "<b>出错文件</b>: http://".$_SERVER['HTTP_HOST'].getenv("REQUEST_URI")."\n<br>";
			$content .= "<b>Referer</b>: ".getenv("HTTP_REFERER")."\n<br><br>";

			die($content);
		}
		else{
			$content = "程序出错(美工需要做一个出错页面)";
		}
	}	
}
?>