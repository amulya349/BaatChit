
module.exports = function(path, app,io){

	var clients = []
	app.get('/chatapp', function(req, res){
		res.render('home');
	});

	app.get('/chat', function(req,res){
		var ip = req.connection.remoteAddress;
		console.log("User IP: "+ip)
		res.render('chat');
	});

	app.get('/', function(req, res){
		res.sendFile(path.join(__dirname, 'index.html'));
	})

	app.get('/getmyip', function(req, res){
		var ip = req.connection.remoteAddress;
		res.send("Your IP Address is : "+ip)
	})
	// Initialize a new socket.io application
	var chat = io.on('connection', function (socket) {

		// When the client emits the 'load' event, reply with the 
		// number of people in this chat room

		if(clients.length == 0){
			var key = Math.round((Math.random() * 1000000));
			clients.push(key);
			console.log("created and pushed key: "+key)
		}
		else {
			var key = clients.pop()
			console.log('popped and used key: '+key)
		}
		socket.emit('getid', { id : key})

		socket.on('load',function(data){
			var room = findClientsSocket(io,data);
			if(room.length === 0 ) {

				socket.emit('peopleinchat', {number: 0});
			}
			else if(room.length === 1) {

				socket.emit('peopleinchat', {
					number: 1,
					user: room[0].username,
					// avatar: room[0].avatar,
					id: data
				});
			}
			else if(room.length >= 2) {

				chat.emit('tooMany', {boolean: true});
			}
		});

		// When the client emits 'login', save his name and avatar,
		// and add them to the room
		socket.on('login', function(data) {

			var room = findClientsSocket(io, data.id);
			// Only two people per room are allowed
			if (room.length < 2) {

				// Use the socket object to store data. Each client gets
				// their own unique socket object

				socket.username = data.user;
				socket.room = data.id;
				// socket.avatar = gravatar.url(data.avatar, {s: '140', r: 'x', d: 'mm'});

				// Add the client to the room
				socket.join(data.id);

				if (room.length == 1) {
					var usernames = []
						// avatars = [];

					usernames.push(room[0].username);
					usernames.push(socket.username);

					// avatars.push(room[0].avatar);
					// avatars.push(socket.avatar);

					// Send the startChat event to all the people in the
					// room, along with a list of people that are in it.

					chat.in(data.id).emit('startChat', {
						boolean: true,
						id: data.id,
						users: usernames,
						// avatars: avatars
					});
				}
			}
			else {
				socket.emit('tooMany', {boolean: true});
			}
		});

		// Somebody left the chat
		socket.on('disconnect', function() {

			// Notify the other person in the chat room
			// that his partner has left

			socket.broadcast.to(this.room).emit('leave', {
				boolean: true,
				room: this.room,
				user: this.username,
				// avatar: this.avatar
			});

			// leave the room
			socket.leave(socket.room);
		});


		// Handle the sending of messages
		socket.on('msg', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room).emit('receive', {msg: data.msg, user: data.user, img: data.img});
			console.log(data.user+": "+data.msg)
		});
	});
};

function findClientsSocket(io,roomId, namespace) {
	var res = [],
		ns = io.of(namespace ||"/");    // the default namespace is "/"

	if (ns) {
		for (var id in ns.connected) {
			// console.log("id in ns.connected = "+ id)
			if(roomId) {
				var index = ns.connected[id].rooms.indexOf(roomId) ;
				if(index !== -1) {
					res.push(ns.connected[id]);
				}
			}
			else {
				res.push(ns.connected[id]);
			}
		}
	}
	
	return res;
}


