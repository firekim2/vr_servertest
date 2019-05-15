const sqlite = require('sqlite3');

let db = new sqlite.Database("./preset_device_id.sqlite3", (err) => {
    if (err) {
        console.log('Error when creating the database', err)
    } else {
        //console.log('Database created!')
        /* Put code to create table(s) here */
        //create_table()
        //insert_data(db, 'device_name_sample1', 'client_id_sample1');
        //insert_data(db, 'device_name_sample2', 'client_id_sample2');
        //insert_data('device_name_sample3', 'client_id_sample3');
        //remove_data('device_name_sample2');
        //read_all(db).then((rows) => {
        //    console.log(rows);
        //})
    }
})

const create_table = (db) => {
    console.log("create database table contacts");
    let sql = "CREATE TABLE IF NOT EXISTS device_id(id INTEGER PRIMARY KEY AUTOINCREMENT, device_name TEXT NOT NULL UNIQUE, client_id TEXT NOT NULL UNIQUE)";
    db.run(sql);
}

const insert_data = (db, device_name, client_id) => {
    return new Promise(function (resolve, reject){
        console.log(`Insert data [${device_name}: ${client_id}]`);
        let sql = 'INSERT INTO device_id (device_name, client_id) VALUES (?, ?)';
        db.run(sql, [device_name, client_id], (err) => {
            if(err) {
                reject(new Error(err.message));
            }
            resolve();
        });
    })
}

const update_data = (db, device_name, client_id) => {
    return new Promise(function (resolve, reject){
        console.log(`UPDATE data [${device_name}: ${client_id}]`);
        let sql = `UPDATE device_id
                            SET client_id = ?
                            WHERE device_name = ?`;
        db.run(sql, [client_id, device_name], (err) => {
            if(err) {
                reject(new Error(err.message));
            }
            resolve();
        });
    })
}

const read_all = (db) => {
    return new Promise(function (resolve, reject){
        console.log("Read all datas");
        let sql = `SELECT client_id client_id,
                          device_name device_name
                    FROM device_id
                    ORDER BY client_id`;
        db.all(sql, function(err, rows) {
            if (err) {
              reject(new Error(err.message));
            }
            resolve(rows);
        });
    })
}

const get_client_id = (db, device_name) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT client_id client_id,
                          device_name device_name
                    FROM device_id
                    WHERE device_name=?`;
        // first row only
        db.get(sql, [device_name], (err, row) => {
          if (err) {
              reject(new Error(err.message));
          }
          resolve(row);
        });
    })
}

const remove_data = (db, device_name) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT client_id client_id,
                          device_name device_name
                    FROM device_id
                    WHERE device_name=?`;
        db.all(sql, [device_name], (err, rows) => {
            if (err) {
                throw err;
            }
            if(rows && rows.length){
                //if there is
                db.run(`DELETE FROM device_id WHERE device_name=?`, device_name, function(err) {
                if (err) {
                    reject(new Error(err.message));
                }
                resolve(device_name);
                });
            }
            else{
                //if there is not
                reject(new Error(`There is no Row with device name of ${device_name}`));
            }
        });
    });
}

module.exports = {
    read_all: read_all,
    remove_data: remove_data,
    insert_data: insert_data,
    update_data: update_data,
    get_client_id: get_client_id
}
