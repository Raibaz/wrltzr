$.getScript('api.js', function() {
	console.log('finished loading api.js');	
});


var available_songs = {};
var played_songs = [];
var current_song;
var next_song;
var same_artist_bump = 6;

var global_configuration = {
	use_normalized_scores: true
};

function init_settings() {
	$('#artist_bump').slider({
		orientation: "vertical",
		min: 0,
		max: 9,
		step: 1,
		value: 9 - same_artist_bump,
		animate: true,
		slide: function(event, ui) {			
			new_bump = 10 - ui.value;
			for(key in available_songs) {
				cur_song = available_songs[key];
				if(cur_song.artist.name === current_song.artist.name || cur_song.artist.name === $('#tags').val()) {
					console.log("Bumping song " + key);
					cur_song.score = cur_song.score / same_artist_bump * new_bump;
				}
			}
			same_artist_bump = new_bump;
		}
	});
}

function add_service(service) {
	if(service.search_tags || service.search_artist) {
		$('#available_services').append('<span class="service"><label for="' + service.name + '">' + service.name + '</label><i class="icon-question-sign icon-white service-icon" title="' + service.tooltip_text + '"></i><div id="' + service.name + '_slider" class="service-weight-slider"/><input type="checkbox" checked name="' + service.name + '" id="' + service.name + '"/></span>');		
		$('.service-icon').tooltip();
		$('#' + service.name + "_slider").slider({
			orientation: "vertical",
			min: 0.1,
			max: 5,
			step: 0.1,
			value: service.weight,
			animate: true,
			slide: function(event, ui) {								
				this_id = $(this).attr('id');
				this_id = this_id.replace('_slider', '');

				checkbox = $('#' + this_id);				
				if(!checkbox.prop('checked')) {
					checkbox.prop('checked', true);
				}
				
				console.log("Setting " + this_id + " weight to " + ui.value);
				service = get_service(this_id);				
				recompute_scores(service, ui.value);
			}
		});
	}
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
	if(next_song) {
		$('#next_song_info').html(next_song.artist.name + " - " + next_song.name);
	}
}

function play_next_song() {	
	current_song = next_song;
	next_song = undefined;
	delete available_songs[current_song.key];
	played_songs[current_song.key] = current_song;

	//Stop any Soundcloud players
	pause_link = $('.playing a.sc-pause');
	if(pause_link) {
		pause_link.click(); 
	}

	if(current_song.embed && current_song.embed.code) {			
		$('#player').html(current_song.embed.code);
		$('#song_info').html(build_song_info(current_song)).show();
		if(current_song.embed.service.name == get_service('youtube').name) {								
			start_youtube_player();						
		} else if(current_song.embed.service.name == get_service('Soundcloud').name) {
			console.log("starting soundcloud");
			start_soundcloud_player(current_song.embed);
		}
	} else {
		console.log("embed not found, looking for it with key = " + current_song.embed.key);
		current_song.embed.service.search_embed(current_song.embed, function(embed) {			
			if(!embed) {
				delete available_songs[current_song.embed.key];
				compute_next_song();
				play_next_song();
			} else {
				console.log("Loaded embed: " + embed.service_id);
				current_song.embed.code = embed.code;
				$('#player').html(embed.code);
				$('#song_info').html(build_song_info(current_song)).show();
				if(embed.service_name == get_service('youtube').name) {								
					start_youtube_player();						
				} else if(embed.service_name == get_service('Soundcloud').name) {					
					start_soundcloud_player(embed);
				}				
			}
		});
	} 
	add_similar_songs();
	compute_next_song();
}

function build_song_info(song) {

	if(song.embed.service.search_another_embed == undefined) {
		$('#change_embed').hide();
	} else {
		$('#change_embed').show();
	}
	ret =  '<div class="track-info">' + song.artist.name + " - " + song.name + '</div>';
	ret += '<div class="service-info">Found via ' + song.service.name + '</div>';

	$('#twitter-iframe').attr('src', '//platform.twitter.com/widgets/tweet_button.html?url=http://raibaz.github.com/wrltzr&text=I%20just%20listened%20to%20' + escape(song.name) + '%20by%20' + escape(song.artist.name) + '%20on%20%23Wrltzr&count=none');

	return ret;

}

function add_similar_songs() {
	if(!current_song || current_song == undefined) {
		return;
	}
	$('#available_services :checked').each(function(index, value) {
		service = get_service($(this).attr('id'));
		if(service.get_similar_artists) {			
			service.get_similar_artists(current_song, function(artists) {
				if(typeof(artists) == 'string') {
					console.log("No similar artists found on " + artists + " for " + current_song.key);
					return;
				}
				console.log("Found similar artists: " + artists);
				$.each(artists, function(index, value) {
					service.search_artist(value, add_songs);
				});
			});
		}
		service.get_song_tags(current_song, function(tags) {
			console.log("Found tags " + tags);
			if(!tags) {
				return;
			}
			$.each(tags, function(index, value) {
				service.search_tags(value, add_songs);
			});
		});
	});
}

