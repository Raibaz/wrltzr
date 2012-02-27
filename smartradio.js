$.getScript('api.js', function() {
	console.log('finished loading api.js');
	populate_available_services();
});

var available_songs = {};
var played_songs = [];
var current_song;
var next_song;

function populate_available_services() {
	$.each(available_services, function(index, value) {
		$('#available_services').append('<label for"' + value.name + '">' + value.name + '</label><input type="checkbox" name="' + value.name + '" id="' + value.name + '"/>');
	});
}

function compute_next_song() {
	found = undefined;
	$.each(available_songs, function(index, value) {
		if(!found || found.score < value.score) {
			found = value;
		}
	});
	console.log("Computed next song");
	next_song = found;
	console.log(next_song);
	return next_song;
}

function play_next_song() {
	current_song = next_song;
	next_song = undefined;
	delete available_songs[current_song.key];
	played_songs[current_song.key] = current_song;
	if(current_song.embed.code) {
		$('#player').html(current_song.embed.code);
		start_youtube_player();
	} else {
		current_song.embed.service.search_song(current_song.embed.key, function(embed) {
			current_song.embed.code = embed.code;
			$('#player').html(embed.code);
			if(embed.service_name === get_service('youtube').name) {
				console.log('now calling youtube player api');
				start_youtube_player();
			}
		});
	} 
	search_similar_songs();
	compute_next_song();
}

function search_similar_songs() {
	current_song.service.get_song_tags(current_song, function(tags) {
		console.log("Found tags " + tags);
		$.each(tags, function(index, value) {
			current_song.service.search_tags(value, add_songs);
		});
	});
}

function add_songs(songs) {
	$.each(results, function(index, value) {
		if(available_songs[value.key]) {
			console.log("Found song " + value.key + ", adding " + value.score + " to its score");
			available_songs[value.key].score += value.score;
		} else {
			available_songs[value.key] = value;
		}

		
		var li_id = value.service.name + "_" + index;
		if(value.artist && value.artist.name && value.name) {
				li = '<li class="result" id="' + li_id + '"><span class="song_info">' + value.artist.name + " - " + value.name + '</span></li>';
				$('#results').append(li);
		}
		if(value.embed) {								
			value.embed.service.search_song(value.embed.key, function(embed_data) {	
				value.embed.code = embed_data.code;
					//$('#' + li_id).append(embed_data.code);
			});
		}
	});
}

function start_youtube_player() {
	player = new YT.Player('youtube-player', {
		events: {
			'onReady': function(event) {
				event.target.playVideo();
			}, 'onStateChange': function(event) {
				if(event.data === YT.PlayerState.ENDED) {
					play_next_song();
				}
			}
		}
	});
}