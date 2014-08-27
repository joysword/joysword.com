<?php
	require(D_P."include/page.class.php");
	$sql = "SELECT COUNT(id) AS COUNT FROM `msg`";
	$count = $db->FetchFirst($sql);
	$page = new Page($count, 'p', $pageSize, array(), "", $pageNum);
	$pageBar = $page->GetOutput(0); 
	$lim = $page->GetLimit();

	$sql="SELECT `user`,`content`,`addtime` FROM `msg` WHERE 1 ORDER BY `addtime` DESC LIMIT $lim";
	$content=$db->FetchAllArray($sql);
	foreach ($content as &$value) 
	{
		$value['addtime']=date('Y-m-d H:i:s',$value['addtime']);
$value['content']=html_entity_decode($value['content']);
	}
	
	$smarty->assign('content',$content);
	$smarty->assign('pageBar',$pageBar);
	$smarty->display('main.html');
	

?>