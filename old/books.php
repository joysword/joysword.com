<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<title>Books | joysword</title>
	<meta http-equiv="refresh" content="3600">
	<link rel="shortcut icon" href="favicon.ico">
	<link rel="stylesheet" type="text/css" media="screen" href="css/style.css">
</head>

<body>
<!--============================= header area ==============================-->
<div id="header">
<h1>Shi Yin</h1>
<p>the longing for love, the search for knowledge, and unbearable pity for the suffering of mankind</p>
</div>
<!--=========================== end of header area ==========================-->

<!--============================= navigation bar ============================-->
<div id="nav_ver">
<p><a href="index.html">introduction 简介</a></p>
<p><a href="courses.html">courses 课程</a></p>
<p><a href="projects.html">projects 项目</a></p>
<p><a href="research.html">research 科研</a></p>
<p><a href="experience.html">experience 经历</a></p>
<p><a href="skills.html">skills 技能</a></p>
<p class="last"><a href="awards.html">awards 奖励</a></p>
<br />
<p class="last"><a href="portfolio.html">portfolio</a></p>
<br />
<p><a href="books.php">books 读的书籍</a></p>
<p><a href="movies.html">movies 看的电影</a></p>
<p><a href="games.html">games 玩的游戏</a></p>
<p><a href="places.html">places 去的地方</a></p>
<p class="last"><a href="events.html">events 做的事情</a></p>
<br />
<p><a href="http://blog.joysword.com">中文博客</a></p>
<p><a href="http://enblog.joysword.com">English Blog</a></p>
<br />
<p><a href="/">fiveis.us</a></p>
<p><a href="http://www.evl.uic.edu/">EVL</a></p>
</div>
<!--========================  end of navigation bar ========================-->

<!--============================= main area =================================-->
<div id="main">
<h2>Books I'm reading</h2>
<table width=90%>
<?php
$url='http://api.douban.com/v2/book/user/joysword/collections?count=100&status=reading';
$text = file_get_contents($url);
$obj = json_decode($text);
?>
<?php
for ($line=0;$line<($obj->total - 1)/4 + 1;$line++) {
echo "<tr>";
for ($i=0;$i<4;$i++) {
	echo "<td>";
	if ($line*4+$i < $obj->total) {
	echo "<img src=\"";
	echo $obj->collections[$line*4+$i]->book->image;
	echo "\" height=\"200\">";}
	echo "</td>";
}
echo "</tr><tr>";
for ($i=0;$i<4;$i++) {
	echo "<td>";
	if ($line*4+$i < $obj->total) {
	echo $obj->collections[$line*4+$i]->book->title;}
	echo "</td>";
}
echo "</tr>";
}
?>
</tr>
</table>
<h2>Books I wish to read</h2>
<table width=90%>
<?php
$url='http://api.douban.com/v2/book/user/joysword/collections?count=100&status=wish';
$text = file_get_contents($url);
$obj = json_decode($text);
?>
<?php
for ($line=0;$line<($obj->total - 1)/4 + 1;$line++) {
echo "<tr>";
for ($i=0;$i<4;$i++) {
	echo "<td>";
	if ($line*4+$i < $obj->total) {
	echo "<img src=\"";
	echo $obj->collections[$line*4+$i]->book->image;
	echo "\" height=\"200\">";}
	echo "</td>";
}
echo "</tr><tr>";
for ($i=0;$i<4;$i++) {
	echo "<td>";
	if ($line*4+$i < $obj->total) {
	echo $obj->collections[$line*4+$i]->book->title;}
	echo "</td>";
}
echo "</tr>";
}
?>
</tr>
</table>
<h2>Books I read</h2>
<table width=90%>
<?php
$url='http://api.douban.com/v2/book/user/joysword/collections?count=100&status=read';
$text = file_get_contents($url);
$obj = json_decode($text);
?>
<?php
for ($line=0;$line<($obj->total - 1)/4 + 1;$line++) {
echo "<tr>";
for ($i=0;$i<4;$i++) {
	echo "<td>";
	if ($line*4+$i < $obj->total) {
	echo "<img src=\"";
	echo $obj->collections[$line*4+$i]->book->image;
	echo "\" height=\"200\">";}
	echo "</td>";
}
echo "</tr><tr>";
for ($i=0;$i<4;$i++) {
	echo "<td>";
	if ($line*4+$i < $obj->total) {
	echo $obj->collections[$line*4+$i]->book->title;}
	echo "</td>";
}
echo "</tr>";
}
?>
</tr>
</table>
</div>
<!--======================== end of main area ===============================-->

<!--============================== footer ===================================-->
<div id="footer">
	<p>Last Updated: 2013-2-28 | &copy;copyright 2013 Shi Yin</p>
</div>
<!--============================= end of footer =============================-->


</body></html>