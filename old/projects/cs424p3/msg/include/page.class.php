<?php 
class Page
{
	//标识页码的变量，默认为p
	public $pageVar;

	//除了页码变量外其他需要传递的变量
	public $varStr;

	//每页显示的条数
	public $pageSize;

	//显示的页号数
	public $pageNum;

	//总页数
	public $totalPage;

	//总记录数
	public $totalRecord;

	//链接文件，默认是本文件
	public $linkFile;

	//输出页码结果
	public $output;

	//当前页数
	public $curPage;

	//构造函数
	function __construct($totalRecord, $pageVar = 'p', $pageSize = 20, $varArr = array(), $linkFile = "", $pageNum = 10)
	{
		$this->totalRecord	= $totalRecord;
		$this->pageVar		= $pageVar;
		$this->pageSize		= $pageSize;
		$this->linkFile		= ($linkFile == "") ? $_SERVER['PHP_SELF'] : $linkFile;
		$this->pageNum		= $pageNum;

		//设置要传递的其他变量
		$this->varStr		= "";
		foreach($varArr as $key=>$value){
			$this->varStr .= "&".$key."=".rawurlencode($value);
		}

		//计算总页数
		$this->totalPage = ceil($this->totalRecord / $this->pageSize);

		//获取当前页数
		$this->curPage = isset($_GET[$pageVar]) ? intval($_GET[$pageVar]) : 1;		
		$this->curPage > $this->totalPage && $this->curPage = $this->totalPage;
		$this->curPage < 1 && $this->curPage = 1;
	}

	function GetOutput($type)
	{
		//样式1
		$this->output[0] = "";

		//样式2
		$this->output[1] = "";

		//样式3
		$this->output[2] = "";

		if($this->totalPage > 1){
			
			//前导部分
			if($this->curPage > $this->pageNum){
				$this->output[0].='<a href="'.$this->linkFile.'?'.$this->pageVar.'='.($this->curPage-$this->pageNum).($this->varStr).'" title="前'.$this->pageNum.'页">&lt;&lt;</a>&nbsp;';
			}
			if($this->curPage > 1){
				$this->output['0'].='<a href="'.$this->linkFile.'?'.$this->pageVar.'='.($this->curPage-1).($this->varStr).'" title="前1页">&lt;</a>&nbsp;';
			}

			//页码部分
            $start	= floor(($this->curPage - 1) / $this->pageNum) * $this->pageNum + 1;
            $end	= $start + $this->pageNum - 1;
			$start <= 0 && $start = 1;
			$end > $this->totalPage && $end = $this->totalPage;

			for($i = $start; $i <= $end; $i++){
				if($this->curPage == $i){
					$this->output[0] .= '<font color="red">'.$i.'</font>&nbsp;';    //输出当前页数
					$this->output[1] .= '<font color="red">'.$i.'</font>&nbsp;';    //输出当前页数
				}
				else {
                    $this->output[0] .= '<a href="'.$this->linkFile.'?'.$this->pageVar.'='.$i.$this->varStr.'">['.$i.']</a>&nbsp;';    //输出页数

					if($i != $end)
						$this->output[1] .= '<a href="'.$this->linkFile.'?'.$this->pageVar.'='.$i.$this->varStr.'">['.$i.']</a>&nbsp;';    //输出页数
                }
				
				if($i == $end){
					$this->output[1] .= "...".'<a href="'.$this->linkFile.'?'.$this->pageVar.'='.$this->totalPage.$this->varStr.'">['.$this->totalPage.']</a>&nbsp;';
				}
			}

			//后导部分
			if($this->curPage < $this->totalPage){
				$this->output[0] .= '<a href='.$this->linkFile.'?'.$this->pageVar.'='.($this->curPage + 1).($this->varStr).' title="下一页">&gt;</a>&nbsp;';
			}
            if($this->totalPage > $this->pageNum && ($this->totalPage - $this->curPage) >= $this->pageNum ) {
				$this->output[0].='<a href="'.$this->linkFile.'?'.$this->pageVar.'='.($this->curPage + $this->pageNum).($this->varStr).'" title="下'.$this->pageNum.'页">&gt;&gt;</a>';
			}
		}

		return $this->output[$type];
	}

	function GetLimit()
	{
		return (($this->curPage - 1) * $this->pageSize).','.$this->pageSize;
	}
}


////////////////////////debug

//header("content-type:text/html;charset=utf-8");
//$page = new Page(0);
//$pageBar = $page->GetOutput(0);
//echo $pageBar;
?>