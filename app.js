var express = require('express');
var app = express();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);

app.use('/js', express.static(__dirname + "/js"));
// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/sender', function(req, res) {
    res.sendFile(__dirname + '/test_sender.html');
})

var client_list = {}
var console_list = {}
var preset_device_id = {"PRESET_DEVICE_ID_1" : "client_1"}
var client_unknown_id = 0;
var upload_data = io.of('/upload_data').on('connection', function(socket) {
var console_id = 0;
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
        var device_name = socket.device_name = data.device_name;
        if(user_category == "client"){
            if(!sokcet.id in client_list){
                client_list[socket.id] = (device_name in preset_device_id) ? preset_device_id[device_name] : "client_unknown_id" + unknown_id++;
            }
        }
        else{
            if(!socket.id in console_list){
                console_list[socket.id] = "console" + console_id++;
            }
        }
        socket.join(user_category);
        let user_id = (user_category == "client") ? client_list[socket.id] : console_list[socket.id];
        upload_data.to(socket.id).emit('receiving-username', {"user_id" : user_id}); // only to sender
        if(user_category == "client") upload_data.to("console").emit('join-room', {"user_id" : user_id, "socket_id" : socket.id}); // update to console
    })

    socket.on('disconnect', function(){
        if(socket.rooms == "client") delete client_list[socket.id];
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
