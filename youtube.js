var youtube = {
	name: "youtube",
	search_tags: function(tags, callback) {
	}, 
	search_embed: function(embed, callback) {		
		if(embed && embed.code) {
			callback();
			return;
		}
		if(!embed ||  !embed.key) {
			callback();
			return;
		}
		$.getJSON('https://gdata.youtube.com/feeds/api/videos?q=' + embed.key + '&orderby=relevance&v=2&max-results=1&alt=json&category=music', function(data) {			
			if(data.feed.openSearch$totalResults.$t == 0) {
				callback();
				return;
			}
			if(typeof(data.feed.entry) == 'undefined') {
				callback();
				return;
			}		
			entry = data.feed.entry[0];							
			resp = {
				service_name: youtube.name,
				service_id: entry.media$group.yt$videoid.$t,
				title: entry.media$group.media$title.$t,
				code: '<iframe id="youtube-player" class="youtube-player" type="text/html" height="390" src="http://www.youtube.com/embed/' + entry.media$group.yt$videoid.$t + '?enablejsapi=1&origin=' + escape('http://localhost:81'	) +'" frameborder="0"></iframe>'
			}
			callback(resp);
		});
	}
};
available_services['youtube'] = youtube;