var youtube = {
	name: "youtube",	
	search_embed: function(embed, callback) {		
		youtube.search_helper(embed, 1, true, callback);
	},
	search_another_embed: function(embed, callback) {
		console.log("searching another embed for " + embed.key);
		youtube.search_helper(embed, 2, false, callback);
	},
	search_helper: function(embed, max_results, use_first, callback) {
		if(embed && embed.code && use_first) {
			callback();
			return;
		}
		if(!embed || !embed.key) {
			callback();
			return;
		}
		$.getJSON('https://gdata.youtube.com/feeds/api/videos?q=' + embed.key + '&orderby=relevance&v=2&max-results=' + max_results + '&alt=json&category=music', function(data) {					
			if(data.feed.openSearch$totalResults.$t == 0) {
				callback();
				return;
			}
			if(typeof(data.feed.entry) == 'undefined') {
				callback();
				return;
			}		
			if(use_first) {
				entry = data.feed.entry[0];							
			} else {
				if(data.feed.entry[1] != undefined) {
					entry = data.feed.entry[1];
				} else {
					callback();
				}
			}
			resp = {
				service_name: youtube.name,
				service_id: entry.media$group.yt$videoid.$t,
				title: entry.media$group.media$title.$t,
				code: '<iframe id="youtube-player" class="youtube-player" type="text/html" height="290" src="http://www.youtube.com/embed/' + entry.media$group.yt$videoid.$t + '?enablejsapi=1&origin=' + escape(window.location.origin) +'" frameborder="0"></iframe>'
			}
			callback(resp);
		});
	}	
};
available_services['youtube'] = youtube;