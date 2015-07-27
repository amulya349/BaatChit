// This file is executed in the browser, when people visit /chat/<random id>

$(function(){

	var id = ''
	var socket = io();
	
	// variables which hold the data for each person
	var name = "",
		email = "",
		img = "../img/unnamed.jpg",
		friend = "";

	// cache some jQuery objects
	var section = $(".section"),
		footer = $("footer"),
		onConnect = $(".connected"),
		inviteSomebody = $(".invite-textfield"),
		personInside = $(".personinside"),
		chatScreen = $(".chatscreen"),
		left = $(".left"),
		noMessages = $(".nomessages"),
		tooManyPeople = $(".toomanypeople");

	// some more jquery objects
	var chatNickname = $(".nickname-chat"),
		leftNickname = $(".nickname-left"),
		loginForm = $(".loginForm"),
		// yourName = $("#yourName"),
		// yourEmail = $("#yourEmail"),
		hisName = $("#hisName"),
		hisEmail = $("#hisEmail"),
		chatForm = $("#chatform"),
		textarea = $("#message"),
		messageTimeSent = $(".timesent"),
		chats = $(".chats");

	// these variables hold images
	var ownerImage = $("#ownerImage"),
		leftImage = $("#leftImage"),
		noMessagesImage = $("#noMessagesImage");


	// on connection to server get the id of person's room
	socket.on('connect', function(data){
		// id = data.id
		// socket.emit('load', id);
		// console.log("Connected to server")
	});

	socket.on('getid', function(data){
		id = data.id
		// console.log("Got the id: "+data.id)
		socket.emit('load', id);
	})

	// save the gravatar url
	// socket.on('img', function(data){
	// 	img = data;
	// });

	// receive the names and avatars of all people in the chat room
	socket.on('peopleinchat', function(data){
		if(data.number === 0){
			showMessage("connected");
			name = $.trim(id.toString());
			email = ''
			showMessage("inviteSomebody");

			// call the server-side function 'login' and send user's parameters
			socket.emit('login', {user: name, id: id});
		}
		else if(data.number === 1) {
			showMessage("personinchat",data);
			name = $.trim((id+1).toString());
			if(name == data.user){
				alert("There already is a \"" + name + "\" in this room!");
				return;
			}
			email = ''

			socket.emit('login', {user: name, id: id});
		}
	});

	// Other useful 

	socket.on('startChat', function(data){
		// console.log(data);
		if(data.boolean && data.id == id) {

			chats.empty();

			if(name === data.users[0]) {

				showMessage("youStartedChatWithNoMessages",data);
			}
			else {

				showMessage("heStartedChatWithNoMessages",data);
			}

			chatNickname.text(friend);
		}
	});

	socket.on('leave',function(data){

		if(data.boolean && id==data.room){

			showMessage("somebodyLeft", data);
			chats.empty();
		}

	});

	socket.on('receive', function(data){

		showMessage('chatStarted');

		if(data.msg.trim().length) {
			createChatMessage(data.msg, data.user, data.img, moment());
			scrollToBottom();
		}
	});

	textarea.keypress(function(e){

		// Submit the form on enter

		if(e.which == 13) {
			e.preventDefault();
			chatForm.trigger('submit');
		}

	});

	chatForm.on('submit', function(e){

		e.preventDefault();

		// Create a new chat message and display it directly

		showMessage("chatStarted");

		if(textarea.val().trim().length) {
			createChatMessage(textarea.val(), name, img, moment());
			scrollToBottom();

			// Send the message to the other person in the chat
			socket.emit('msg', {msg: textarea.val(), user: name, img: img});

		}
		// Empty the textarea
		textarea.val("");
	});

	// Update the relative time stamps on the chat messages every minute

	setInterval(function(){

		messageTimeSent.each(function(){
			var each = moment($(this).data('time'));
			$(this).text(each.fromNow());
		});

	},60000);

	// Function that creates a new chat message

	function createChatMessage(msg,user,imgg,now){

		var who = '';

		if(user===name) {
			who = 'me';
		}
		else {
			who = 'stranger';
		}

		var li = $(
			'<li class=' + who + '>'+
				'<div class="image">' +
					'<img src=' + imgg + ' />' +
					'<b>'+ who +'</b>' +
					'<i class="timesent" data-time=' + now + '></i> ' +
				'</div>' +
				'<p></p>' +
			'</li>');

		// use the 'text' method to escape malicious user input
		li.find('p').text(msg);
		// li.find('b').text(user);

		chats.append(li);

		messageTimeSent = $(".timesent");
		messageTimeSent.last().text(now.fromNow());
	}

	function scrollToBottom(){
		$("html, body").animate({ scrollTop: $(document).height()-$(window).height() },1000);
	}

	function isValid(thatemail) {

		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(thatemail);
	}

	function showMessage(status,data){

		 if(status === "inviteSomebody"){
			$("#link").text(window.location.href);

			onConnect.fadeOut(500, function(){
				inviteSomebody.fadeIn(500);
			});
		}
		else if(status === "youStartedChatWithNoMessages") {

			left.fadeOut(500, function() {
				inviteSomebody.fadeOut(500,function(){
					noMessages.fadeIn(500);
					footer.fadeIn(500);
				});
			});

			friend = data.users[1];
			// noMessagesImage.attr("src",data.avatars[1]);
			// noMessagesImage.attr("src", "http://gdpit.com/avatars_pictures/comics-creatures/cocr10.jpg");

		}
		else if(status === "heStartedChatWithNoMessages") {

			personInside.fadeOut(500,function(){
				noMessages.fadeIn(500);
				footer.fadeIn(500);
			});

			friend = data.users[0];
			// noMessagesImage.attr("src",data.avatars[0]);
			// noMessagesImage.attr("src", "http://gdpit.com/avatars_pictures/comics-creatures/cocr10.jpg");
		}

		else if(status === "chatStarted"){

			section.children().css('display','none');
			chatScreen.css('display','block');
		}

		else if(status === "somebodyLeft"){

			// leftImage.attr("src",data.avatar);
			leftNickname.text(data.user);

			section.children().css('display','none');
			footer.css('display', 'none');
			left.fadeIn(500);
		}

		else if(status === "tooManyPeople") {

			section.children().css('display', 'none');
			tooManyPeople.fadeIn(500);
		}
	}
});
