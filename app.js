var express = require('express');
var app = express();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);
const sqlite = require('sqlite3');
var body_parser = require('body-parser');
const db_query = require('./db_set');

let db = new sqlite.Database("./preset_device_id.sqlite3");

app.set('view engine', 'ejs');
app.use('/js', express.static(__dirname + "/js"));
app.use(body_parser.urlencoded({ extended : false }));
// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/sender', function(req, res) {
    res.sendFile(__dirname + '/test_sender.html');
})

app.get('/db_test', function(req, res) {
    db_query.read_all(db).then((rows) => {
        res.render('template/db_test', {rows : rows, host_url:"192.168.0.19:3000"});
    }).catch((err) => {
        console.error(err);
    });
})

app.post('/db_test_add', (req, res) => {
    db_query.insert_data(db, req.body._device_name, req.body._client_id).then(() => {
        res.redirect('/db_test');
    })
})

app.post('/db_test_update', (req, res) => {
    db_query.update_data(db, req.body._device_name, req.body._client_id).then(() => {
        res.redirect('/db_test');
    })
})


app.post('/db_test_delete', (req, res) => {
    console.log(req.body._selected_action);
    if(typeof(req.body._selected_action) == "string"){
        var temp = req.body._selected_action;
        req.body._selected_action = [];
        req.body._selected_action.push(temp);
    }
    req.body._selected_action.forEach((device_name) => {
        db_query.remove_data(db, device_name).then((removed_item) => {
            console.log(`${removed_item} is removed.`);
            res.redirect('/db_test');
        });
    })
});

var client_list = {}
var console_list = {}
var console_list = {}
var preset_device_id = {"1cf91a68100d7ece" : "client_1"}
var client_unknown_id = 0;
var console_id = 0;
var upload_data = io.of('/upload_data').on('connection', function(socket) {
    socket.on('data-upload', function(data){
        let roll = data.roll;
        let yaw = data.yaw;
        let pitch = data.pitch;
        let status = data.status;
        console.log(data);
        upload_data.to("console").emit('data-console', {"user_id" : socket.user_id, "roll" : roll, "yaw" : yaw, "pitch" : pitch, "status" : status}); //to console
    });

    socket.on('request', function(data){
        console.log(data)
    })

    socket.on('request-username', function(data){
        if(typeof(data) == "string") data = JSON.parse(data);
        socket.device_role = data.device_role;
        socket.device_id = data.device_id;
        console.log("New User enter. Role is : " + socket.device_role + ", and device id is : " + socket.device_id)
        socket.join(socket.device_role);
        if(socket.device_role == "client"){
            if(!(socket.id in client_list)){
                db_query.get_client_id(db, socket.device_id).then((row) => {
                    client_list[socket.id] = socket.user_id = (row) ? row.client_id : "client_unknown_id" + client_unknown_id++;
                    upload_data.to(socket.id).emit('receiving-username', {"user_id" : socket.user_id}); // only to sender
                    console.log("and user_id is named as : " + socket.user_id);
                    upload_data.to("console").emit('join-room', {"user_id" : socket.user_id, "socket_id" : socket.id}); // update to console
                }).catch((err) => {
                    console.error(err);
                });
            }
        }
        else{
          console.log(socket.id);
            if(!(socket.id in console_list)){
                console_list[socket.id] = socket.user_id = "console" + console_id++;
                upload_data.to(socket.id).emit('receiving-username', {"user_id" : socket.user_id}); // only to sender
                console.log("and user_id is named as : " + socket.user_id);
            }
        }
    })

    socket.on('disconnect', function(){
      console.log(socket.user_id + " is disconnected.");
      if(socket.device_role == "client"){
        upload_data.to("console").emit('leave-room', {"user_id" : socket.user_id, "socket_id" : socket.id}); // update to console
        delete client_list[socket.id];
      }
      else {
        delete console_list[socket.id];
      }
    });

    socket.on('client-to-console', function(data){
      data["user_id"] = socket.user_id;
      console.log(data);
      upload_data.to("console").emit('client-to-console', data);
    });

    socket.on('console-to-client', function(data){
      console.log(data);
      upload_data.to("client").emit('console-to-client', data);
    });

    socket.on('status-update', function(data){ //by console
        if(typeof(data) == "string") data = JSON.parse(data);
        upload_data.to("client").emit('status-update', {"status": data.status}); //to client
    })
})

server.listen(3000, function() {
  console.log('Socket IO server listening on port 3000');
});
