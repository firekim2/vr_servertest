var app = require('express')();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);

// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/sender', function(req, res) {
    res.sendFile(__dirname + '/test_sender.html');
})

var user_list = []

var upload_data = io.of('/upload_data').on('connection', function(socket) {

    //console.log(socket.id);
    //console.log(socket);

    socket.on('data-upload', function(data){ //by client
        let user_id = socket.user_id = data.user_id;
        let roll = socket.roll = data.roll;
        let yaw = socket.yaw = data.yaw;
        let pitch = socket.pitch = data.pitch;
        let status = socket.status = data.status;
        console.log(data);
        upload_data.to("console").emit('data-console', {"user_id" : user_id, "roll" : roll, "yaw" : yaw, "pitch" : pitch, "status" : status}); //to console
    });

    socket.on('request', function(data){
        console.log(data)
    })

    socket.on('request-username', function(data){
        if(typeof(data) == "string") data = JSON.parse(data);
        var user_category = socket.user_category = data.user_category;
        if(user_category == "client"){
            if(user_list.indexOf(socket.id) === -1) user_list.push(socket.id);
        }
        socket.join(user_category);
        let user_id = (user_category == "client") ? user_list.indexOf(socket.id) : -10; // console : -10 , client : 0 ~ n
        upload_data.to(socket.id).emit('sending-username', {"user_id" : user_id}); // only to sender
        upload_data.to("console").emit('join-room', {"user_id" : user_id, "socket_id" : socket.id}); // update to console
    })

    socket.on('disconnect', function(){
        if(socket.rooms == "client"){
            var user_id = user_list.indexOf(socket.id);
            user_list[user_list.indexOf(socket.id)] = "out";
        }
        upload_data.to("console").emit('leave-room', {"user_id" : user_id, "socket_id" : socket.id}); // update to console
    });

    socket.on('status-update', function(data){ //by console
        if(typeof(data) == "string") data = JSON.parse(data);
        upload_data.to("client").emit('status-update', {"status": data.status}); //to client
    })
})

server.listen(3000, function() {
  console.log('Socket IO server listening on port 3000');
});
