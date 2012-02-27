var available_services = {};

var get_service = function(service_name) {
	return available_services[service_name];
}

var youtube = {
	name: "youtube",
	search_tags: function(tags, callback) {
	}, search_song: function(title, callback) {		
		$.getJSON('https://gdata.youtube.com/feeds/api/videos?q=' + title + '&orderby=relevance&v=2&max-results=1&alt=json', function(data) {
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

var lastfm = {
	name: "lastfm",
	search_results_count: 20,
	search_tags: function(tags, callback) {
		$.getJSON('http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=' + tags + '&limit=' + lastfm.search_results_count + '&api_key=f1ad626c3a2d588bfd87788d38606b95&format=json', function(data) {				
			console.log(data);
			results = new Array();
			$.each(data.toptracks.track, function(index, value) {
				var lookup_service = get_service('youtube');
				lastfm.build_song(value, lookup_service, function(song) {
					results.push(song);					
				});
			});	
			results.sort(function(prev, next) {
				return prev.score - next.score;
			});
			callback(results);
		});
	},
	build_song: function(service_song, lookup_service, callback) {	
		ret = {
			key: lastfm.name + "_" + service_song.artist.name + "_" + service_song.name,
			service: lastfm,
			name: service_song.name,
			artist: {
				name: service_song.artist.name
			}, embed: {
				service: lookup_service,
				key: service_song.name
			}, score: lastfm.search_results_count - service_song['@attr'].rank
		};
		callback(ret);
	},
	get_song_tags: function(song, callback) {
		if(song.service == lastfm && song.service_id) {
			//TODO ricerca per mbid
		} else {
			console.log('get_song_tags');
			$.getJSON('http://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist=' + escape(song.artist.name) + '&track=' + escape(song.name) + '&api_key=f1ad626c3a2d588bfd87788d38606b95&format=json', function(data) {	
				tags = [];
				$.each(data.track.toptags.tag, function(index, value) {
					tags.push(value.name);
				});
				callback(tags);
			});
		}
			
	}
};

available_services['lastfm'] = lastfm;

var hype_machine = {
	name: "Hype machine"
};

available_services['hype_machine'] = hype_machine;