function add_songs(songs) {
	$.each(results, function(index, value) {
		if(available_songs[value.key]) {
			console.log("Found song " + value.key + ", adding " + value.score + " to its score");
			available_songs[value.key].score += value.score;			
			//TODO if there is a better embed, replace it it
		} else {
			available_songs[value.key] = value;			
		}

		if(current_song && current_song.artist.name === value.artist.name) {
			console.log("Adding a song from current artist ==> score bump!");
			available_songs[value.key].score *= same_artist_bump;			
		}

		if(value.artist.name === $('#tags').val() && $('#search_type').val() === 'artist') {
			console.log("Adding a song by searched artist ==> score bump!");
			available_songs[value.key].score *= same_artist_bump;
		}

		if(played_songs[value.key]) {
			console.log("Found song " + value.name + " already played, killing its score");
			available_songs[value.key].score /= 5;
		}
		
		var li_id = value.service.name + "_" + index;
		if(value.artist && value.artist.name && value.name) {
				li = '<li class="result" id="' + li_id + '"><span class="song_info">' + value.artist.name + " - " + value.name + '</span></li>';
				$('#results').append(li);
		}
		if(value.embed) {								
			value.embed.service.search_embed(value.embed, function(embed_data) {				
				if(!embed_data) {
					delete available_songs[value.key];					
				} else {
					value.embed.code = embed_data.code;					
				}
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
					_gaq.push(['_trackEvent', 'user_inputs', 'song_finished', current_song.key, 0, true]);				
				}
			}
		}
	});
}

function start_soundcloud_player(embed) {
	if(!embed) {
		embed = current_song.embed;
	}	
	$('#player .sc-player').scPlayer({
		links: [{url: embed.key, title: embed.title}],
		autoPlay: true,
		apiKey: sound_cloud.client_id,
		onPlayerTrackFinish: function() {
			play_next_song();
			_gaq.push(['_trackEvent', 'user_inputs', 'song_finished', current_song.key, 0, true]);				
		}
	});

}

function update_all_scores(coeff) {
	current_song.service.get_song_tags(current_song, function(tags) {
		$.each(tags, function(index, value) {
			current_song.service.search_tags(value, function(songs) {
				$.each(songs, function(index, value) {					
					if(available_songs[value.key]) {
						artist_coeff = 1;
						if($('#search_type').val() === 'artist' && value.artist.name === current_song.artist.name) {
							console.log("Further bump for same artist");
							artist_coeff = same_artist_bump;
						}
						console.log("Updating score for " + value.key + " by adding " + (value.score * coeff * artist_coeff));
						available_songs[value.key].score += (value.score * coeff * artist_coeff);
					}
				});
				//TODO: this should be at the end of all tags, not here at the end of every tag				
				compute_next_song();				
			})
		});
	});
}

function recompute_scores(service, new_weight) {
	for(cur in available_songs) {
		if(!available_songs.hasOwnProperty(cur))  {
			continue;
		}
		loop_song = available_songs[cur];
		if(loop_song.service && loop_song.service.name == service.name) {
			console.log("Updating score for " + cur + " from " + loop_song.score + " to " + ((loop_song.score / loop_song.service.weight) * new_weight));
			loop_song.score = (loop_song.score / loop_song.service.weight) * new_weight;
		}
	}
	service.weight = new_weight;
	if(available_songs)
	compute_next_song();
}

function play_random_song() {
	var available_songs_count = 0;
	for(key in available_songs) {
		if(available_songs.hasOwnProperty(key)) {
			available_songs_count++;
		}
	}
	var song_index = Math.floor(Math.random() * available_songs_count);	
	for(key in available_songs) {		
		if(!available_songs.hasOwnProperty(key)) {
			continue;
		}
		if(played_songs[key]) {
			continue;
		}
		if(song_index-- <= 0) {
			next_song = available_songs[key];
			play_next_song();
			available_songs = {};
			available_songs_count = 0;
			played_songs = {};
			$('#results').empty();
			add_similar_songs();
			compute_next_song();
			break;
		}
	}
}

function reload_embed() {
	console.log("reload_embed");
	current_song.embed.service.search_another_embed(current_song.embed, function(new_embed) {
		console.log("Found other embed");
		console.log(new_embed);
		if(!new_embed || new_embed == undefined) {
			delete available_songs[current_song.key];
			play_next_song();
		} else {
			current_song.embed.code = new_embed.code;
			next_song = current_song;
			play_next_song();
		}
	});
}

function delete_next_song() {
	delete available_songs[next_song.key];
	compute_next_song();
}