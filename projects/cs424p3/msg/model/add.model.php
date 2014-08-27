<?php
	HtmlEntitie($_POST);
	extract($_POST);
	$sql="INSERT INTO `msg` SET `user`='$user',`content`='$content',`addtime`='".time()."'";
	if ($db->Query($sql)) 
	{
            echo "<script>location='index.php'</script>";
	}
	else 
	{
	    echo "<script>alert('Not successful! Something is wrong!');location='index.php'</script>";
	}
	exit;
?>