(function() {
	url = "http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=55D603DABDA11AA6093988EFF7F61D35&steamid=76561197960434622";
	ret = "";
	$.getJSON(url, function(data) {
		$.each(data.games, function(idx, val) {
			ret+='<div class="col-md-3"><div class="container>';
			ret+="<p><img src='http://media.steampowered.com/steamcommunity/public/images/apps/"+val['add_id']+"/"+val['img_logo_url']+".jpg'></img></p>"
			ret+="<p><img src='http://media.steampowered.com/steamcommunity/public/images/apps/"+val['add_id']+"/"+val['img_icon_url']+".jpg'></img></p>"
			ret+="<p>"+val['name']+"</p>";
			ret+="<p>Last 2 weeks: "+val['playtime_2weeks']+"</p>";
			ret+="</div></div>";
		})
		ret+="</div>";
		$("#steam-feed").innerHtml(ret);
	});
})();