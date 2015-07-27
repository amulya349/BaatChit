$(function(){
	$('body').keypress(function(e){
		if(e.which == 13) {
			e.preventDefault();
			window.location = '/chat'
		}

	});
});