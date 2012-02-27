$.getScript('api.js', function() {
	console.log('finished loading api.js');
	populate_available_services();
});

var available_songs = [];
var played_songs = [];
var current_song;

function populate_available_services() {
	$.each(available_services, function(index, value) {
		$('#available_services').append('<label for"' + value.name + '">' + value.name + '</label><input type="checkbox" name="' + value.name + '" id="' + value.name + '"/>');
	});
}

function reorder_songs() {
	//TODO :controlla se c'è già, in caso aggiungi lo score
	available_songs.sort(function(prev, next) {
		return prev.score - next.score;
	});
	
}

function play_next_song() {
	current_song = available_songs.shift();
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
}

function search_similar_songs() {
	current_song.service.get_song_tags(current_song, function(tags) {
		console.log(tags);
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