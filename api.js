var available_services = {};

var get_service = function(service_name) {
	return available_services[service_name];
}

var youtube = {
	name: "youtube",
	search_tags: function(tags, callback) {
	}, search_song: function(title, callback) {		
		$.getJSON('https://gdata.youtube.com/feeds/api/videos?q=' + title + '&orderby=relevance&v=2&max-results=1&alt=json', function(data) {
			if(!data.feed.entry) {
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

var lastfm = {
	name: "lastfm",
	search_results_count: 20,
	search_all: function(query, callback) {
		lastfm.search_tags(query, callback);
		lastfm.search_artist(query, callback);
	},
	search_helper: function(url, callback) {
		$.getJSON(url, function(data) {				
			console.log(data);
			results = new Array();
			var lookup_service = get_service('youtube');
			$.each(data.toptracks.track, function(index, value) {				
				lastfm.build_song(value, lookup_service, function(song) {
					results.push(song);					
				});
			});				
			callback(results);
		});
	},
	search_artist: function(query, callback) {
		lastfm.search_helper('http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=' + escape(query) + '&limit=' + lastfm.search_results_count + '&api_key=f1ad626c3a2d588bfd87788d38606b95&format=json', callback);
	},
	search_tags: function(tags, callback) {
		lastfm.search_helper('http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=' + escape(tags) + '&limit=' + lastfm.search_results_count + '&api_key=f1ad626c3a2d588bfd87788d38606b95&format=json', callback);
	},
	build_song: function(service_song, lookup_service, callback) {	
		ret = {
			key: lastfm.name + "_" + service_song.artist.name + "_" + service_song.name,
			service_id: service_song.mbid,
			service: lastfm,
			name: service_song.name,
			artist: {
				name: service_song.artist.name
			}, embed: {
				service: lookup_service,
				key: service_song.artist.name + " " + service_song.name
			}, score: lastfm.compute_score(service_song)
		};
		callback(ret);
	},
	compute_score: function(service_song) {
		return (lastfm.search_results_count - service_song['@attr'].rank) * lastfm.weight;
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
	name: "Hype machine",
	search_results_count: 20,
	search_all: function(query, callback) {		
		hype_machine.search_tags(query, callback);
		hype_machine.search_artist(query, callback);
	},
	search_helper: function(url, callback) {
		$.getJSON(url, function(data) {			
			results = new Array();
			lookup_service = get_service('youtube');
			$.each(data, function(index, value) {
				if(value.title) {
					value.index = index;
					hype_machine.build_song(value, lookup_service, function(song) {
						results.push(song);
					});
				}
			});			
			callback(results);
		});
	},
	search_artist: function(query, callback) {
		hype_machine.search_helper('http://hypem.com/playlist/search/' + escape(query) + '/json/1/data.js', callback);
	},
	search_tags: function(tags, callback) {
		hype_machine.search_helper('http://hypem.com/playlist/tags/' + escape(tags) + '/json/1/data.js', callback);
	},
	build_song: function(service_song, lookup_service, callback) {
		ret = {
			key: hype_machine.name + "_" + service_song.artist + "_" + service_song.title,
			service: hype_machine,
			name: service_song.title,
			service_id: service_song.mediaid,
			artist: {
				name: service_song.artist
			}, embed: {
				service: lookup_service,
				key: service_song.artist + " " + service_song.title
			}, score: hype_machine.compute_score(service_song)
		};
		callback(ret);
	},
	compute_score: function(service_song) {
		posted_count_modifier = 0.1;
		return ((hype_machine.search_results_count - service_song.index) + (service_song.posted_count * posted_count_modifier)) * hype_machine.weight;
	},
	get_song_tags: function(song, callback) {
		if(song.service == hype_machine) {
			$.getJSON('http://hypem.com/playlist/song/' + song.service_id + '/json/1/data.js', function(data) {
				console.log(data);			
				callback(data['0'].tags);
			});
		} else {
			//TODO ricerca per titolo e artista
		}
	}
};

available_services['Hype machine'] = hype_machine;